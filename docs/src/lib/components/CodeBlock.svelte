<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';
	import { codeToHtml } from 'shiki/bundle/web';
	import { cn } from '$lib/utils';

	interface Props {
		code: string;
		lang?: string;
		class?: string;
	}

	let { code, lang = 'svelte', class: className }: Props = $props();

	let copied = $state(false);
	let highlighted = $state<string | null>(null);
	let highlightToken = 0;

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
	const LANGUAGE_ALIASES: Record<string, string> = {
		js: 'javascript',
		ts: 'typescript',
		sh: 'bash',
		shell: 'bash',
		yml: 'yaml'
	};

	const normalizeLanguage = (value: string | undefined) => {
		if (!value) return 'text';
		const key = value.toLowerCase();
		return LANGUAGE_ALIASES[key] ?? key;
	};

	$effect(() => {
		const token = ++highlightToken;
		const normalized = normalizeLanguage(lang);
		const safeLang = SUPPORTED_LANGUAGES.has(normalized) ? normalized : 'text';
		highlighted = null;
		codeToHtml(code, {
			lang: safeLang,
			themes: {
				light: 'github-light',
				dark: 'github-dark'
			}
		})
			.then((html) => {
				if (token === highlightToken) {
					highlighted = html;
				}
			})
			.catch(() => {
				if (token === highlightToken) {
					highlighted = null;
				}
			});
	});

	async function copyCode() {
		await navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<div class={cn('relative group', className)} data-codeblock>
	<div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
		<button
			onclick={copyCode}
			class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted hover:bg-muted/80 transition-colors"
			aria-label="Copy code"
		>
			{#if copied}
				<Check class="h-4 w-4 text-green-500" />
			{:else}
				<Copy class="h-4 w-4" />
			{/if}
		</button>
	</div>
	{#if lang}
		<span class="absolute right-12 top-2 text-xs text-muted-foreground">{lang}</span>
	{/if}
	{#if highlighted}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html highlighted}
	{:else}
		<pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm"><code>{code}</code></pre>
	{/if}
</div>
