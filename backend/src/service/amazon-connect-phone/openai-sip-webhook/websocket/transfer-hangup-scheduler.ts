import logger from '@/misc/logger'

/**
 * When the model speaks and calls `transfer_to_human_agent` in the same response, we receive
 * `conversation.item.done` (function_call) before the callee has finished hearing the assistant
 * audio. Hanging up immediately closes the Realtime leg and cuts off playback.
 *
 * We wait until `response.done` for that turn (output includes the transfer tool), then add a
 * configurable tail delay so PSTN/SIP audio can finish.
 */

type TransferState = {
  argumentsJson?: string
  /** True after we see `response.done` whose output includes this transfer tool. */
  transferResponseDone: boolean
  timer?: NodeJS.Timeout
}

const stateByCallId = new Map<string, TransferState>()

const getTailMs = (): number => {
  const n = parseInt(process.env.SIP_TRANSFER_AUDIO_TAIL_MS ?? '3500', 10)
  return Number.isFinite(n) && n >= 0 ? n : 3500
}

const tryScheduleHangup = (callId: string): void => {
  const s = stateByCallId.get(callId)
  if (!s?.argumentsJson || !s.transferResponseDone || s.timer) return

  const tailMs = getTailMs()
  logger.info(
    { callId, tailMs },
    '[AmazonConnectPhone] Scheduling transfer hangup after response audio tail'
  )

  s.timer = setTimeout(() => {
    stateByCallId.delete(callId)
    const args = s.argumentsJson
    if (!args) return
    // Dynamic import avoids a circular dependency (transfer tool imports websocket close).
    void import('../tools/transfer-to-human-agent').then(
      ({ runTransferToHumanAgentHangup }) =>
        runTransferToHumanAgentHangup(callId, args)
    ).catch((err: unknown) => {
      logger.error(
        { callId, err },
        '[AmazonConnectPhone] runTransferToHumanAgentHangup failed'
      )
    })
  }, tailMs)
}

/** Call when a server message is `response.done` and output includes `transfer_to_human_agent`. */
export const noteTransferResponseDone = (callId: string, message: unknown): void => {
  const m = message as {
    type?: string
    response?: {
      output?: Array<{ type?: string; name?: string }>
    }
  }
  if (m.type !== 'response.done' || !m.response?.output?.length) return

  const hasTransfer = m.response.output.some(
    (item) => item?.type === 'function_call' && item?.name === 'transfer_to_human_agent'
  )
  if (!hasTransfer) return

  const s: TransferState = stateByCallId.get(callId) ?? {
    transferResponseDone: false,
  }
  s.transferResponseDone = true
  stateByCallId.set(callId, s)
  tryScheduleHangup(callId)
}

/**
 * Call when `conversation.item.done` is received for the transfer tool (before executing hangup).
 */
export const queueTransferToolArguments = (callId: string, argumentsJson: string): void => {
  const s: TransferState = stateByCallId.get(callId) ?? {
    transferResponseDone: false,
  }
  s.argumentsJson = argumentsJson
  stateByCallId.set(callId, s)
  tryScheduleHangup(callId)
}

export const clearTransferHangupSchedule = (callId: string): void => {
  const s = stateByCallId.get(callId)
  if (s?.timer) clearTimeout(s.timer)
  stateByCallId.delete(callId)
}
