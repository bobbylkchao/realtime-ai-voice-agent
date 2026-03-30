# ai-phone-agent

<p align="center">
  <img src="./doc/assets/ai-phone-agent.png" alt="AI Phone Agent: caller connects via Twilio or Amazon Connect; the backend lets an AI answer and talk on the call." width="720" />
</p>

An **AI Phone Agent** backend: a **Node.js** server you plug into **Twilio** or **Amazon Connect** so callers reach an AI that **answers the phone** and **talks to customers** in real time, powered by **[OpenAI Realtime](https://platform.openai.com/docs/guides/realtime)**. Optional tools (hang up, transfer to a person, collect info, etc.), optional **[MCP](https://modelcontextprotocol.io/)** servers, and **`/status`** help you wire it up and test locally (e.g. with ngrok).

**Requires Node.js ≥ 16.**

## Try it

**Try it by calling [+1 (855) 522-2348](tel:+18555222348)** — a sample **AI Phone Agent** built on this starter kit using **Amazon Connect** and **OpenAI SIP**. The AI acts as a human agent, holding a near-real-time conversation with callers to capture trip intent and answer trip-related questions.

## Layout

- **`src/foundation/`** — OpenAI agents & helpers, MCP servers, Twilio WebSocket (`/media-stream`), Amazon Connect SDK.
- **`src/service/`** — `twilio-phone`, `amazon-connect-phone` (OpenAI SIP webhook under `openai-sip-webhook/`).

TypeScript **`@/*` → `src/*`**; **`tsc-alias`** rewrites imports in `dist/`.

Entry: **`src/index.ts`** — `initTwilioPhoneChannel`, `initAmazonConnectPhoneChannel`, `initMcpServers`.

## Quick start

```sh
npm install
cp .env.example .env   # set OPENAI_API_KEY, etc.
npm run dev
```

Server default: `http://localhost:4000`. **`GET /status`** and **`GET /status.json`** list enabled channels and URLs.

## Environment (summary)

See **`.env.example`**. Typical keys:

- `OPENAI_API_KEY`, `OPENAI_MODEL` (e.g. `gpt-realtime-1.5`)
- `PORT` (default `4000`)
- **Twilio**: `TWILIO_PHONE_ENABLE`, `TWILIO_WEBHOOK_URL` (wss Media Stream URL)
- **Amazon Connect + SIP**: `AMAZON_CONNECT_PHONE_ENABLE`, `AMAZON_CONNECT_PHONE_WEBHOOK_BASE_PATH`, optional `AMAZON_CONNECT_SDK_ENABLE` + AWS

## Docs

| Doc | Topic |
|-----|--------|
| [doc/ai-phone-agent-architecture.md](./doc/ai-phone-agent-architecture.md) | Architecture |
| [doc/twilio-integration.md](./doc/twilio-integration.md) | Twilio |
| [doc/amazon-connect-openai-webhook.md](./doc/amazon-connect-openai-webhook.md) | Connect + OpenAI SIP |
| [doc/local-testing-twilio-and-amazon-connect-sip.md](./doc/local-testing-twilio-and-amazon-connect-sip.md) | ngrok / tunnels |

## Scripts

- `npm run dev` — nodemon
- `npm run build` / `npm run start` — compile + `node dist/index.js`
- `npm run lint` — ESLint
- `npm run format` — Prettier

## License

MIT
