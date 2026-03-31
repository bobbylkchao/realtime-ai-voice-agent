import { z } from 'zod'
import logger from '@/misc/logger'
import { updateContactAttributes } from '@/foundation/amazon-connect/update-attributes'
import { getContactId, deleteCall } from '../call-store'
import { hangUpOpenAiSipCall } from '../handle-call/hang-up-call'
import { closeOpenAiSipWebSocketForCall } from '../websocket/connect-to-call'

const disconnectTheCallParams = z.object({
  summary: z
    .string()
    .optional()
    .describe(
      'Brief session summary for audit/review: what the customer wanted, outcome, and any notable details.'
    ),
})

export const disconnectTheCallParametersJsonSchema = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description:
        'Brief session summary for audit/review: what the customer wanted, outcome, and any notable details.',
    },
  },
  additionalProperties: false,
} as const

/**
 * Ends the call when the customer clearly wants to hang up.
 * Optionally sets Amazon Connect contact attributes when the SDK client is initialized.
 */
export const disconnectTheCallTool = {
  name: 'disconnect_the_call',
  description:
    "Call this only when the customer explicitly wants to end the call—e.g. 'thanks, bye', 'I'm done', 'goodbye', or equivalent. Do not call this if only you suggested ending; the customer must have indicated they are finished. Provide a brief summary for audit/review.",
  parameters: disconnectTheCallParams,
  parametersJsonSchema: disconnectTheCallParametersJsonSchema,
  execute: async (callId: string, args: unknown): Promise<void> => {
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
  },
}
