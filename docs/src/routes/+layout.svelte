<script lang="ts">
	import '../app.css';
	import { Header, Sidebar, CodeCopyEnhancer } from '$lib/components';
	import { afterNavigate } from '$app/navigation';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let mainEl: HTMLElement | null = null;

	afterNavigate(() => {
		mainEl?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
	});
</script>

<div class="h-screen flex flex-col">
	<Header />
	<div class="flex-1 min-h-0 overflow-hidden">
		<div class="h-full min-h-0 flex gap-10 px-4 md:px-6">
			<aside class="hidden lg:block w-64 shrink-0 min-h-0 py-8">
				<div class="h-full min-h-0 overflow-y-auto overscroll-contain pr-2">
					<Sidebar />
				</div>
			</aside>
			<main bind:this={mainEl} class="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain">
				<div class="w-full max-w-5xl py-8">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
</div>

<CodeCopyEnhancer />
