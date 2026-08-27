#!/usr/bin/env bash

set -euo pipefail

deploy_host=${INTELLIPICK_DEPLOY_HOST:-nas}
remote_config_dir=${INTELLIPICK_REMOTE_CONFIG_DIR:-/home/ziheng/docker-services/configs/intellipick}
remote_release_root=${INTELLIPICK_REMOTE_RELEASE_ROOT:-/home/ziheng/docker-services/releases/intellipick}
compose_file=${remote_config_dir}/docker-compose.yml
env_file=${remote_config_dir}/.env.production
target_revision=${1:-}

if [[ ! "${target_revision}" =~ ^[0-9a-f]{40}$ ]]; then
	printf '用法：%s <40 位 Git commit SHA>\n' "$0" >&2
	exit 1
fi

ssh "${deploy_host}" bash -s -- \
	"${target_revision}" \
	"${remote_release_root}" \
	"${compose_file}" \
	"${env_file}" <<'REMOTE'
set -euo pipefail

target_revision=$1
release_root=$2
compose_file=$3
env_file=$4
release_dir="${release_root}/${target_revision}"
compose=(docker compose --env-file "${env_file}" -f "${compose_file}")

test -f "${release_dir}/manifest.txt"
images=(
	"intellipick-api:${target_revision}"
	"intellipick-worker:${target_revision}"
	"intellipick-web:${target_revision}"
	"intellipick-migrate:${target_revision}"
)
for image in "${images[@]}"; do
	docker image inspect "${image}" >/dev/null
done

previous_tag=$(sed -n 's/^INTELLIPICK_TAG=//p' "${env_file}" | tail -1)
rollback_ts=$(date +%Y%m%d-%H%M%S)
cp "${env_file}" "${env_file}.bak-${rollback_ts}"

set_tag() {
	local tag=$1
	sed -i '/^INTELLIPICK_TAG=/d' "${env_file}"
	sed -i "\$aINTELLIPICK_TAG=${tag}" "${env_file}"
}

restore_previous() {
	set_tag "${previous_tag}"
	"${compose[@]}" up -d --no-build --no-deps --force-recreate intellipick-api intellipick-worker intellipick-web
}

set_tag "${target_revision}"
"${compose[@]}" config --quiet
if ! "${compose[@]}" up -d --no-build --no-deps --force-recreate intellipick-api intellipick-worker intellipick-web; then
	restore_previous
	exit 1
fi

healthy=false
for attempt in $(seq 1 30); do
	api_health=$(docker inspect intellipick-api --format '{{.State.Health.Status}}' 2>/dev/null || true)
	web_health=$(docker inspect intellipick-web --format '{{.State.Health.Status}}' 2>/dev/null || true)
	worker_state=$(docker inspect intellipick-worker --format '{{.State.Status}}' 2>/dev/null || true)
	api_revision=$(docker inspect intellipick-api --format '{{ index .Config.Labels "dev.zzheng.intellipick.revision" }}' 2>/dev/null || true)
	worker_revision=$(docker inspect intellipick-worker --format '{{ index .Config.Labels "dev.zzheng.intellipick.revision" }}' 2>/dev/null || true)
	web_revision=$(docker inspect intellipick-web --format '{{ index .Config.Labels "dev.zzheng.intellipick.revision" }}' 2>/dev/null || true)
	worker_count=0
	if [[ "${api_health}" == "healthy" ]]; then
		worker_count=$(docker exec intellipick-api node --input-type=module -e "import { Queue } from 'bullmq'; const q = new Queue('intellipick-pipeline', { connection: { url: process.env.REDIS_URL } }); const workers = await q.getWorkers(); console.log(workers.length); await q.close();" 2>/dev/null || printf '0')
	fi
	if [[ "${api_health}" == "healthy" && "${web_health}" == "healthy" && "${worker_state}" == "running" && "${worker_count}" -ge 1 && "${api_revision}" == "${target_revision}" && "${worker_revision}" == "${target_revision}" && "${web_revision}" == "${target_revision}" ]]; then
		healthy=true
		break
	fi
	sleep 2
done

if [[ "${healthy}" != "true" ]]; then
	restore_previous
	exit 1
fi

ln -sfn "${release_dir}" "${release_root}/current"
printf 'ROLLED_BACK_FROM=%s\n' "${previous_tag}"
printf 'ROLLED_BACK_TO=%s\n' "${target_revision}"
REMOTE
