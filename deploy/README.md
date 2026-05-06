# Toxic Bet frontend deploy

This deploy keeps the host Nginx in front of the app and moves only the frontend
container to Kubernetes. The GitHub pipeline publishes a GHCR image and calls a
webhook on the EC2 instance. The webhook updates the Kubernetes Deployment and
waits for rollout health before returning success.

## Architecture

- Nginx on the EC2 instance keeps serving `toxicbet.com.br` and proxies `/` to
  `localhost:4200`.
- K3s runs without Traefik so it does not claim ports `80` and `443`.
- A Kubernetes `LoadBalancer` Service exposes the frontend on host port `4200`.
- The Deployment uses `maxUnavailable: 0`, readiness/startup/liveness probes,
  and `kubectl rollout status`.
- If the new image does not become ready, the deploy script runs
  `kubectl rollout undo`.

## Required GitHub secrets

- `DEPLOY_WEBHOOK_URL`: webhook endpoint, for example
  `http://3.137.122.206:9001/hooks/toxic-bet-fe-deploy`.
- `DEPLOY_WEBHOOK_TOKEN`: shared secret configured on the EC2 webhook service.

If the repository/package is private, allow the EC2 instance to pull from GHCR
by creating the Kubernetes pull secret described in
`deploy/scripts/bootstrap-ec2-k3s.sh`.

## First EC2 setup

From this repository root:

```sh
scp -i /Users/hahnguil/aws/toxicbet-auth.pem -r deploy ubuntu@3.137.122.206:/tmp/toxicbet-deploy
ssh -i /Users/hahnguil/aws/toxicbet-auth.pem ubuntu@3.137.122.206
cd /tmp/toxicbet-deploy
DEPLOY_WEBHOOK_TOKEN='replace-with-a-long-random-secret' ./scripts/bootstrap-ec2-k3s.sh
```

For a private GHCR package, include a GitHub token with `read:packages`:

```sh
DEPLOY_WEBHOOK_TOKEN='replace-with-a-long-random-secret' \
  GHCR_USERNAME='your-github-user' \
  GHCR_TOKEN='github-token-with-read-packages' \
  ./scripts/bootstrap-ec2-k3s.sh
```

After bootstrap, stop the old Docker frontend before exposing the Kubernetes
Service on `4200`:

```sh
docker stop toxic-bet-fe
sudo kubectl apply -f /opt/toxicbet/k8s
```

The API/Auth containers can keep running in Docker. The frontend pod reaches
them through the EC2 private IP and the published ports `20000` and `2300`.
