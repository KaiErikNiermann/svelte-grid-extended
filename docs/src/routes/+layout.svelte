<script lang="ts">
	import '../app.css';
	import { Header, Sidebar, CodeCopyEnhancer } from '$lib/components';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen">
	<Header />
	<div class="container flex gap-10 px-4 md:px-6 py-8">
		<aside class="hidden lg:block w-64 shrink-0">
			<div class="sticky top-20">
				<Sidebar />
			</div>
		</aside>
		<main class="flex-1 min-w-0">
			{@render children()}
		</main>
	</div>
</div>

<CodeCopyEnhancer />
