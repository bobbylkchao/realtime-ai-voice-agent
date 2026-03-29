import express from 'express'
import { config } from 'dotenv'
import { createServer } from 'http'
import logger from '@/misc/logger'
import { initMcpServers } from '@/foundation/mcp-server'
import { initWebVoiceChannel } from '@/service/web-voice'
import { initTwilioPhoneChannel } from '@/service/twilio-phone'
import { initAmazonConnectPhoneChannel } from '@/service/amazon-connect-phone'
import { registerStatusRoutes } from '@/misc/status-routes'

config()

const startServices = async () => {
  logger.info('[Server] Starting server')

  const PORT = Number(process.env.PORT) || 4000

  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  registerStatusRoutes(app, PORT)
  const httpServer = createServer(app)

  initTwilioPhoneChannel(app, httpServer)
  initAmazonConnectPhoneChannel(app)
  initWebVoiceChannel(httpServer)
  initMcpServers(app, PORT)

  httpServer.listen(PORT, () => {
    logger.info(
      `[Server] Check status page: http://localhost:${PORT}/status (urls, webhooks, MCP endpoints)`
    )
    logger.info('[Server] Server started successfully')
  })
}

try {
  startServices()
} catch (err) {
  logger.error({ err }, '[Server] Application start failed due to error')
}
