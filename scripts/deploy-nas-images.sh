#!/usr/bin/env bash

set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
deploy_host=${INTELLIPICK_DEPLOY_HOST:-nas}
target_platform=${INTELLIPICK_TARGET_PLATFORM:-linux/amd64}
remote_config_dir=${INTELLIPICK_REMOTE_CONFIG_DIR:-/home/ziheng/docker-services/configs/intellipick}
remote_release_root=${INTELLIPICK_REMOTE_RELEASE_ROOT:-/home/ziheng/docker-services/releases/intellipick}
compose_file=${remote_config_dir}/docker-compose.yml
env_file=${remote_config_dir}/.env.production

log() {
	printf '[deploy] %s\n' "$*"
}

fail() {
	printf '[deploy] ERROR: %s\n' "$*" >&2
	exit 1
}

require_command() {
	command -v "$1" >/dev/null 2>&1 || fail "缺少命令：$1"
}

cleanup() {
	if [[ -n "${artifact_dir:-}" && -d "${artifact_dir}" ]]; then
		rm -rf -- "${artifact_dir}"
	fi
}

trap cleanup EXIT

require_command docker
require_command gzip
require_command git
require_command scp
require_command ssh
require_command shasum
require_command tar

cd "${project_root}"

revision=$(git rev-parse HEAD)
branch=$(git branch --show-current)
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)
[[ -n "${branch}" ]] || fail "当前处于 detached HEAD"
[[ -n "${upstream}" ]] || fail "当前分支没有 upstream"

dirty=$(git status --porcelain --untracked-files=all | awk '$0 !~ /^\?\? \.agents\// { print }')
if [[ -n "${dirty}" ]]; then
	printf '[deploy] ERROR: 工作区不干净，请先提交或清理改动：\n%s\n' "${dirty}" >&2
	exit 1
fi

git fetch --quiet "${upstream%%/*}"
upstream_revision=$(git rev-parse '@{u}')
[[ "${revision}" == "${upstream_revision}" ]] || fail "HEAD 尚未与 ${upstream} 对齐"

remote_arch=$(ssh "${deploy_host}" uname -m)
case "${remote_arch}" in
	x86_64)
	expected_platform=linux/amd64
	;;
	aarch64 | arm64)
	expected_platform=linux/arm64
	;;
	*)
	fail "不支持的 NAS 架构：${remote_arch}"
	;;
esac
[[ "${target_platform}" == "${expected_platform}" ]] || fail "目标平台 ${target_platform} 与 NAS ${expected_platform} 不一致"

ssh "${deploy_host}" "test -f '${compose_file}' && test -f '${env_file}'" || fail "NAS 运行 Compose 或环境文件不存在"
ssh "${deploy_host}" "test ! -e '${remote_release_root}/${revision}/manifest.txt'" || fail "release ${revision} 已存在"

artifact_dir=$(mktemp -d)
source_dir="${artifact_dir}/source"
mkdir -p "${source_dir}"
log "导出已提交源码快照 ${revision}"
git archive "${revision}" | tar -x -C "${source_dir}"

build_image() {
	local image_name=$1
	local dockerfile=$2
	local target=$3

	log "构建 ${image_name}:${revision} (${target_platform})"
	docker buildx build \
		--platform "${target_platform}" \
		--load \
		--label "org.opencontainers.image.revision=${revision}" \
		--label "org.opencontainers.image.source=https://github.com/Shadowzzh/intelli-pick" \
		--file "${source_dir}/${dockerfile}" \
		--target "${target}" \
		--tag "${image_name}:${revision}" \
		"${source_dir}"
}

build_image intellipick-api apps/api/Dockerfile api
build_image intellipick-worker apps/worker/Dockerfile worker
build_image intellipick-web apps/web/Dockerfile web
build_image intellipick-migrate apps/api/Dockerfile migrate

images=(
	"intellipick-api:${revision}"
	"intellipick-worker:${revision}"
	"intellipick-web:${revision}"
	"intellipick-migrate:${revision}"
)

archive_name="intellipick-images-${revision}.tar.gz"
archive_path="${artifact_dir}/${archive_name}"
checksum_path="${archive_path}.sha256"
manifest_path="${artifact_dir}/manifest.txt"

log "导出四个版本化镜像"
docker image save "${images[@]}" | gzip -1 > "${archive_path}"
archive_sha=$(shasum -a 256 "${archive_path}" | awk '{ print $1 }')
printf '%s  %s\n' "${archive_sha}" "${archive_name}" > "${checksum_path}"

