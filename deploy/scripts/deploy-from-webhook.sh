#!/usr/bin/env bash
set -euo pipefail

IMAGE="${1:-}"
SHA="${2:-}"
NAMESPACE="${NAMESPACE:-toxicbet}"
DEPLOYMENT="${DEPLOYMENT:-toxic-bet-fe}"
CONTAINER="${CONTAINER:-toxic-bet-fe}"
TIMEOUT="${ROLLOUT_TIMEOUT:-180s}"

if [[ -z "${IMAGE}" ]]; then
  echo "Missing image argument" >&2
  exit 1
fi

if [[ ! "${IMAGE}" =~ ^ghcr\.io/[A-Za-z0-9_.-]+/toxic-bet-fe:[A-Za-z0-9_.:-]+$ ]]; then
  echo "Refusing unexpected image: ${IMAGE}" >&2
  exit 1
fi

echo "Deploying ${IMAGE} sha=${SHA:-unknown}"
kubectl -n "${NAMESPACE}" set image "deployment/${DEPLOYMENT}" "${CONTAINER}=${IMAGE}"

if kubectl -n "${NAMESPACE}" rollout status "deployment/${DEPLOYMENT}" --timeout="${TIMEOUT}"; then
  kubectl -n "${NAMESPACE}" annotate "deployment/${DEPLOYMENT}" \
    toxicbet.com/last-deployed-image="${IMAGE}" \
    toxicbet.com/last-deployed-sha="${SHA:-unknown}" \
    --overwrite
  echo "Deployment healthy: ${IMAGE}"
  exit 0
fi

echo "Deployment did not become healthy. Rolling back." >&2
kubectl -n "${NAMESPACE}" rollout undo "deployment/${DEPLOYMENT}"
kubectl -n "${NAMESPACE}" rollout status "deployment/${DEPLOYMENT}" --timeout="${TIMEOUT}"
exit 1
