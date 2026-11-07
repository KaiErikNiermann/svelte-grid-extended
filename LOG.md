# Log

What is in use and why, what was tried and dropped, and what has not been tried yet. Commits hold the detail; this holds the decisions.

## Kept (on by default)

- SvelteKit 3 toolchain (Kit 3.1, Vite 8, vite-plugin-svelte 7, TypeScript 6, Svelte 5.57) in the root and in `docs/`, done with `sv migrate sveltekit-3` run once per app (`--cwd docs` for the docs site, since running it from the root also rewrote `docs/` against the root's config). Supersedes Dependabot PR #6, which bumped Kit alone and failed every CI job because Kit 3 imports `parseSync` from Vite 8.
- `src/lib` imports each other by relative path, not `#lib`. The `#lib` subpath import maps to `./src/lib`, which is not in the published tarball, so a `#lib` import surviving into `dist/` would break consumers. Packaged `dist/` is byte-identical to the Kit 2 build (diffed against `origin/main` on 2026-11-07).
- Demo routes (`src/routes`) and the docs site use `#lib` as the migration wrote it.
- `docs/vite.config.ts` holds the former `svelte.config.js` and validates `BASE_PATH` (must be empty or start with `/`), because Kit 3 types `paths.base` as `'' | /${string}` and the value comes from the Pages workflow.
- `docs/tsconfig.json` sets `types: ["$app/types", "node"]` with `@types/node` ^22: TypeScript 6 no longer loads `@types/*` implicitly, and the config file now uses `node:path` and `process`.
- No `cookie` override: Kit 3 depends on `cookie` ^2.0.2, and the old `^0.7.2` override (for Kit 2's advisory) would have forced it back down.

## Kept but off

None yet.

## Dropped

None yet.

## Tried, not concluded

- mdsvex 0.12 emits `<script context="module">`, which Svelte 5.57 warns is deprecated on every docs `.md` page during `docs:build`. The build still passes; the fix is upstream in mdsvex or a move off it.

## Not tried (ideas)

- ESLint 10 (eslint 9.39 now prints a deprecation warning on install); an earlier attempt was reverted for Svelte 5 plugin compatibility, so check `eslint-plugin-svelte` support first.