{
	printf 'revision=%s\n' "${revision}"
	printf 'branch=%s\n' "${branch}"
	printf 'upstream=%s\n' "${upstream}"
	printf 'source_tree=%s\n' "$(git rev-parse "${revision}^{tree}")"
	printf 'built_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	printf 'platform=%s\n' "${target_platform}"
	printf 'archive=%s\n' "${archive_name}"
	printf 'archive_sha256=%s\n' "${archive_sha}"
	for image in "${images[@]}"; do
		image_id=$(docker image inspect "${image}" --format '{{.Id}}')
		printf 'local_image=%s|%s\n' "${image}" "${image_id}"
	done
} > "${manifest_path}"

release_dir="${remote_release_root}/${revision}"
log "上传 release 到 ${deploy_host}:${release_dir}"
ssh "${deploy_host}" "mkdir -p '${release_dir}'"
scp "${archive_path}" "${checksum_path}" "${manifest_path}" "${deploy_host}:${release_dir}/"

log "在 NAS 校验、加载镜像并切换 Compose"
ssh "${deploy_host}" bash -s -- \
	"${revision}" \
	"${release_dir}" \
	"${compose_file}" \
	"${env_file}" \
	"${archive_name}" \
	"${remote_release_root}" <<'REMOTE'
set -euo pipefail

revision=$1
release_dir=$2
compose_file=$3
env_file=$4
archive_name=$5
release_root=$6

compose=(docker compose --env-file "${env_file}" -f "${compose_file}")
cd "${release_dir}"
sha256sum -c "${archive_name}.sha256"
gzip -dc "${archive_name}" | docker image load >/dev/null

images=(
	"intellipick-api:${revision}"
	"intellipick-worker:${revision}"
	"intellipick-web:${revision}"
	"intellipick-migrate:${revision}"
)
for image in "${images[@]}"; do
	label=$(docker image inspect "${image}" --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}')
	if [[ "${label}" != "${revision}" ]]; then
		printf '镜像 revision 校验失败：%s\n' "${image}" >&2
		exit 1
	fi
done

previous_tag=$(sed -n 's/^INTELLIPICK_TAG=//p' "${env_file}" | tail -1)
if [[ -z "${previous_tag}" ]]; then
	previous_tag=local
fi
for previous_image in intellipick-api intellipick-worker intellipick-web; do
	docker image inspect "${previous_image}:${previous_tag}" >/dev/null
done
deploy_ts=$(date +%Y%m%d-%H%M%S)
cp "${env_file}" "${env_file}.bak-${deploy_ts}"

set_tag() {
	local tag=$1
	sed -i '/^INTELLIPICK_TAG=/d' "${env_file}"
	sed -i "\$aINTELLIPICK_TAG=${tag}" "${env_file}"
}

rollback() {
	printf '部署验证失败，回滚到 %s\n' "${previous_tag}" >&2
	set_tag "${previous_tag}"
	"${compose[@]}" config --quiet
	"${compose[@]}" up -d --no-build --no-deps --force-recreate intellipick-api intellipick-worker intellipick-web
}

set_tag "${revision}"
if ! "${compose[@]}" config --quiet; then
	rollback
	exit 1
fi
if ! "${compose[@]}" up -d --no-build --no-deps --force-recreate intellipick-api intellipick-worker intellipick-web; then
	rollback
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
	if [[ "${api_health}" == "healthy" && "${web_health}" == "healthy" && "${worker_state}" == "running" && "${worker_count}" -ge 1 && "${api_revision}" == "${revision}" && "${worker_revision}" == "${revision}" && "${web_revision}" == "${revision}" ]]; then
		healthy=true
		break
	fi
	sleep 2
done

if [[ "${healthy}" != "true" ]]; then
	rollback
	exit 1
fi

{
	printf 'previous_tag=%s\n' "${previous_tag}"
	printf 'deployed_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	printf 'compose_sha256=%s\n' "$(sha256sum "${compose_file}" | awk '{ print $1 }')"
	for image in "${images[@]}"; do
		image_id=$(docker image inspect "${image}" --format '{{.Id}}')
		printf 'remote_image=%s|%s\n' "${image}" "${image_id}"
	done
} >> "${release_dir}/manifest.txt"
ln -sfn "${release_dir}" "${release_root}/current"

printf 'DEPLOYED_REVISION=%s\n' "${revision}"
printf 'PREVIOUS_TAG=%s\n' "${previous_tag}"
printf 'API_HEALTH=%s\n' "$(docker inspect intellipick-api --format '{{.State.Health.Status}}')"
printf 'WEB_HEALTH=%s\n' "$(docker inspect intellipick-web --format '{{.State.Health.Status}}')"
printf 'WORKER_STATE=%s\n' "$(docker inspect intellipick-worker --format '{{.State.Status}}')"
REMOTE

log "部署完成：${revision}"
