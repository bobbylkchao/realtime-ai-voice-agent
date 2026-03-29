import { Server as HttpServer } from 'http'
import { initWebVoiceSocketIO } from '@/foundation/websocket'

/**
 * Browser / web channel: Socket.IO on `/realtime-voice`.
 */
export const initWebVoiceChannel = (httpServer: HttpServer): void => {
  initWebVoiceSocketIO(httpServer)
}
