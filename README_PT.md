# Toxic Bet FE

## Versao em Ingles

Para a versao principal em ingles deste README, acesse [`README.md`](./README.md).

---

## Visao Geral

**Toxic Bet FE** e o frontend Angular 21 da plataforma de bolao da Copa do Mundo de 2026. Ele foi construido como uma PWA com suporte a SSR e se integra com dois backends:

- **Toxic Bet API** para partidas, apostas, boloes, campeonatos, times e usuarios da aplicacao.
- **Auth-Server API** para login, Google OAuth2, gerenciamento de JWT/sessao, fluxos de senha e perfil do usuario.

O build de producao roda em um servidor Node/Express com SSR. Esse servidor tambem faz proxy das chamadas para os backends, permitindo que o navegador use `/api` e `/auth-server` sem problemas de CORS.

---

## Tecnologias

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8?style=flat&logo=pwa&logoColor=white)

- **Angular 21** com rotas standalone e telas carregadas sob demanda.
- **Angular SSR** usando o entrypoint de servidor gerado no build.
- **Angular Service Worker** ativo nos builds de producao/AWS.
- **Express** como servidor runtime e host dos proxies.
- **http-proxy-middleware** para as rotas `/api` e `/auth-server`.
- **Docker/Docker Compose** para execucao em container.

---

## Funcionalidades

### Autenticacao
- Login por email/senha via Auth-Server.
- Fluxo de redirecionamento com Google OAuth2.
- Recuperacao e alteracao de senha.
- Persistencia de sessao com JWT e token de aplicacao.
- Rotas protegidas por `authGuard`.

### Partidas e Apostas
- Listagem autenticada de partidas.
- Streams de partidas abertas e em andamento pela Toxic Bet API.
- Envio de apostas para partidas disponiveis.
- Telas de resultados de apostas e apostas abertas.

### Boloes
- Criacao de boloes.
- Entrada em bolao por codigo.
- Listagem dos boloes do usuario e seus participantes.

### Perfil de Usuario
- Exibicao dos dados do perfil.
- Alteracao de username.
- Alteracao de senha para contas gerenciadas por senha.
- Logout.

### Admin
- Rota administrativa protegida por `adminGuard`.
- Interface de gerenciamento de partidas para usuarios com papel `ADMIN`.

### PWA e Runtime
- PWA instalavel em mobile quando servida via HTTPS ou localhost.
- Service worker e manifest nos builds de producao.
- Proxy SSR para chamadas de API e respostas SSE.
- Endpoint de log estruturado do cliente em `/log`.

---

## Estrutura do Projeto

- `src/app/register/` - login, callback, cadastro, servicos de auth e tokens.
- `src/app/match/` - listagem e cards de partidas.
- `src/app/bet/` - telas de resultados de apostas.
- `src/app/betting-pool/` - criacao, entrada e listagem de boloes.
- `src/app/user/` - perfil e gerenciamento de senha.
- `src/app/admin/` - gerenciamento administrativo de partidas.
- `src/server.ts` - servidor Express SSR, proxies, assets estaticos e `/log`.
- `src/environments/` - configuracoes local, development e AWS.

---

## Referencias das APIs

### Toxic Bet API

