#!/usr/bin/env bash
set -euo pipefail

DEPLOYMENT="${1:-}"
IMAGE="${2:-}"
SHA="${3:-}"
NAMESPACE="${NAMESPACE:-toxicbet}"
TIMEOUT="${ROLLOUT_TIMEOUT:-240s}"

case "${DEPLOYMENT}" in
  toxic-bet-fe)
    CONTAINER="toxic-bet-fe"
    REPO="toxic-bet-fe"
    ;;
  toxic-bet-api)
    CONTAINER="toxic-bet-api"
    REPO="toxic-bet"
    ;;
  ms-auth-server)
    CONTAINER="ms-auth-server"
    REPO="ms-auth-server"
    ;;
  *)
    echo "Invalid deployment: ${DEPLOYMENT}" >&2
    exit 1
    ;;
esac

if [[ -z "${IMAGE}" ]]; then
  echo "Missing image argument" >&2
  exit 1
fi

if [[ ! "${IMAGE}" =~ ^ghcr\.io/hahnguil/${REPO}:[A-Za-z0-9_.:-]+$ ]]; then
  echo "Refusing unexpected image for ${DEPLOYMENT}: ${IMAGE}" >&2
  exit 1
fi

echo "Deploying ${IMAGE} sha=${SHA:-unknown}"
if [[ -s /opt/toxicbet/deploy-webhook/ghcr-username && -s /opt/toxicbet/deploy-webhook/ghcr-token ]]; then
  GHCR_USERNAME=$(sudo cat /opt/toxicbet/deploy-webhook/ghcr-username)
  GHCR_TOKEN=$(sudo cat /opt/toxicbet/deploy-webhook/ghcr-token)
  sudo k3s kubectl -n "${NAMESPACE}" create secret docker-registry ghcr-pull \
    --docker-server=ghcr.io \
    --docker-username="${GHCR_USERNAME}" \
    --docker-password="${GHCR_TOKEN}" \
    --dry-run=client -o yaml | sudo k3s kubectl apply -f -
  sudo k3s kubectl -n "${NAMESPACE}" patch serviceaccount default \
    -p '{"imagePullSecrets":[{"name":"ghcr-pull"}]}'
fi

sudo k3s kubectl -n "${NAMESPACE}" set image "deployment/${DEPLOYMENT}" "${CONTAINER}=${IMAGE}"

if sudo k3s kubectl -n "${NAMESPACE}" rollout status "deployment/${DEPLOYMENT}" --timeout="${TIMEOUT}"; then
  sudo k3s kubectl -n "${NAMESPACE}" annotate "deployment/${DEPLOYMENT}" \
    toxicbet.com/last-deployed-image="${IMAGE}" \
    toxicbet.com/last-deployed-sha="${SHA:-unknown}" \
    --overwrite
  echo "Deployment healthy: ${IMAGE}"
  exit 0
fi

echo "Deployment did not become healthy. Rolling back." >&2
sudo k3s kubectl -n "${NAMESPACE}" rollout undo "deployment/${DEPLOYMENT}"
sudo k3s kubectl -n "${NAMESPACE}" rollout status "deployment/${DEPLOYMENT}" --timeout="${TIMEOUT}"
exit 1
