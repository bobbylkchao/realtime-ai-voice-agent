import type { Express } from 'express'
import logger from '@/misc/logger'
import { handleOpenAiSipIncomingCallWebhook } from './webhook/incoming-call'

/**
 * Base path for OpenAI Realtime SIP webhook routes.
 * Override with AMAZON_CONNECT_PHONE_WEBHOOK_BASE_PATH.
 */
export const getOpenAiSipWebhookBasePath = (): string =>
  process.env.AMAZON_CONNECT_PHONE_WEBHOOK_BASE_PATH ||
  '/amazon-connect-openai-voice-agent'

/**
 * Registers POST .../incoming-call for OpenAI `realtime.call.incoming`.
 * Enable with AMAZON_CONNECT_PHONE_ENABLE=true.
 */
export const registerOpenAiSipWebhookRoutes = (app: Express): void => {
  if (process.env.AMAZON_CONNECT_PHONE_ENABLE !== 'true') {
    logger.info(
      '[AmazonConnectPhone] OpenAI SIP webhook disabled (set AMAZON_CONNECT_PHONE_ENABLE=true)'
    )
    return
  }

  const base = getOpenAiSipWebhookBasePath()
  app.post(`${base}/incoming-call`, handleOpenAiSipIncomingCallWebhook)
}
