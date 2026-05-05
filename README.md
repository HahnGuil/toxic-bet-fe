# Toxic Bet FE

## Portuguese Version

For the Portuguese version of this README, see [`README_PT.md`](./README_PT.md).

---

## Overview

**Toxic Bet FE** is the Angular 21 frontend for the Toxic Bet World Cup 2026 betting pool platform. It is built as an SSR-ready PWA and talks to two backend services:

- **Toxic Bet API** for matches, bets, betting pools, championships, teams, and application users.
- **Auth-Server API** for login, Google OAuth2, JWT/session management, password flows, and user profile operations.

The production build runs through a Node/Express SSR server. That server also proxies backend traffic so the browser can call `/api` and `/auth-server` without CORS issues.

---

## Technologies

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8?style=flat&logo=pwa&logoColor=white)

- **Angular 21** with standalone routing and lazy-loaded screens.
- **Angular SSR** using the generated Node server entrypoint.
- **Angular Service Worker** enabled in production/AWS builds.
- **Express** as the runtime server and proxy host.
- **http-proxy-middleware** for `/api` and `/auth-server` routing.
- **Docker/Docker Compose** for containerized execution.

---

## Features

### Authentication
- Email/password login through Auth-Server.
- Google OAuth2 redirect flow.
- Password reset and password change flows.
- Session persistence through JWT and application token handling.
- Protected routes with `authGuard`.

### Matches and Bets
- Authenticated match listing.
- Open match streams and in-progress match streams from the Toxic Bet API.
- Bet submission for available matches.
- Bet result and open bet result views.

### Betting Pools
- Create betting pools.
- Join betting pools by code.
- List the user's betting pools and participants.

### User Profile
- Display profile information.
- Update username.
- Change password for password-managed accounts.
- Logout flow.

### Admin
- Admin-only route protected by `adminGuard`.
- Match management UI for users with the `ADMIN` role.

### PWA and Runtime
- Installable mobile-first PWA when served over HTTPS or localhost.
- Production service worker and manifest support.
- SSR proxy for API calls and SSE-compatible responses.
- Structured client log endpoint at `/log`.

---

## Project Structure

- `src/app/register/` - login, callback, registration, auth services, token handling.
- `src/app/match/` - match listing and match card UI.
- `src/app/bet/` - bet result views.
- `src/app/betting-pool/` - betting pool creation, join, and list UI.
- `src/app/user/` - profile and password management.
- `src/app/admin/` - admin match management.
- `src/server.ts` - Express SSR server, proxies, static assets, and `/log`.
- `src/environments/` - local, development, and AWS endpoint configuration.

---

## API References

### Toxic Bet API

