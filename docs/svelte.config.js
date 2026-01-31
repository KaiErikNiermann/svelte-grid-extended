import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, escapeSvelte } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import { codeToHtml } from 'shiki';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const LANGUAGE_ALIASES = {
	js: 'javascript',
	ts: 'typescript',
	sh: 'bash',
	shell: 'bash',
	yml: 'yaml'
};

const normalizeLanguage = (lang) => {
	if (!lang) return 'text';
	const key = lang.toLowerCase();
	return LANGUAGE_ALIASES[key] ?? key;
};

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
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

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(projectRoot, 'src') + path.sep;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
	dynamicCompileOptions: ({ filename }) => {
		if (filename && filename.startsWith(srcRoot)) {
			return { runes: true };
		}
	},

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? '')
		}
	}
};

export default config;
