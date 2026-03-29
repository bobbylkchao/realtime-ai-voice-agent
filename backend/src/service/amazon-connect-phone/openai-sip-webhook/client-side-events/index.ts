import type WebSocket from 'ws'

/** Default TTS speed (1.0 = normal). OpenAI allows up to 1.5. */
const AUDIO_SPEED = 1.1

/**
 * session.update: audio output (voice, speed) and input (noise reduction, VAD).
 * Send after WebSocket open, before model audio.
 * @see https://platform.openai.com/docs/api-reference/realtime-client-events/session/update
 */
export const sendSessionUpdateSpeed = (ws: WebSocket): void => {
  ws.send(
    JSON.stringify({
      type: 'session.update',
      session: {
        type: 'realtime',
        audio: {
          input: {
            noise_reduction: { type: 'far_field' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.6,
              silence_duration_ms: 600,
            },
          },
          output: {
            voice: 'marin',
            speed: AUDIO_SPEED,
          },
        },
      },
    })
  )
}

export const sendResponseCreateEvent = (ws: WebSocket): void => {
  ws.send(JSON.stringify({ type: 'response.create' }))
}

/**
 * After executing a tool, inject function_call_output so the model can continue.
 */
export const sendFunctionCallOutput = (
  ws: WebSocket,
  functionCallId: string,
  output: string
): void => {
  ws.send(
    JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: functionCallId,
        output,
      },
    })
  )
}