- Base local da API: [`http://localhost:10000`](http://localhost:10000)
- Base Docker da API: [`http://localhost:20000`](http://localhost:20000)
- Base de producao da API: [`https://api.toxicbet.com.br`](https://api.toxicbet.com.br)
- Swagger UI local: [`http://localhost:10000/swagger-ui.html`](http://localhost:10000/swagger-ui.html)
- Swagger UI Docker: [`http://localhost:20000/swagger-ui.html`](http://localhost:20000/swagger-ui.html)
- OpenAPI JSON: [`http://localhost:10000/v3/api-docs`](http://localhost:10000/v3/api-docs)

O frontend acessa esse servico pelo proxy SSR:

```text
/api -> API_TARGET
```

### Auth-Server API

- Base local do Auth-Server: [`http://localhost:2310/auth-server`](http://localhost:2310/auth-server)
- Base Docker do Auth-Server: [`http://localhost:2300/auth-server`](http://localhost:2300/auth-server)
- Base de producao do Auth-Server: [`https://auth.toxicbet.com.br/auth-server`](https://auth.toxicbet.com.br/auth-server)
- Swagger UI local: [`http://localhost:2310/auth-server/swagger-ui/index.html`](http://localhost:2310/auth-server/swagger-ui/index.html)
- Swagger UI Docker: [`http://localhost:2300/auth-server/swagger-ui/index.html`](http://localhost:2300/auth-server/swagger-ui/index.html)
- Login Google OAuth2: [`https://auth.toxicbet.com.br/auth-server/oauth2/authorization/google`](https://auth.toxicbet.com.br/auth-server/oauth2/authorization/google)
- JWK set: [`https://auth.toxicbet.com.br/auth-server/public-key/jwks`](https://auth.toxicbet.com.br/auth-server/public-key/jwks)

O frontend acessa esse servico pelo proxy SSR:

```text
/auth-server -> AUTH_TARGET
```

---

## Variaveis de Ambiente

Use `.env.example` como modelo para execucoes com Docker.

| Variavel | Descricao | Padrao/Exemplo |
|---|---|---|
| `SHARED_SERVICES_NETWORK` | Rede Docker externa compartilhada com os backends | `shared-services` |
| `API_TARGET` | Target usado pelo proxy SSR em `/api` | `https://api.toxicbet.com.br` |
| `AUTH_TARGET` | Target usado pelo proxy SSR em `/auth-server` | `https://auth.toxicbet.com.br` |
| `PORT` | Porta do servidor Node SSR dentro do container | `4000` |

Exemplo:

```dotenv
SHARED_SERVICES_NETWORK=shared-services
API_TARGET=http://toxic-bet-docker-api:20000
AUTH_TARGET=http://ms-auth-server:2300
PORT=4000
```

---

## Rodando Localmente

### Pre-requisitos

- Node.js 22+
- npm 10+
- Toxic Bet API disponivel localmente ou remotamente
- Auth-Server disponivel localmente ou remotamente

### Instalar dependencias

```bash
npm ci
```

### Servidor de desenvolvimento

```bash
npm start
```

O servidor Angular inicia em:

```text
http://localhost:4200
```

### Configuracao AWS localmente

```bash
npm run start:aws
```

### Build de producao

```bash
npm run build
```

### Build AWS de producao

```bash
npm run build:aws
```

### Rodar testes

```bash
npm test
```

---

## Docker

### 1. Criar a rede Docker compartilhada

O compose do frontend espera que os servicos de backend estejam acessiveis por uma rede Docker externa.

```bash
docker network create shared-services
```

Se usar outro nome de rede, atualize `SHARED_SERVICES_NETWORK` no `.env` e os compose files dos backends.

### 2. Criar o arquivo de ambiente

```bash
cp .env.example .env
```

Para backends locais em containers, use:

```dotenv
SHARED_SERVICES_NETWORK=shared-services
API_TARGET=http://toxic-bet-docker-api:20000
AUTH_TARGET=http://ms-auth-server:2300
```

Para servicos remotos na AWS, use:

```dotenv
SHARED_SERVICES_NETWORK=shared-services
API_TARGET=https://api.toxicbet.com.br
AUTH_TARGET=https://auth.toxicbet.com.br
```

### 3. Subir o container do frontend

```bash
docker compose up -d --build
```

A aplicacao fica disponivel em:

```text
http://localhost:4200
```

Internamente o servidor Node SSR escuta na porta `4000`, mapeada pelo Docker Compose para a porta `4200` no host.

### 4. Compose de desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

### 5. Ver logs

```bash
docker compose logs -f toxic-bet-fe
```

### 6. Parar o container

```bash
docker compose down
```

---

## Instalando a PWA no Celular

1. Sirva a aplicacao via HTTPS ou use `localhost` para testes locais.
2. Abra o app no navegador do celular.
3. Android Chrome/Edge: use o menu do navegador e selecione **Instalar app** ou **Adicionar a tela inicial**.
4. iOS Safari: use **Compartilhar** e selecione **Adicionar a Tela de Inicio**.

---

## Arquivos Importantes

- `package.json` - scripts e dependencias.
- `angular.json` - build, SSR, service worker e troca de environments.
- `Dockerfile` - imagem de producao.
- `docker-compose.yml` - container do frontend em modo producao.
- `docker-compose.dev.yml` - variante de desenvolvimento.
- `.env.example` - variaveis runtime para Docker.
- `src/server.ts` - runtime SSR e proxies das APIs.
- `src/environments/environment.dev.ts` - endpoints de desenvolvimento.
- `src/environments/environment.aws.ts` - endpoints AWS/proxy.

---

## Licenca

Nao foi identificado um arquivo de licenca neste repositorio.
