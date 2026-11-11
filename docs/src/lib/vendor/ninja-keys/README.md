# ninja-keys (vendored build)

The command palette behind the docs search box. It is the `<ninja-keys>` web component from the fork at https://github.com/KaiErikNiermann/ninja-keys (upstream: https://github.com/ssleptsov/ninja-keys, MIT, see `LICENSE`), built as one self-contained module with Lit and hotkeys-js inside.

Why it is vendored and not a git dependency: the fork's `dist/` is not tracked and nothing builds it on install (`prepare` only runs husky), so `pnpm install` from a git URL would give TypeScript sources and no bundle. The commit the docs use also has not been pushed to GitHub yet (see below).

- Source commit: `843a008` of the local fork checkout (13 commits after `origin/main` at `5dde32e`, none pushed when this was vendored: the `searcher` property, `open({search})`, `submit()`, `open`/`close` events and several hotkey fixes).
- Built with `npm run bundle` in the fork (`tsc`, then rollup), on 2026-11-11.
- `ninja-keys.bundled.js`: that build's `dist/ninja-keys.bundled.js`, sha256 `769f09e05fed30c3aaebe6c85f5cc9182752407c4d89bb2505d1236511330cca`. It is minified and excluded from prettier and eslint.
- `ninja-keys.bundled.d.ts`: written by hand, the subset of the API the docs use.

To update: in the fork, check out the commit to vendor, run `npm ci && npm run bundle`, copy `dist/ninja-keys.bundled.js` over the file here, and update the commit and the hash above. Once the fork's commits are pushed, pin that commit here.
