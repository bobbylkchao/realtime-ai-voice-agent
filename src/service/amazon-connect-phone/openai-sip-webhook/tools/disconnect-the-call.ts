import { z } from 'zod'
import logger from '@/misc/logger'
import { updateContactAttributes } from '@/foundation/amazon-connect/update-attributes'
import { getContactId, deleteCall } from '../call-store'
import { hangUpOpenAiSipCall } from '../handle-call/hang-up-call'
import { closeOpenAiSipWebSocketForCall } from '../websocket/connect-to-call'

const summaryDescribe =
  'Short plain narrative of the call for audit (no PII): never include real name, email, phone, or other identifiers—refer to the caller only as "Customer". Write a simple chronological log: what the call was about, what the customer wanted or asked, what the assistant said or offered, and who asked to hang up (Customer or AI agent). Do not use field labels such as "Initiator" or "Reason"—just a few flowing sentences. Use the same language as the conversation when practical. Example: "Customer asked if this line was a specific hotel; assistant said we are a travel service, not the hotel; Customer said they only wanted to reach the hotel and asked to end the call."'

const disconnectTheCallParams = z.object({
  summary: z.string().optional().describe(summaryDescribe),
})

export const disconnectTheCallParametersJsonSchema = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: summaryDescribe,
    },
  },
  additionalProperties: false,
} as const

/**
 * Ends the call when the customer clearly wants to hang up.
 * Optionally sets Amazon Connect contact attributes when the SDK client is initialized.
 *
 * For SIP, prefer scheduling via `disconnect-hangup-scheduler` so hangup runs after assistant
 * audio finishes (see `runDisconnectTheCallHangup`).
 */
export const runDisconnectTheCallHangup = async (
  callId: string,
  rawArgs: string | Record<string, unknown>
): Promise<void> => {
  const args =
    typeof rawArgs === 'string'
      ? (JSON.parse(rawArgs || '{}') as Record<string, unknown>)
      : rawArgs
  const parsed = disconnectTheCallParams.parse(args ?? {})
  const contactId = getContactId(callId)

  if (contactId && process.env.AMAZON_CONNECT_SDK_ENABLE === 'true') {
    await updateContactAttributes(contactId, {
      AIVoiceAgentHandoff: 'false',
      AIVoiceAgentConversationSummary: parsed.summary ?? '',
    })
    logger.info(
      { callId, contactId },
      '[AmazonConnectPhone] Contact attributes updated for disconnect'
    )
  }

  closeOpenAiSipWebSocketForCall(callId)
  deleteCall(callId)
  await hangUpOpenAiSipCall(callId, contactId ?? '')

  logger.info(
    { callId, contactId },
    '[AmazonConnectPhone] disconnect_the_call completed'
  )
}

export const disconnectTheCallTool = {
  name: 'disconnect_the_call',
  description:
    "Use only when the customer clearly wants to end the call (e.g. thanks/bye/done/goodbye). Do not use if only you suggested hanging up. **Before calling this tool, you must speak a short polite closing in the same assistant turn** (thank them and say goodbye in the call language)—never emit only this tool with no spoken audio. If their last utterance had no transcript, still say a brief goodbye, then call this. Provide `summary`: a brief chronological narrative of the call (topic, customer needs, what you said, who asked to hang up); no PII—use 'Customer' only; no 'Initiator/Reason' labels.",
  parameters: disconnectTheCallParams,
  parametersJsonSchema: disconnectTheCallParametersJsonSchema,
  execute: async (callId: string, args: unknown): Promise<void> => {
    await runDisconnectTheCallHangup(callId, args as Record<string, unknown>)
  },
}
