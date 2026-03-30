import type { Express } from 'express'
import { Server as HttpServer } from 'http'
import { initTwilioPhoneHttpRoute } from './http-route'
import { initTwilioPhoneMediaStreamWebSocket } from '@/foundation/websocket'

/**
 * Twilio **phone** channel: HTTP `/twilio-phone/incoming-call` (TwiML) + native WebSocket `/twilio-phone/media-stream`.
 */
export const initTwilioPhoneChannel = (
  app: Express,
  httpServer: HttpServer
): void => {
  initTwilioPhoneHttpRoute(app)
  initTwilioPhoneMediaStreamWebSocket(httpServer)
}
