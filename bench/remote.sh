#!/usr/bin/env bash
# Runs bench/run.mjs on a quiet machine: syncs this working tree to BENCH_HOST, runs the
# benchmark there in the Playwright image (browsers and their system libraries included)
# pinned to fixed CPU cores, and copies the results (and a new baseline) back.
#
#   BENCH_HOST=user@host bench/remote.sh                    # compare with the baseline
#   BENCH_HOST=user@host bench/remote.sh --runs 10 --update-baseline
#
# Needs ssh access and Docker on the host. BENCH_CPUS picks the cores (default 2-5);
# keep it the same between the baseline and later runs.
set -euo pipefail

host="${BENCH_HOST:?set BENCH_HOST to the machine that runs the benchmark, e.g. user@host}"
cpus="${BENCH_CPUS:-2-5}"
remote_dir="bench-runs/svelte-grid-extended"
root="$(cd "$(dirname "$0")/.." && pwd)"
playwright="$(node -p "require('$root/node_modules/@playwright/test/package.json').version")"
image="mcr.microsoft.com/playwright:v${playwright}-noble"

cd "$root"
commit="$(git rev-parse --short HEAD)"
dirty="$([ -n "$(git status --porcelain)" ] && echo 1 || echo 0)"
# Tracked and new files, without anything gitignored (node_modules, builds, .scratch).
git ls-files -z --cached --others --exclude-standard |
	rsync -a --mkpath --delete-missing-args --from0 --files-from=- ./ "$host:$remote_dir/"

status=0
ssh "$host" bash -s -- "$remote_dir" "$image" "$cpus" "$commit" "$dirty" "$@" <<'REMOTE' || status=$?
set -euo pipefail
dir="$HOME/$1" image="$2" cpus="$3" commit="$4" dirty="$5"
shift 5
mkdir -p "$HOME/.cache/bench-pnpm-store"
docker run --rm --init --ipc=host --cpuset-cpus="$cpus" \
	--user "$(id -u):$(id -g)" -e HOME=/tmp -e COREPACK_HOME=/tmp/corepack \
	-e npm_config_store_dir=/pnpm-store -e CI=1 -e BENCH_COMMIT="$commit" -e BENCH_DIRTY="$dirty" \
	-v "$dir:/work" -v "$HOME/.cache/bench-pnpm-store:/pnpm-store" -w /work \
	"$image" bash -c 'corepack pnpm install --frozen-lockfile --ignore-scripts >/dev/null && node bench/run.mjs "$@"' bench "$@"
REMOTE

mkdir -p bench/results
rsync -a "$host:$remote_dir/bench/results/" bench/results/ || echo "no results came back" >&2
rsync -a "$host:$remote_dir/bench/baseline.json" bench/baseline.json 2>/dev/null || true
exit "$status"
