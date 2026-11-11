set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# The repository on GitHub, named so gh never has to guess it.
repo := "KaiErikNiermann/svelte-grid-extended"

# List recipes
default:
    @just --list

# --- Development setup ---

# Install dependencies for the library and the docs site (frozen lockfiles)
install:
    pnpm install --frozen-lockfile
    pnpm --dir docs install --frozen-lockfile

# Install the browsers the browser tests run in
install-browsers:
    pnpm exec playwright install chromium firefox

# Serve the library's demo routes with live reload
dev:
    pnpm dev

# --- Library ---

# Build dist/ with svelte-package and validate it with publint
build:
    pnpm package

# Type-check the library and its demo routes
typecheck:
    pnpm check

# Check formatting and lint (Prettier, ESLint; covers docs/ too)
lint:
    pnpm lint

# Format and fix what ESLint can fix
fmt:
    pnpm lint:fix

# Unit and stress tests in jsdom
test:
    pnpm test:unit

# The unit suite in real Chromium and Firefox, at 1x and 1.5x scale
test-browsers:
    pnpm test:browsers

# One test file in every project, e.g. `just test-file tests/unit/layout-touch.test.ts`
test-file file:
    pnpm exec svelte-kit sync
    pnpm exec vitest run {{ file }}

# Unit tests with a coverage report in coverage/
coverage:
    pnpm coverage

# Every library check the pre-push hook runs
check-lib:
    pnpm verify

# --- Benchmarks ---

# Run the page benchmark here and compare with the baseline (noisy on a busy machine)
bench *args:
    pnpm bench {{ args }}

# Run the benchmark on the quiet exec host; needs BENCH_HOST=user@host
bench-remote *args:
    bench/remote.sh {{ args }}

# --- Docs ---

# Serve the docs site with live reload (builds dist/ first, which the site links to)
docs:
    pnpm package:build
    pnpm --dir docs dev

# Type-check and build the docs site
check-docs:
    pnpm check:docs
    pnpm --dir docs build

# Preview the built docs site
docs-preview:
    pnpm --dir docs preview

# --- Combined ---

# Run every check: the pre-push gate and the docs
check: check-lib check-docs

# Remove build output
clean:
    rm -rf dist .svelte-kit coverage docs/build docs/.svelte-kit

# --- Versioning ---
#
# The version lives only in package.json.

# Show the current version
version:
    @node -p "require('./package.json').version"

# --- Release ---

# Bump (major | minor | patch | prerelease), check, commit, tag, push; then `just gh-release`
release kind="patch":
    #!/usr/bin/env bash
    set -euo pipefail
    just _clean-tree
    pnpm version {{ kind }} --no-git-tag-version
    just _release

# Release an exact version (same steps as `release`), e.g. 2.2.0 or 3.0.0-rc.1
release-version version:
    #!/usr/bin/env bash
    set -euo pipefail
    just _clean-tree
    pnpm version {{ version }} --no-git-tag-version
    just _release

# Publishing a release (not a draft) runs .github/workflows/publish.yml, which runs
# every check again and publishes to npm with provenance.

# Create the GitHub release for the current version; notes from a file, else a draft
gh-release notes="":
    #!/usr/bin/env bash
    set -euo pipefail
    tag="v$(node -p "require('./package.json').version")"
    if [ -n "{{ notes }}" ]; then
      gh release create "$tag" -R {{ repo }} --title "$tag" --notes-file "{{ notes }}"
    else
      gh release create "$tag" -R {{ repo }} --title "$tag" --notes "" --draft
      echo "Created $tag as a draft: write its notes on GitHub, then publish it (that publishes to npm)."
    fi

# Watch a release go out: the publish run for the tag, then npm serving the version
watch-release tag="":
    #!/usr/bin/env bash
    set -euo pipefail
    tag="{{ tag }}"
    tag="${tag:-v$(node -p "require('./package.json').version")}"
    version="${tag#v}"
    run=""
    for _ in $(seq 1 30); do
      run=$(gh run list -R {{ repo }} --workflow publish.yml --branch "$tag" -L 1 --json databaseId --jq '.[0].databaseId // empty')
      [ -n "$run" ] && break
      sleep 10
    done
    if [ -z "$run" ]; then echo "error: no publish run for $tag after 5 minutes" >&2; exit 1; fi
    gh run watch "$run" -R {{ repo }} --exit-status --interval 30
    for _ in $(seq 1 30); do
      if [ "$(npm view "@appulsauce/svelte-grid@$version" version 2>/dev/null)" = "$version" ]; then
        echo "npm serves @appulsauce/svelte-grid@$version"
        exit 0
      fi
      sleep 10
    done
    echo "error: the publish run passed but npm does not serve $version after 5 minutes" >&2
    exit 1

# Internal: commit the version, tag it and push both. On a failed check the bump is
# left in place: fix and re-run `just _release`, or `git checkout package.json` to drop it.
_release:
    #!/usr/bin/env bash
    set -euo pipefail
    version=$(node -p "require('./package.json').version")
    just check
    # _clean-tree ran first, so the version bump is the only tracked change.
    git add -u
    git commit -m "chore(release): $version"
    git tag "v$version"
    git push
    git push origin "v$version"
    echo "Tagged and pushed v$version. Next: just gh-release NOTES.md (publishing the release publishes to npm)"

# Internal: refuse to release from a tree with uncommitted changes
_clean-tree:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
      echo "error: commit or stash your changes first; a release commit holds only the version." >&2
      exit 1
    fi

# --- Publishing ---

# Show what would be published (builds via prepublishOnly; uploads nothing)
publish-dry:
    pnpm publish --dry-run --no-git-checks

# Run the npm publish workflow at an existing tag (default: the current version)
publish tag="":
    #!/usr/bin/env bash
    set -euo pipefail
    tag="{{ tag }}"
    tag="${tag:-v$(node -p "require('./package.json').version")}"
    gh workflow run publish.yml -R {{ repo }} --ref "$tag"
    echo "Started the Publish workflow at $tag: just watch-release $tag"
