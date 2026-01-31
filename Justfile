set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# List recipes
default:
  @just --list

# Bump version, commit, tag, push, and create GitHub release
release bump="patch":
  pnpm version {{bump}} --no-git-tag-version
  @version=$(node -p "require('./package.json').version"); \
    just _release "$version"

# Use an explicit version already in package.json
release-version version:
  @just _release "{{version}}"

# Re-trigger publish for an existing version by re-tagging HEAD
rerun version:
  git push
  git tag -d v{{version}} || true
  git push --delete origin v{{version}} || true
  git tag v{{version}}
  git push origin v{{version}}

# Delete and recreate the GitHub release + retag HEAD at the same version
rerelease version:
  gh release delete v{{version}} -y || true
  just rerun {{version}}
  gh release create v{{version}} --title "v{{version}}" --generate-notes

# Internal helper
_release version:
  git add package.json pnpm-lock.yaml
  git commit -m "chore(release): v{{version}}"
  git push
  git tag v{{version}}
  git push origin v{{version}}
  gh release create v{{version}} --title "v{{version}}" --generate-notes
