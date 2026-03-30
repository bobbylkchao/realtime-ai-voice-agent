import type { Express } from 'express'
import logger from '@/misc/logger'

/** Twilio phone webhook: returns TwiML that starts Media Streams to `/media-stream`. */
export const initTwilioPhoneHttpRoute = (app: Express) => {
  if (
    process.env.TWILIO_PHONE_ENABLE !== 'true' ||
    !process.env.TWILIO_WEBHOOK_URL
  ) {
    logger.info(
      '[TwilioPhone] Skip Twilio HTTP route (disabled or missing TWILIO_WEBHOOK_URL)'
    )
    return
  }

  app.all('/incoming-call', (req, res) => {
    const mediaStreamUrl = process.env.TWILIO_WEBHOOK_URL

    const twimlResponse = `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${mediaStreamUrl}" />
  </Connect>
</Response>`.trim()

    logger.info(
      {
        mediaStreamUrl,
        callerId: req.body?.From || req.query?.From,
      },
      '[TwilioPhone] Incoming call — sending TwiML'
    )

    res.type('text/xml').send(twimlResponse)
    logger.info(
      '[TwilioPhone] TwiML sent; Twilio will open Media Stream WebSocket'
    )
  })
}
