# Local testing: Twilio and Amazon Connect + SIP + OpenAI webhook

This guide explains how to exercise the **two phone-related channels** of this repo on your machine. Both require a **public HTTPS (and for Twilio, WSS) URL**, so you will use a tunnel (ngrok, Cloudflare Tunnel, localtunnel, etc.).

## Prerequisites

- Backend running (`cd backend && npm run dev`), default port `4000`
- Optional: open **`http://localhost:4000/status`** (or your tunnel host) to confirm which channels and webhooks are active before placing test calls
- `OPENAI_API_KEY` with access to the **Realtime** / phone features you use
- A tunnel that gives you `https://something.example` (and the matching `wss://` host for Twilio Media Streams)

---

## 1. Twilio (TwiML + Media Stream WebSocket)

### What gets hit

1. Twilio requests **TwiML** from your server: `POST/GET https://<host>/incoming-call`
2. Twilio opens a **WebSocket** to `TWILIO_WEBHOOK_URL` (must be `wss://...` in production; for local tunnels, `wss://<same-ngrok-host>/media-stream`)

### Environment (`backend/.env`)

```env
TWILIO_PHONE_ENABLE=true
TWILIO_WEBHOOK_URL=wss://YOUR_TUNNEL_HOST/media-stream
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-realtime-1.5
```

### Tunnel

Example with ngrok:

```bash
ngrok http 4000
```

Copy the **HTTPS** URL (e.g. `https://abc123.ngrok-free.app`). Your WebSocket URL is the same host with `wss://`:

`wss://abc123.ngrok-free.app/media-stream`

Set `TWILIO_WEBHOOK_URL` to that `wss://.../media-stream` value.

### Twilio Console

- **Phone number → Voice configuration**
- **A call comes in**: Webhook URL `https://abc123.ngrok-free.app/incoming-call`, HTTP POST (GET also works with this app)

### Verify

- Place a test call to the Twilio number.
- Backend logs should show `[TwilioPhone]` lines and MCP/OpenAI connection logs.
- Implementation entry points:
  - `backend/src/service/twilio-phone/` (`initTwilioPhoneChannel`)
  - `backend/src/foundation/websocket/endpoints/twilio-phone/`

---

## 2. Amazon Connect + SIP (to OpenAI) + OpenAI `realtime.call.incoming` webhook

This path is **different from Twilio**: audio goes **Connect → OpenAI over SIP**; your Node app only receives the **HTTP webhook** from OpenAI and then calls **accept** + the **OpenAI Realtime WebSocket** for tools/session events.

### What gets hit

- **OpenAI** sends `POST https://<your-backend>/amazon-connect-openai-voice-agent/incoming-call` (unless you change `AMAZON_CONNECT_PHONE_WEBHOOK_BASE_PATH`)
- Your app responds and drives the call via the Realtime Calls API (see `backend/src/service/amazon-connect-phone/openai-sip-webhook/`)

### Environment (`backend/.env`)

```env
AMAZON_CONNECT_PHONE_ENABLE=true
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-realtime-1.5
# Optional: custom path
# AMAZON_CONNECT_PHONE_WEBHOOK_BASE_PATH=/amazon-connect-openai-voice-agent
```

Optional **Amazon Connect contact attributes** when the model hangs up (SDK):

```env
AMAZON_CONNECT_SDK_ENABLE=true
AMAZON_CONNECT_INSTANCE_ID=your-instance-id
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Tunnel

Same idea as Twilio: expose port `4000` and use the **HTTPS** URL as the base for the OpenAI webhook.

Example webhook URL you register in the **OpenAI** dashboard (Realtime / SIP / phone integration):

`https://abc123.ngrok-free.app/amazon-connect-openai-voice-agent/incoming-call`

### AWS side (high level)

Exact clicks change often; you typically:

1. **OpenAI**: Complete SIP / phone onboarding so OpenAI gives you a **SIP endpoint** and lets you set the **webhook URL** above for `realtime.call.incoming`.
2. **Amazon Connect**: Use a **SIP connection** (or **SIP rule / external transfer** pattern) so calls can reach OpenAI’s SIP trunk as described in OpenAI’s Connect integration guide.
3. **User-to-User (UUI)** / attributes: If you pass hex-encoded JSON in the SIP `User-to-User` header, this repo decodes it in `openai-sip-webhook/webhook/incoming-call.ts` (same idea as `phone-sales-ai-copilot`).

Use AWS and OpenAI documentation as the source of truth for trunk FQDN, authentication, and Connect contact flow blocks.

### Verify

- Trigger a test call through Connect into OpenAI SIP.
- Your tunnel should show a **POST** to `.../incoming-call`.
- Backend logs should include `[AmazonConnectPhone] realtime.call.incoming received` and accept/WS logs.

### Code map

- Channel bootstrap: `backend/src/service/amazon-connect-phone/index.ts` (`initAmazonConnectPhoneChannel`)
- Webhook + accept + WS: `backend/src/service/amazon-connect-phone/openai-sip-webhook/`
- Connect SDK helper: `backend/src/foundation/amazon-connect/`

---

## 3. Quick comparison

| Item | Twilio channel | Amazon Connect + OpenAI SIP channel |
|------|----------------|-------------------------------------|
| This repo serves | TwiML + `/media-stream` WS | **Only** OpenAI webhook + OpenAI Realtime WS to OpenAI |
| Audio path | Twilio ↔ your server ↔ OpenAI | Connect ↔ OpenAI SIP ↔ OpenAI (your server is control-plane) |
| Env flags | `TWILIO_PHONE_ENABLE`, `TWILIO_WEBHOOK_URL` | `AMAZON_CONNECT_PHONE_ENABLE` |
| Tunnel needs | `https` + `wss` to same host | `https` for webhook |

---

## 4. Web voice (no tunnel)

Browser UI uses Socket.IO on `/realtime-voice`; local testing is just frontend + backend on `localhost` — no tunnel required unless the browser is on another device.

See also: [Backend architecture](./backend-voice-ai-agent-design.md) and [Amazon Connect + OpenAI webhook](../backend/docs/amazon-connect-openai-webhook.md).
