# Fleet Operations WhatsApp Bot

Production-oriented WhatsApp bot for fleet operations, built with Node.js and Baileys. The bot handles document checks/updates, tire stock workflows, user approval, audit logging, and role-based command access, while integrating with a Laravel backend and Redis.

## 1. Project Title & Description

This project is an internal WhatsApp automation service for fleet teams. It receives commands from authorized users/groups, validates access and roles, executes business operations through a Laravel API, and stores auth/session state in Redis for fast, reliable multi-step interactions.

## 2. Features

- WhatsApp command interface using Baileys
- Vehicle document lookup (`CEK SURAT`)
- Interactive multi-step document update flow (`UPDATE SURAT`)
- Tire stock check (`CEK STOCK BAN`)
- Tire data update (`UPDATE BAN`)
- Daily alert trigger (`ALERT HARI INI`)
- User registration and approval workflow
- Role-based permissions (`viewer`, `operator`, `admin`, `superadmin`)
- Allowlist for personal and group chats
- Redis-backed auth caching and session flow state
- Audit logging to Laravel API
- Health endpoint for operational checks

## 3. Architecture Overview

High-level flow:

`WhatsApp (Baileys) -> commandRouter/sessionHandler -> Service Layer -> Repository Layer -> Laravel API`

`Redis` is used in parallel for auth cache and session flow state.

- `commandRouter`: normalizes incoming messages, checks allowlist, verifies user auth/role, resolves command handlers.
- `sessionHandler`: continues active multi-step flows (for example `UPDATE SURAT`) using Redis session state.
- `services`: business logic orchestration (fleet operations, auth cache, session lifecycle).
- `repositories`: backend API data access (fleet data, user approval, audit logs).

## 4. Tech Stack

- Node.js (CommonJS)
- Baileys (`@whiskeysockets/baileys`)
- Redis
- Laravel API backend (secured via `x-api-key`)
- Docker and Docker Compose
- Pino (structured logging)

## 5. Project Structure

```text
src/
  handlers/
    commands/
    sessionFlows/
  services/
  repositories/
  utils/
  config/
```

- `handlers/commands`: command definitions, regex patterns, permission checks, and execution entry points.
- `handlers/sessionFlows`: step-by-step flow logic for interactive commands (for example `UPDATE_SURAT`).
- `services`: orchestration layer for fleet operations, auth cache, and Redis session management.
- `repositories`: API access layer for fleet data, user management, and audit logs.
- `utils`: helper functions (message normalization, sender normalization, access control, formatting).
- `config`: environment parsing and logger setup.

## 6. Environment Variables

```env
WA_ENABLED=true
WA_AUTH_DIR=.wa-auth
API_BASE_URL=https://your-laravel-api
API_KEY=your-api-key
REDIS_URL=redis://127.0.0.1:6379
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_SECONDS=10
ALLOW_PERSONAL=true
ALLOW_GROUP=true
ALLOWED_USERS=
ALLOWED_GROUPS=
```

- `WA_ENABLED`: enable or disable WhatsApp adapter startup.
- `WA_AUTH_DIR`: directory for Baileys auth/session files.
- `API_BASE_URL`: Laravel API base URL (in current code this is `TMS_API_BASE_URL`).
- `API_KEY`: API key sent as `x-api-key` header (in current code this is `TMS_API_KEY`).
- `REDIS_URL`: single Redis connection URL (current code uses split vars: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`).
- `RATE_LIMIT_ENABLED`: enables/disables Redis-based command rate limiting.
- `RATE_LIMIT_MAX_REQUESTS`: max allowed command count in each rate limit window.
- `RATE_LIMIT_WINDOW_SECONDS`: time window (seconds) used by the limiter.
- `ALLOW_PERSONAL`: allow personal chats when no explicit allowlist is set.
- `ALLOW_GROUP`: allow group chats when no explicit allowlist is set.
- `ALLOWED_USERS`: comma-separated personal JIDs allowlist (overrides `ALLOW_PERSONAL` when populated).
- `ALLOWED_GROUPS`: comma-separated group JIDs allowlist (overrides `ALLOW_GROUP` when populated).

Recommended additional env in this project:

```env
APP_HOST=0.0.0.0
APP_PORT=3000
LOG_LEVEL=info
BACKEND_HEALTH_PATH=/api/wa-bot/users/health
```

## 7. Installation (Local)

```bash
npm install
npm run dev
```

Then scan the QR code shown in terminal to connect the WhatsApp account.

## 8. Running with Docker

```bash
docker compose up -d --build
```

What runs:

- `fleet-wa-bot` container: Node.js application serving WhatsApp bot + health endpoint.
- `redis` service: Redis instance for auth cache and session flows.
- Volumes:
  - `./.wa-auth:/app/.wa-auth` for WhatsApp auth persistence.
  - `./data:/app/data` for local JSON data storage.
  - `./assets:/app/assets:ro` for static assets.
  - `./logs:/app/logs` for application logs.
  - `redis_data:/data` for Redis persistence.

## 9. Usage

All bot commands must start with the trigger prefix: `CIMI`

Examples:

```text
CIMI CEK SURAT B 1234 CD
CIMI UPDATE SURAT B 1234 CD
```

Additional common commands:

```text
CIMI CEK STOCK BAN
CIMI UPDATE BAN B1234CD DEPAN_KANAN 12000
CIMI ALERT HARI INI
```

## 10. Session Flow Example

`UPDATE SURAT` flow:

1. User sends `CIMI UPDATE SURAT <PLAT>`.
2. Bot fetches vehicle data and shows available document list.
3. User selects document code (for example `STNK`, `KIR`, `B3`).
4. Bot asks for new expiry date in `YYYY-MM-DD` format.
5. User submits date, bot validates and updates backend, writes audit log, then clears session.

Tip: user can cancel flow anytime with `BATAL` or `CANCEL`.

## 11. Logging

- Pino logging: operational/system logs for inbound messages, command matching, backend calls, Redis events, and errors.
- `auditRepository`: business/audit logs sent to Laravel API (`/api/wa-bot/users/insert-audit-logs`) for traceability.

## Rate Limiting

The bot uses Redis-based rate limiting to prevent spam and accidental command loops.

Default rule:

- 5 commands
- per 10 seconds
- per sender JID

Environment variables:

```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_SECONDS=10
```

Redis key format:

```text
wa:ratelimit:<sender>
```

If the limit is exceeded, the bot responds:

```text
TERLALU BANYAK PERMINTAAN

Silakan coba lagi beberapa saat.
```

## 12. Deployment

Recommended production deployment pattern:

1. Build and run with Docker Compose.
2. Keep `.env` values managed per environment (staging/production).
3. Validate service health using:

```bash
npm run health
```

Health endpoint:

- `GET /health` returns Redis and backend connectivity status.

Deploy script note:

- This repository does not include a dedicated deploy shell script by default.
- Common automation approach is to run `docker compose up -d --build` from your CI/CD or server deploy job.

## 13. Security Notes

- Backend API calls are authenticated using `x-api-key`.
- Allowlist controls which personal/group chats can interact with the bot.
- Role and permission checks are enforced before command execution.
- Baileys is an unofficial WhatsApp integration; account/session stability depends on WhatsApp policy and behavior. Use with operational safeguards and monitoring.

## 14. Future Improvements

- Add centralized monitoring/alerting (logs, metrics, uptime checks).
- Add CI/CD pipeline for lint/test/build/deploy.
- Add admin dashboard for user approvals, permissions, and audit exploration.
