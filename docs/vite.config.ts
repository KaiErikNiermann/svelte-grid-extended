import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, escapeSvelte, type MdsvexOptions } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import { codeToHtml } from 'shiki';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const SHIKI_THEMES = {
	light: 'github-light',
	dark: 'github-dark'
};
const SUPPORTED_LANGUAGES = new Set([
	'svelte',
	'html',
	'typescript',
	'javascript',
	'css',
	'bash',
	'json',
	'yaml'
]);
const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
	js: 'javascript',
	ts: 'typescript',
	sh: 'bash',
	shell: 'bash',
	yml: 'yaml'
};

const normalizeLanguage = (lang: string | null | undefined): string => {
	if (!lang) return 'text';
	const key = lang.toLowerCase();
	return LANGUAGE_ALIASES[key] ?? key;
};

const mdsvexOptions: MdsvexOptions = {
	extensions: ['.md', '.svx'],
	highlight: {
		highlighter: async (code, lang) => {
			const normalized = normalizeLanguage(lang);
			const safeLang = SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'text';
			const html = await codeToHtml(code, { lang: safeLang, themes: SHIKI_THEMES });
			return `{@html \`${escapeSvelte(html)}\`}`;
		}
	},
	rehypePlugins: [rehypeSlug]
};

// SvelteKit wants `paths.base` to be empty or root-relative; BASE_PATH comes from the deploy
// workflow, so reject a malformed value here rather than ship a site with broken links.
const basePath = (): '' | `/${string}` => {
	if (process.argv.includes('dev')) return '';
	const base = process.env.BASE_PATH ?? '';
	if (base === '' || base.startsWith('/')) return base as '' | `/${string}`;
	throw new Error(`BASE_PATH must be empty or start with "/", got ${JSON.stringify(base)}`);
};

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(projectRoot, 'src') + path.sep;

export default defineConfig({
	plugins: [
		sveltekit({
			extensions: ['.svelte', '.md', '.svx'],
			preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
			dynamicCompileOptions: ({ filename }) => {
				if (filename && filename.startsWith(srcRoot)) {
					return { runes: true };
				}
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html',
				precompress: false,
				strict: true
			}),
			paths: {
				base: basePath()
			}
		})
	],
	server: {
		port: 5174
	}
});
