#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo -E "$0" "$@"
fi

if [[ -z "${DEPLOY_WEBHOOK_TOKEN:-}" ]]; then
  echo "DEPLOY_WEBHOOK_TOKEN is required" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="/opt/toxicbet"
NODE_IP="$(hostname -I | awk '{print $1}')"

apt-get update
apt-get install -y curl jq webhook

if ! command -v k3s >/dev/null 2>&1; then
  curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik --write-kubeconfig-mode 644" sh -
fi

install -d -m 0755 "${INSTALL_DIR}/k8s" "${INSTALL_DIR}/deploy-webhook"
cp "${ROOT_DIR}"/k8s/*.yaml "${INSTALL_DIR}/k8s/"
cp "${ROOT_DIR}/scripts/deploy-from-webhook.sh" "${INSTALL_DIR}/deploy-webhook/deploy.sh"
chmod 0755 "${INSTALL_DIR}/deploy-webhook/deploy.sh"

sed -i "s#http://172.31.41.196:20000#http://${NODE_IP}:20000#g" "${INSTALL_DIR}/k8s/configmap.yaml"
sed -i "s#http://172.31.41.196:2300#http://${NODE_IP}:2300#g" "${INSTALL_DIR}/k8s/configmap.yaml"

kubectl apply -f "${INSTALL_DIR}/k8s/namespace.yaml"
kubectl apply -f "${INSTALL_DIR}/k8s/configmap.yaml"

if [[ -n "${GHCR_USERNAME:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  kubectl -n toxicbet create secret docker-registry ghcr-pull-secret \
    --docker-server=ghcr.io \
    --docker-username="${GHCR_USERNAME}" \
    --docker-password="${GHCR_TOKEN}" \
    --dry-run=client \
    -o yaml | kubectl apply -f -
  kubectl -n toxicbet patch serviceaccount default \
    -p '{"imagePullSecrets":[{"name":"ghcr-pull-secret"}]}'
fi

jq --arg token "${DEPLOY_WEBHOOK_TOKEN}" \
  '.[0]["trigger-rule"].match.value = $token' \
  "${ROOT_DIR}/webhook/hooks.json" > "${INSTALL_DIR}/deploy-webhook/hooks.json"
chmod 0600 "${INSTALL_DIR}/deploy-webhook/hooks.json"

cat >/etc/systemd/system/toxicbet-deploy-webhook.service <<'SERVICE'
[Unit]
Description=Toxic Bet deploy webhook
After=network-online.target k3s.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/webhook -hooks /opt/toxicbet/deploy-webhook/hooks.json -ip 127.0.0.1 -port 9002 -verbose
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now toxicbet-deploy-webhook.service

cat <<EOF
K3s and webhook are ready.

Next steps:
1. If GHCR package is private and GHCR_USERNAME/GHCR_TOKEN were not provided,
   create an image pull secret in namespace toxicbet.
2. Stop the old Docker frontend before applying the Service on port 4200:
   docker stop toxic-bet-fe
3. Apply the deployment and service:
   kubectl apply -f ${INSTALL_DIR}/k8s

Webhook URL:
  http://$(curl -fsS ifconfig.me || hostname -I | awk '{print $1}'):9001/hooks/toxic-bet-fe-deploy
EOF
