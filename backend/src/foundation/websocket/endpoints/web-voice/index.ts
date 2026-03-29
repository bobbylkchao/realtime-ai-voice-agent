import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { VoiceSessionManager } from '@/foundation/open-ai'
import { handleWebVoiceChannelEvent } from './handler'
import type { RealtimeVoiceEventName, RealtimeVoiceMessage } from '../../types'
import logger from '@/misc/logger'

export const initWebVoiceSocketIOServer = (httpServer: HttpServer) => {
  const wsServer = new Server(httpServer, {
    transports: ['websocket'],
    path: '/realtime-voice',
    cors: {
      origin: '*',
    },
  })

  logger.info('[WebVoice] Socket.IO server initialized')

  wsServer.on('connection', (socket) => {
    logger.info(`[WebVoice] Client connected: ${socket.id}`)

    socket.on('message', (message: RealtimeVoiceMessage) => {
      const eventName = message?.event as RealtimeVoiceEventName
      const eventData = message?.data as ArrayBuffer
      handleWebVoiceChannelEvent(eventName, eventData, socket)
    })

    socket.on('connect_error', (error) => {
      logger.error(
        { error, socketId: socket.id },
        '[WebVoice] Connection error'
      )
    })

    socket.on('disconnect', async (reason: string) => {
      logger.info(
        `[WebVoice] Client disconnected: ${socket.id}, reason: ${reason}`
      )
      const sessionManager = new VoiceSessionManager()
      try {
        await sessionManager.closeUserSession(socket.id)
      } catch (error) {
        logger.error(
          { error, clientId: socket.id },
          '[WebVoice] Error closing user session'
        )
      }
    })
  })
}
