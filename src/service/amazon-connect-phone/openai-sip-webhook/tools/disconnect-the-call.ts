import { z } from 'zod'
import logger from '@/misc/logger'
import { updateContactAttributes } from '@/foundation/amazon-connect/update-attributes'
import { getContactId, deleteCall } from '../call-store'
import { hangUpOpenAiSipCall } from '../handle-call/hang-up-call'
import { closeOpenAiSipWebSocketForCall } from '../websocket/connect-to-call'

const disconnectTheCallParams = z.object({})

export const disconnectTheCallParametersJsonSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

/**
 * Ends the call when the customer clearly wants to hang up.
 * Optionally sets Amazon Connect contact attributes when the SDK client is initialized.
 */
export const disconnectTheCallTool = {
  name: 'disconnect_the_call',
  description:
    "Call this only when the customer explicitly wants to end the call—e.g. 'thanks, bye', 'I'm done', 'goodbye', or equivalent. Do not call this if only you suggested ending; the customer must have indicated they are finished.",
  parameters: disconnectTheCallParams,
  parametersJsonSchema: disconnectTheCallParametersJsonSchema,
  execute: async (callId: string, args: unknown): Promise<void> => {
    disconnectTheCallParams.parse(args ?? {})
    const contactId = getContactId(callId)

    if (contactId && process.env.AMAZON_CONNECT_SDK_ENABLE === 'true') {
      await updateContactAttributes(contactId, {
        AIVoiceAgent_Disconnect_Reason: 'customer-initiated',
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
