# Toxic Bet FE (Angular PWA)

Aplicacao Angular 21 configurada como PWA para instalacao direta em dispositivos moveis (sem publicacao em loja).

## O que foi preparado

- PWA com manifest e Service Worker ativos em producao.
- Tela inicial mobile-first com:
  - botao de instalacao (quando suportado pelo navegador);
  - status online/offline do dispositivo;
  - validacao de conectividade com API e Auth Server.
- Proxy no servidor SSR para os dois back-ends:
  - /api -> API principal
  - /auth-server -> servidor de autenticacao
- Dockerfile e docker-compose para executar o front em container.

## Requisitos

- Node.js 22+
- npm 10+

## Rodando localmente

1. Instale dependencias:

```bash
npm ci
```

2. Execute em desenvolvimento:

```bash
npm start
```

3. Build de producao:

```bash
npm run build
```

## Como instalar no celular (sem loja)

1. Publique a aplicacao em HTTPS (ou localhost para testes locais).
2. Abra no navegador do celular:
   - Android (Chrome/Edge): menu -> "Instalar app" / "Adicionar a tela inicial".
   - iOS (Safari): compartilhar -> "Adicionar a Tela de Inicio".

## Configuracao dos back-ends

O front usa proxy SSR para evitar CORS no navegador.

- API principal: variavel API_TARGET (padrao http://toxic-bet-api:20000)
- Auth server: variavel AUTH_TARGET (padrao http://ms-auth-server:2300)

## Docker

### 1) Subir apenas o front

```bash
docker compose up -d --build
```

A aplicacao ficara em http://localhost:4200.

### 2) Variaveis de ambiente

Copie .env.example para .env e ajuste, se necessario:

```bash
cp .env.example .env
```

### 3) Rede compartilhada com back-ends

O compose do front espera uma rede Docker externa chamada shared-services (ou o nome definido em SHARED_SERVICES_NETWORK).

Se ainda nao existir:

```bash
docker network create shared-services
```

Depois suba seus back-ends na mesma rede (como nos compose que voce compartilhou) para o front resolver os hosts toxic-bet-api e ms-auth-server.
