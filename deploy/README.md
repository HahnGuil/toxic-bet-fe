# Toxic Bet frontend deploy

This deploy keeps the host Nginx in front of the app and runs the application
containers in K3s. The GitHub pipeline publishes a GHCR image and calls a
single deploy webhook on the EC2 instance. The webhook updates the requested
Kubernetes Deployment and waits for rollout health before returning success.

## Architecture

- Nginx on the EC2 instance keeps serving `toxicbet.com.br` and proxies `/` to
  `localhost:4200`.
- K3s runs without Traefik so it does not claim ports `80` and `443`.
- K3s runs three application Deployments in namespace `toxicbet`:
  `toxic-bet-fe`, `toxic-bet-api`, and `ms-auth-server`.
- K3s `LoadBalancer` Services expose the same host ports already used by
  Nginx: `4200`, `20000`, and `2300`.
- Each Deployment uses readiness/startup/liveness probes and
  `kubectl rollout status`.
- If the new image does not become ready, the deploy script runs
  `kubectl rollout undo`.

## Required GitHub secrets

- `DEPLOY_WEBHOOK_URL`: webhook endpoint, currently
  `https://toxicbet.com.br/__deploy/toxicbet-deploy`.
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

After bootstrap, stop the old Docker application containers before exposing the
Kubernetes Services on the host ports:

```sh
docker stop toxic-bet-fe toxic-bet-docker-api ms-auth-server
sudo kubectl apply -f /opt/toxicbet/k8s
```

The Postgres containers can keep running in Docker. The application pods reach
them through the EC2 private IP and the existing published ports.

If GHCR packages are private, store pull credentials on the EC2 instance:

```sh
sudo install -d -m 700 /opt/toxicbet/deploy-webhook
printf '%s' 'github-user' | sudo tee /opt/toxicbet/deploy-webhook/ghcr-username
printf '%s' 'github-token-with-read-packages' | sudo tee /opt/toxicbet/deploy-webhook/ghcr-token
sudo chmod 600 /opt/toxicbet/deploy-webhook/ghcr-username /opt/toxicbet/deploy-webhook/ghcr-token
```
