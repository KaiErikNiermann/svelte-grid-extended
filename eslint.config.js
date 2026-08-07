import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import security from 'eslint-plugin-security';
import globals from 'globals';

// Single source of truth for the whole repo, including docs/. The docs package is a
// separate pnpm project but is linted from here so the rule set never drifts between
// the library and its documentation site.
export default tseslint.config(
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'node_modules/',
			'coverage/',
			'.remember/',
			'.serena/',
			'.svelte-kit/',
			'docs/build/',
			'docs/.svelte-kit/',
			'docs/node_modules/'
		]
	},

	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	sonarjs.configs.recommended,
	unicorn.configs.recommended,
	security.configs.recommended,
	prettier,
	...svelte.configs['flat/prettier'],

	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			// Svelte/SvelteKit file naming is dictated by the framework (+page.svelte,
			// $lib aliases, PascalCase components), so unicorn's casing rules fight it.
			'unicorn/filename-case': 'off',
			// SvelteKit uses `null` in several public APIs, and the DOM returns it widely.
			'unicorn/no-null': 'off',
			// Abbreviations like `props`, `params`, `el`, `i` are idiomatic in Svelte code.
			'unicorn/prevent-abbreviations': 'off',
			// The library targets browsers via a bundler; some of these Node-flavoured
			// globals rules do not apply.
			'unicorn/prefer-global-this': 'off',
			'unicorn/prefer-top-level-await': 'off',
			// sonarjs ships its own copy of no-unused-vars that cannot see Svelte 5
			// snippets (`{#snippet children()}` is consumed by the component, never
			// called locally), so every snippet is a false positive. The
			// typescript-eslint rule below understands them and stays on.
			'sonarjs/no-unused-vars': 'off',
			// `Array#toSorted` is Baseline 2023; this package ships to browsers via a
			// bundler with no polyfill, so `[...items].sort()` stays the portable form.
			'unicorn/no-array-sort': 'off',
			// `reduce` is used here for genuine folds; banning it outright buys nothing.
			'unicorn/no-array-reduce': 'off',
			// Notorious false-positive generator: every computed property access on a
			// plain lookup table trips it.
			'security/detect-object-injection': 'off',
			// Fires on any `===` whose operand is merely *named* like a token. There is
			// no secret comparison anywhere in this package.
			'security/detect-possible-timing-attacks': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
			]
		}
	},

	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},

	// `export {}` in an ambient declaration file is what makes `declare global`
	// legal, so it is not a redundant specifier-less export.
	{
		files: ['**/*.d.ts'],
		rules: {
			'unicorn/require-module-specifiers': 'off'
		}
	},

	// Example/demo routes and documentation pages exist to show usage, so the
	// complexity and duplication heuristics are noise there.
	{
		files: ['src/routes/**', 'docs/src/routes/**'],
		rules: {
			'sonarjs/no-duplicate-string': 'off',
			'sonarjs/cognitive-complexity': 'off',
			// Demo pages seed item ids and colours with Math.random(); nothing here is
			// security-sensitive.
			'sonarjs/pseudo-random': 'off'
		}
	},

	// Tests intentionally repeat literals and build throwaway fixtures.
	{
		files: ['tests/**'],
		rules: {
			'sonarjs/no-duplicate-string': 'off',
			'security/detect-object-injection': 'off'
		}
	},

	// Config files run in Node at build time; the security plugin's filesystem
	// heuristics flag ordinary path joins there.
	{
		files: ['*.config.{js,ts,cjs,mjs}', 'docs/*.config.{js,ts,cjs,mjs}'],
		rules: {
			'security/detect-non-literal-fs-filename': 'off'
		}
	}
);