- Local API base URL: [`http://localhost:10000`](http://localhost:10000)
- Docker API base URL: [`http://localhost:20000`](http://localhost:20000)
- Production API base URL: [`https://api.toxicbet.com.br`](https://api.toxicbet.com.br)
- Local Swagger UI: [`http://localhost:10000/swagger-ui.html`](http://localhost:10000/swagger-ui.html)
- Docker Swagger UI: [`http://localhost:20000/swagger-ui.html`](http://localhost:20000/swagger-ui.html)
- OpenAPI JSON: [`http://localhost:10000/v3/api-docs`](http://localhost:10000/v3/api-docs)

The frontend reaches this service through the SSR proxy path:

```text
/api -> API_TARGET
```

### Auth-Server API

- Local Auth-Server base URL: [`http://localhost:2310/auth-server`](http://localhost:2310/auth-server)
- Docker Auth-Server base URL: [`http://localhost:2300/auth-server`](http://localhost:2300/auth-server)
- Production Auth-Server base URL: [`https://auth.toxicbet.com.br/auth-server`](https://auth.toxicbet.com.br/auth-server)
- Local Swagger UI: [`http://localhost:2310/auth-server/swagger-ui/index.html`](http://localhost:2310/auth-server/swagger-ui/index.html)
- Docker Swagger UI: [`http://localhost:2300/auth-server/swagger-ui/index.html`](http://localhost:2300/auth-server/swagger-ui/index.html)
- Google OAuth2 login: [`https://auth.toxicbet.com.br/auth-server/oauth2/authorization/google`](https://auth.toxicbet.com.br/auth-server/oauth2/authorization/google)
- JWK set: [`https://auth.toxicbet.com.br/auth-server/public-key/jwks`](https://auth.toxicbet.com.br/auth-server/public-key/jwks)

The frontend reaches this service through the SSR proxy path:

```text
/auth-server -> AUTH_TARGET
```

---

## Environment Variables

Use `.env.example` as the template for Docker-based runs.

| Variable | Description | Default/Example |
|---|---|---|
| `SHARED_SERVICES_NETWORK` | External Docker network shared with backend services | `shared-services` |
| `API_TARGET` | Target used by the SSR proxy for `/api` | `https://api.toxicbet.com.br` |
| `AUTH_TARGET` | Target used by the SSR proxy for `/auth-server` | `https://auth.toxicbet.com.br` |
| `PORT` | Node SSR server port inside the container | `4000` |

Example:

```dotenv
SHARED_SERVICES_NETWORK=shared-services
API_TARGET=http://toxic-bet-docker-api:20000
AUTH_TARGET=http://ms-auth-server:2300
PORT=4000
```

---

## Running Locally

### Prerequisites

- Node.js 22+
- npm 10+
- Toxic Bet API available locally or remotely
- Auth-Server available locally or remotely

### Install dependencies

```bash
npm ci
```

### Development server

```bash
npm start
```

The Angular dev server starts at:

```text
http://localhost:4200
```

### AWS configuration locally

```bash
npm run start:aws
```

### Production build

```bash
npm run build
```

### AWS production build

```bash
npm run build:aws
```

### Run tests

```bash
npm test
```

---

## Docker

### 1. Create the shared Docker network

The frontend compose file expects the backend services to be reachable through an external Docker network.

```bash
docker network create shared-services
```

If you use a different network name, update `SHARED_SERVICES_NETWORK` in `.env` and the backend compose files accordingly.

### 2. Create the environment file

```bash
cp .env.example .env
```

For local backend containers, use:

```dotenv
SHARED_SERVICES_NETWORK=shared-services
API_TARGET=http://toxic-bet-docker-api:20000
AUTH_TARGET=http://ms-auth-server:2300
```

For remote AWS services, use:

```dotenv
SHARED_SERVICES_NETWORK=shared-services
API_TARGET=https://api.toxicbet.com.br
AUTH_TARGET=https://auth.toxicbet.com.br
```

### 3. Start the frontend container

```bash
docker compose up -d --build
```

The application is exposed at:

```text
http://localhost:4200
```

Internally the Node SSR server listens on port `4000`, mapped by Docker Compose to host port `4200`.

### 4. Development compose

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

### 5. Check logs

```bash
docker compose logs -f toxic-bet-fe
```

### 6. Stop the container

```bash
docker compose down
```

---

## Installing the PWA on Mobile

1. Serve the application over HTTPS or use `localhost` for local testing.
2. Open the app in the phone browser.
3. Android Chrome/Edge: use the browser menu and select **Install app** or **Add to home screen**.
4. iOS Safari: use **Share** and select **Add to Home Screen**.

---

## Important Files

- `package.json` - scripts and dependencies.
- `angular.json` - build, SSR, service worker, and environment replacement settings.
- `Dockerfile` - production container image.
- `docker-compose.yml` - production-like frontend container.
- `docker-compose.dev.yml` - development compose variant.
- `.env.example` - Docker runtime variables.
- `src/server.ts` - SSR runtime and API proxy configuration.
- `src/environments/environment.dev.ts` - development endpoints.
- `src/environments/environment.aws.ts` - AWS/proxy endpoints.

---

## License

No license file was identified in this repository.
