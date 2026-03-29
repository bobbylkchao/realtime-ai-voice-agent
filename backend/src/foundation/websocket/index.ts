import { Server as HttpServer } from 'http'
import logger from '@/misc/logger'
import { initWebVoiceSocketIOServer } from './endpoints/web-voice'
import { initTwilioPhoneMediaStreamWebSocketServer } from './endpoints/twilio-phone/media-stream'

/** Socket.IO server for browser / web voice (path `/realtime-voice`). */
export const initWebVoiceSocketIO = (httpServer: HttpServer): void => {
  initWebVoiceSocketIOServer(httpServer)
}

/**
 * Native WebSocket server for Twilio Media Streams (`/media-stream`).
 * No-op when TWILIO_PHONE_ENABLE is not `true`.
 */
export const initTwilioPhoneMediaStreamWebSocket = (
  httpServer: HttpServer
): void => {
  if (process.env.TWILIO_PHONE_ENABLE !== 'true') {
    logger.info('[TwilioPhone] Skip initializing Media Stream WebSocket server')
    return
  }
  initTwilioPhoneMediaStreamWebSocketServer(httpServer)
}
