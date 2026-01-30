<script lang="ts">
	import Grid, { GridItem } from '$lib';
</script>

<Grid cols={10} rows={10}>
	<GridItem x={0} y={0} w={2} h={3} class="flex flex-col gap-3 bg-slate-300 p-3">
		{#snippet moveHandle({ moveStart })}
			<div class="p-2 bg-slate-600 rounded text-white cursor-move" role="button" tabindex="0" onpointerdown={moveStart}>
				MOVE
			</div>
		{/snippet}

		{#snippet children()}
			<img
				src="https://t4.ftcdn.net/jpg/00/97/58/97/360_F_97589769_t45CqXyzjz0KXwoBZT9PRaWGHRk5hQqQ.jpg"
				alt="cat"
				class="w-full h-full object-cover"
				draggable="false"
			/>
		{/snippet}

		{#snippet resizeHandle({ resizeStart })}
			<div
				class="p-2 bg-slate-600 rounded text-white cursor-nwse-resize"
				role="button"
				tabindex="0"
				onpointerdown={resizeStart}
			>
				Resize
			</div>
		{/snippet}
	</GridItem>

	<GridItem x={2} y={0} w={2} h={3} class="flex flex-col gap-3 bg-slate-300 p-3">
		{#snippet moveHandle({ moveStart })}
			<div class="p-2 bg-slate-600 rounded text-white cursor-move" role="button" tabindex="0" onpointerdown={moveStart}>
				MOVE
			</div>
		{/snippet}

		{#snippet children()}
			<img
				src="https://t4.ftcdn.net/jpg/00/97/58/97/360_F_97589769_t45CqXyzjz0KXwoBZT9PRaWGHRk5hQqQ.jpg"
				alt="cat"
				class="w-full h-full object-cover"
				draggable="false"
			/>
		{/snippet}
	</GridItem>

	<GridItem x={4} y={0} w={2} h={3} class="flex flex-col gap-3 bg-slate-300 p-3">
		{#snippet children()}
			<img
				src="https://t4.ftcdn.net/jpg/00/97/58/97/360_F_97589769_t45CqXyzjz0KXwoBZT9PRaWGHRk5hQqQ.jpg"
				alt="cat"
				class="w-full h-full object-cover"
				draggable="false"
			/>
		{/snippet}

		{#snippet resizeHandle({ resizeStart })}
			<div
				class="p-2 bg-slate-600 rounded text-white cursor-nwse-resize"
				role="button"
				tabindex="0"
				onpointerdown={resizeStart}
			>
				Resize
			</div>
		{/snippet}
	</GridItem>
</Grid>
