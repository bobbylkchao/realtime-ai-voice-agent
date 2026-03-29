import type { Express } from 'express'
import { Server as HttpServer } from 'http'
import { initTwilioPhoneHttpRoute } from './http-route'
import { initTwilioPhoneMediaStreamWebSocket } from '@/foundation/websocket'

/**
 * Twilio **phone** channel: HTTP `/incoming-call` (TwiML) + native WebSocket `/media-stream`.
 */
export const initTwilioPhoneChannel = (
  app: Express,
  httpServer: HttpServer
): void => {
  initTwilioPhoneHttpRoute(app)
  initTwilioPhoneMediaStreamWebSocket(httpServer)
}
