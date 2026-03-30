import { z } from 'zod'
import logger from '@/misc/logger'
import { updateContactAttributes } from '@/foundation/amazon-connect/update-attributes'
import { deleteCall, getContactId, getTripIntake } from '../call-store'
import { hangUpOpenAiSipCall } from '../handle-call/hang-up-call'
import { closeOpenAiSipWebSocketForCall } from '../websocket/connect-to-call'

const transferSchema = z.object({
  summary: z
    .string()
    .optional()
    .describe(
      'Brief summary for the human agent: customer name, trip goals, and what to do next.'
    ),
})

export const transferToHumanAgentParametersJsonSchema = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description:
        'Brief summary for the human agent: customer name, trip goals, and what to do next.',
    },
  },
  additionalProperties: false,
} as const

/**
 * Ends the AI leg so Connect can route to a queue/agent; optionally writes intake + summary to
 * contact attributes when the Connect SDK is configured.
 *
 * For SIP, prefer scheduling via `transfer-hangup-scheduler` so hangup runs after assistant
 * audio finishes (see `runTransferToHumanAgentHangup`).
 */
export const runTransferToHumanAgentHangup = async (
  callId: string,
  rawArgs: string | Record<string, unknown>
): Promise<void> => {
  const args =
    typeof rawArgs === 'string'
      ? (JSON.parse(rawArgs || '{}') as Record<string, unknown>)
      : rawArgs
  const parsed = transferSchema.parse(args ?? {})
  const contactId = getContactId(callId)
  const intake = getTripIntake(callId) ?? {}
  const payload = {
    ...intake,
    ...(parsed.summary && { summary: parsed.summary }),
  }

  if (contactId && process.env.AMAZON_CONNECT_SDK_ENABLE === 'true') {
    await updateContactAttributes(contactId, {
      AIVoiceAgentHandoff: JSON.stringify(payload),
    })
    logger.info(
      { callId, contactId },
      '[AmazonConnectPhone] Contact attributes updated for human handoff'
    )
  } else if (contactId) {
    logger.info(
      { callId, contactId, payload },
      '[AmazonConnectPhone] Handoff payload (SDK disabled; not written to Connect)'
    )
  }

  closeOpenAiSipWebSocketForCall(callId)
  deleteCall(callId)
  await hangUpOpenAiSipCall(callId, contactId ?? '')

  logger.info(
    { callId, contactId },
    '[AmazonConnectPhone] transfer_to_human_agent completed'
  )
}

export const transferToHumanAgentTool = {
  name: 'transfer_to_human_agent',
  description:
    'Call when intake is complete (you have the customer’s name and enough trip requirements) or when they ask for a human. Summarize the call for the next agent. This ends the AI portion of the call so Amazon Connect can continue routing.',
  parameters: transferSchema,
  parametersJsonSchema: transferToHumanAgentParametersJsonSchema,
  execute: async (callId: string, args: unknown): Promise<void> => {
    await runTransferToHumanAgentHangup(callId, args as Record<string, unknown>)
  },
}
