/** Twilio webhook path for voice (TwiML). Configure this URL on your Twilio phone number. */
export const TWILIO_PHONE_INCOMING_CALL_PATH = '/twilio-phone/incoming-call'

/** WebSocket path for Twilio Media Streams. `TWILIO_WEBHOOK_URL` must use this path (e.g. `wss://host/twilio-phone/media-stream`). */
export const TWILIO_PHONE_MEDIA_STREAM_PATH = '/twilio-phone/media-stream'
