import { sendHttpRequestToOpenAi } from '@/foundation/open-ai/send-http-request'
import { getErrorMessage } from '@/misc/get-error-message'
import logger from '@/misc/logger'

export const hangUpOpenAiSipCall = async (
  callId: string,
  contactId: string
): Promise<void> => {
  try {
    const url = `https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/hangup`
    await sendHttpRequestToOpenAi(url, 'POST')
    logger.info(
      { callId, contactId },
      '[AmazonConnectPhone] OpenAI SIP call hung up'
    )
  } catch (error) {
    const errorDetails = getErrorMessage('hangUpOpenAiSipCall', error)
    logger.error(
      { ...errorDetails, callId, contactId },
      '[AmazonConnectPhone] hangUpOpenAiSipCall failed'
    )
  }
}
