import { transformerTwoslash, rendererRich, defaultHoverInfoProcessor } from '@shikijs/twoslash';
import type { ElementContent } from 'hast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { escapeSvelte } from 'mdsvex';
import { codeToHtml } from 'shiki';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTwoslasher } from './twoslash-svelte-props.ts';

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

// Types are resolved from the docs app's own node_modules, where `@appulsauce/svelte-grid` is a
// link to the repository root and so resolves to the built `dist/*.d.ts`.
const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// One instance for the whole build: it keeps the TypeScript lib files parsed between blocks.
const twoslasher = createTwoslasher({
	vfsRoot: docsRoot,
	compilerOptions: {
		target: 99 /* ESNext */,
		module: 99 /* ESNext */,
		moduleResolution: 100 /* Bundler */,
		lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
		strict: true,
		skipLibCheck: true,
		verbatimModuleSyntax: true
	}
});

// A Svelte 5 component is declared as `const Grid: Component<...>` plus `type Grid =
// ReturnType<typeof Grid>`, and TypeScript prints the second as the legacy `{ $on?, $set? }`
// shape. Only the `const` line says anything about the component.
const LEGACY_INSTANCE_TYPE = /^type \w+ = \{\n\s+\$on\?[\s\S]*?\n\}\n(?=const )/;
const processHoverInfo = (info: string): string =>
	defaultHoverInfoProcessor(info).replace(LEGACY_INSTANCE_TYPE, '');

/** Hover docs are JSDoc, i.e. Markdown: rendered so `code`, emphasis and links show as such. */
function renderMarkdown(markdown: string): ElementContent[] {
	const tree = toHast(fromMarkdown(markdown));
	return tree.type === 'root' ? (tree.children as ElementContent[]) : [tree as ElementContent];
}

/** The same for inline places (a tag's text): one paragraph renders as its contents. */
function renderMarkdownInline(markdown: string): ElementContent[] {
	const nodes = renderMarkdown(markdown);
	const [only] = nodes;
	return nodes.length === 1 && only?.type === 'element' && only.tagName === 'p'
		? only.children
		: nodes;
}

const twoslash = transformerTwoslash({
	// Blocks opt in with a `twoslash` meta on the fence, so a page can keep illustrative fragments.
	explicitTrigger: true,
	langs: ['ts', 'typescript', 'svelte'],
	twoslasher,
	renderer: rendererRich({
		errorRendering: 'hover',
		processHoverInfo,
		renderMarkdown,
		renderMarkdownInline
	})
});

const normalizeLanguage = (lang: string | null | undefined): string => {
	if (!lang) return 'text';
	const key = lang.toLowerCase();
	return LANGUAGE_ALIASES[key] ?? key;
};

/**
 * The mdsvex highlighter: Shiki at build time, with twoslash hovers on fences marked `twoslash`.
 * A type error in such a fence throws, which fails the build.
 */
export async function highlight(
	code: string,
	lang: string | null | undefined,
	meta: string | null | undefined,
	filename: string | undefined
): Promise<string> {
	const normalized = normalizeLanguage(lang);
	const safeLang = SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'text';
	try {
		const html = await codeToHtml(code, {
			lang: safeLang,
			themes: SHIKI_THEMES,
			meta: { __raw: meta ?? '' },
			transformers: [twoslash]
		});
		return `{@html \`${escapeSvelte(html)}\`}`;
	} catch (error) {
		const where = path.relative(docsRoot, filename ?? '<unknown>');
		// The offsets in twoslash's error list are into generated code, so show the whole block.
		const block = code
			.split('\n')
			.map((line, index) => `${String(index + 1).padStart(3)} | ${line}`)
			.join('\n');
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`${where}: ${safeLang} block failed\n${block}\n\n${reason}`, {
			cause: error
		});
	}
}
