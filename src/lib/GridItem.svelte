<script lang="ts">
	import { onMount, untrack } from 'svelte';

	import { coordinate2size, calcPosition, snapOnMove, snapOnResize, type SnapGridParams } from './utils/item';
	import { blockingRow, hasCollisions, getCollisions, getAvailablePosition } from './utils/grid';
	import { assignBox, parseCoordinate, parseSize } from './utils/placement';
	import { displaceStep, type DragState, type Placed } from './utils/displace';

	import type { LayoutItem, GridItemProps } from './types';
	import { getGridContext } from './Grid.svelte';

	let {
		id = crypto.randomUUID(),
		x = $bindable(),
		y = $bindable(),
		w = $bindable(1),
		h = $bindable(1),
		min = { w: 1, h: 1 },
		max,
		movable = true,
		resizable = true,
		class: classes,
		activeClass,
		previewClass,
		resizerClass,
		style = '',
		onchange,
		onpreviewchange,
		children,
		moveHandle,
		resizeHandle
	}: GridItemProps = $props();

	// Get grid context - this returns a reactive reference wrapper
	const gridParamsRef = getGridContext();

	// Access current within reactive contexts ($effect, $derived, template)
	const gridParams = $derived(gridParamsRef.current);

	let active = $state(false);
	let left = $state(0);
	let top = $state(0);
	let width = $state(0);
	let height = $state(0);

	/**
	 * Item object that is used in `gridParams.items`.
	 */
	let item = $state<LayoutItem>({
		id: '',
		x: 0,
		y: 0,
		w: 1,
		h: 1,
		min: { w: 1, h: 1 },
		max: undefined,
		movable: true,
		resizable: true,
		invalidate
	});

	// Sync props to item
	$effect(() => {
		item.id = id;
		item.min = min;
		item.max = max;
		item.movable = movable;
		item.resizable = resizable;
		const next = { x, y, w, h };
		untrack(() => syncBox(next));
	});

	let registered = false;

	/**
	 * Copies the x/y/w/h props into the item, parsed into whole cells. Before registration a
	 * missing or unusable x/y stays missing, so the grid places the item, and an unusable size
	 * becomes 1. Afterwards a real change is handed to the grid to re-validate, and an unusable
	 * value keeps the item's current one. Changes made by the grid itself arrive here equal to
	 * the item, through `invalidate`, and do nothing.
	 */
	function syncBox(next: { x: number | undefined; y: number | undefined; w: number; h: number }) {
		const parsed = {
			x: parseCoordinate(next.x),
			y: parseCoordinate(next.y),
			w: parseSize(next.w),
			h: parseSize(next.h)
		};
		if (!registered) {
			// x/y may stay undefined here: registration places such an item and writes x/y back.
			Object.assign(item, { x: parsed.x as number, y: parsed.y as number, w: parsed.w ?? 1, h: parsed.h ?? 1 });
			return;
		}
		const box = { x: parsed.x ?? item.x, y: parsed.y ?? item.y, w: parsed.w ?? item.w, h: parsed.h ?? item.h };
		// A drag or resize in progress settles the item when it ends.
		if (assignBox(item, box) && !active) gridParams.settleItem(item);
		writeBackIfNormalized();
	}

	/** Writes the item's values to the bound props when they differ (rounded, clamped, placed). */
	function writeBackIfNormalized() {
		if (x !== item.x || y !== item.y || w !== item.w || h !== item.h) item.invalidate();
	}

	/**
	 * Updates svelte-components props behind that item.
	 */
	function invalidate() {
		x = item.x;
		y = item.y;
		w = item.w;
		h = item.h;
		onchange?.({ item });
		gridParams.onchange({ item });
		gridParams.updateGrid();
	}

	onMount(() => {
		gridParams.registerItem(item);
		registered = true;
		writeBackIfNormalized();
		return () => {
			registered = false;
			// A drag or resize only removes its window listeners on pointerup. Destroyed
			// mid-gesture (the item removed, or its grid), they stayed attached, kept the
			// destroyed item alive and threw on the next pointerup.
			removeGestureListeners();
			// Destroyed mid-drag: the drag never drops, so items that made way go back.
			abortShift();
			gridParams.unregisterItem(item);
		};
	});

	// Reposition item on grid change
	$effect(() => {
		if (!active && gridParams.itemSize) {
			const newPosition = calcPosition(item, {
				itemSize: gridParams.itemSize,
				gap: gridParams.gap
			});
			left = newPosition.left;
			top = newPosition.top;
			width = newPosition.width;
			height = newPosition.height;
		}
	});

	let previewItem = $state<LayoutItem>({ ...item });

	$effect(() => {
		if (!active && item) {
			previewItem = { ...item };
		}
	});

	$effect(() => {
		onpreviewchange?.({ item: previewItem });
	});

	function applyPreview() {
		item.x = previewItem.x;
		item.y = previewItem.y;
		item.w = previewItem.w;
		item.h = previewItem.h;
		item.invalidate();
	}

	// INTERACTION LOGIC

	let itemRef: HTMLElement;

	const initialPointerPosition = { left: 0, top: 0 };

	/** The preview's box when the gesture began, to tell a drop from a press that moved nothing. */
	let gestureStart = { x: 0, y: 0, w: 0, h: 0 };

	function initInteraction(event: PointerEvent) {
		active = true;
		gestureStart = { x: previewItem.x, y: previewItem.y, w: previewItem.w, h: previewItem.h };
		initialPointerPosition.left = event.pageX;
		initialPointerPosition.top = event.pageY;
		itemRef.setPointerCapture(event.pointerId);
	}

	/**
	 * Whether the drop should take the preview's box. A gesture that never moved the preview
	 * keeps the item where it is now, which the grid may have changed meanwhile (a reflow, a
	 * push), instead of putting it back where the gesture started.
	 */
	function previewIsDrop(): boolean {
		const { x: px, y: py, w: pw, h: ph } = previewItem;
		const start = gestureStart;
		return px !== start.x || py !== start.y || pw !== start.w || ph !== start.h;
	}

	function endInteraction(event: PointerEvent) {
		if (previewIsDrop()) applyPreview();
		active = false;
		shiftState = undefined;
		gridParams.setDragTarget(null);
		// Props may have moved another item onto this one during the gesture.
		gridParams.settleItem(item);
		initialPointerPosition.left = 0;
		initialPointerPosition.top = 0;
		itemRef.releasePointerCapture(event.pointerId);
		gridParams.updateGrid();
	}

	// MOVE ITEM LOGIC

	let initialPosition = { left: 0, top: 0 };

	const _movable = $derived(!gridParams.readOnly && movable);

	function moveStart(event: PointerEvent) {
		if (event.button !== 0) return;
		event.stopPropagation();
		initInteraction(event);
		initialPosition = { left, top };
		if (gridParams.collision === 'shift') startShift();
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', gestureEnd);
	}

	function move(event: PointerEvent) {
		if (!gridParams.itemSize) {
			throw new Error('Grid is not mounted yet');
		}
		let _left = event.pageX - initialPointerPosition.left + initialPosition.left;
		let _top = event.pageY - initialPointerPosition.top + initialPosition.top;

		if (gridParams.bounds && gridParams.boundsTo) {
			const parentRect = gridParams.boundsTo.getBoundingClientRect();
			if (_left < parentRect.left) {
				_left = parentRect.left;
			}
			if (_top < parentRect.top) {
				_top = parentRect.top;
			}
			if (_left + width > parentRect.right) {
				_left = parentRect.right - width;
			}
			if (_top + height > parentRect.bottom) {
				_top = parentRect.bottom - height;
			}
		}

		left = _left;
		top = _top;

		// Snap and handle collisions
		const snapParams = gridParams as SnapGridParams;
		const { x: newX, y: newY } = snapOnMove(left, top, previewItem, snapParams);
		movePreview(newX, newY);
	}

	function movePreview(newX: number, newY: number) {
		if (gridParams.collision === 'shift') {
			moveWithShift(newX, newY);
		} else if (gridParams.collision === 'none') {
			if (!hasCollisions({ ...previewItem, x: newX, y: newY }, Object.values(gridParams.items))) {
				previewItem = { ...previewItem, x: newX, y: newY };
			}
		} else {
			movePreviewWithCollisions(newX, newY);
		}
	}

	function updateCollItemPositionWithPush(collItem: LayoutItem, items: LayoutItem[]) {
		const newPosition = getAvailablePosition(collItem, items, gridParams.maxCols, gridParams.maxRows);
		if (newPosition) {
			const { x, y } = newPosition;
			collItem.x = x;
			collItem.y = y;
			collItem.invalidate();
		}
		gridParams.updateGrid();
	}

	function handleCollisionsForPreviewItemWithPush(newAttributes: { x?: number; y?: number; w?: number; h?: number }) {
		const gridItems = Object.values(gridParams.items);
		const itemsExceptPreview = gridItems.filter((item) => item.id != previewItem.id);
		const collItems = getCollisions({ ...previewItem, ...newAttributes }, itemsExceptPreview);

		for (const collItem of collItems) {
			const itemsExceptCollItem = gridItems.filter((item) => item.id != collItem.id);
			const items = [
				...itemsExceptCollItem.filter((item) => item.id != previewItem.id),
				{ ...previewItem, ...newAttributes }
			];
			updateCollItemPositionWithPush(collItem, items);
		}

		previewItem = { ...previewItem, ...newAttributes };
		gridParams.updateGrid();
		applyPreview();
	}

	function movePreviewWithCollisionsWithPush(x: number, y: number) {
		handleCollisionsForPreviewItemWithPush({ x, y });
	}

	// Vertical-compression search: the nested scan over colliding items is inherently
	// branchy and has no component-level test coverage, so it is left intact rather
	// than split up for the metric's sake.
	// eslint-disable-next-line sonarjs/cognitive-complexity
	function movePreviewWithCollisionsWithCompress(newX: number, newY: number) {
		const gridItems = Object.values(gridParams.items);
		let computedY = newY;
		const itemsExceptPreview = gridItems.filter((i) => i.id != previewItem.id);
		while (computedY >= 0) {
			const collItems = getCollisions({ ...previewItem, x: newX, y: computedY }, gridItems);
			if (collItems.length > 0) {
				const sortedItems = collItems.sort((a, b) => b.y - a.y);
				let moved = false;
				for (const sortItem of sortedItems) {
					if (newY + previewItem.h / 2 >= sortItem.y + sortItem.h / 2) {
						moved = true;
						computedY = sortItem.y + sortItem.h;
						for (const itm of sortedItems) {
							if (
								!hasCollisions({ ...itm, y: itm.y - previewItem.h }, itemsExceptPreview) &&
								itm.y - previewItem.h >= 0
							) {
								itm.y -= previewItem.h;
								itm.invalidate();
							}
						}
					}
				}
				if (!moved) {
					computedY = previewItem.y;
				}
				break;
			}
			computedY--;
		}
		if (computedY < 0 || newY === 0) {
			computedY = 0;
		}
		const positionChanged = newX != previewItem.x || computedY != previewItem.y;
		previewItem = { ...previewItem, x: newX, y: computedY };
		if (positionChanged) {
			compressItems();
			applyPreview();
		}
	}

	// SHIFT: the other items make way around the drag, recomputed from where they were when it
	// started, so an item that moved aside returns once the drag moves on.

	let shiftSnapshot = new Map<string, Placed>();
	/** Where the last applied layout put each item; a different position means the app moved it. */
	let shiftExpected = new Map<string, { x: number; y: number }>();
	let shiftState: DragState | undefined;

	const placed = ({ id: pid, x: px, y: py, w: pw, h: ph }: LayoutItem): Placed => ({
		id: pid,
		x: px,
		y: py,
		w: pw,
		h: ph
	});

	function startShift() {
		shiftSnapshot = new Map();
		shiftExpected = new Map();
		shiftState = { displaced: new Set(), target: { x: item.x, y: item.y }, layout: new Map() };
		gridParams.setDragTarget(placed(item));
	}

	/** Takes items added, removed or moved by the app during the drag into the snapshot. */
	function refreshShiftSnapshot() {
		const others = Object.values(gridParams.items).filter((other) => other.id !== item.id);
		const live = new Set(others.map((other) => other.id));
		for (const id of shiftSnapshot.keys()) if (!live.has(id)) shiftSnapshot.delete(id);
		for (const other of others) {
			const expected = shiftExpected.get(other.id);
			if (!expected || expected.x !== other.x || expected.y !== other.y) {
				shiftSnapshot.set(other.id, placed(other));
				shiftExpected.set(other.id, { x: other.x, y: other.y });
			}
		}
	}

	/** Ends a shift drag without a drop: items the drag moved go back where they started, when that cell is still free. */
	function abortShift() {
		if (!shiftState) return;
		for (const [otherId, start] of shiftSnapshot) {
			const other = gridParams.items[otherId];
			const expected = shiftExpected.get(otherId);
			// Skip items the app moved itself during the drag, and ones already home.
			if (!other || !expected || other.x !== expected.x || other.y !== expected.y) continue;
			if (other.x === start.x && other.y === start.y) continue;
			if (hasCollisions({ ...other, x: start.x, y: start.y }, Object.values(gridParams.items))) continue;
			other.x = start.x;
			other.y = start.y;
			other.invalidate();
		}
		shiftState = undefined;
		gridParams.setDragTarget(null);
	}

	function moveWithShift(newX: number, newY: number) {
		if (!shiftState) return;
		refreshShiftSnapshot();
		const { itemSize, gap, maxCols, maxRows } = gridParams as SnapGridParams;
		// The live, unsnapped position in cells: how far the drag has come over its neighbours.
		// Inverse of calcPosition: $\text{left} = x \cdot (\text{width} + gap) + gap$.
		const approach = { x: (left - gap) / (itemSize.width + gap), y: (top - gap) / (itemSize.height + gap) };
		const step = displaceStep([...shiftSnapshot.values()], previewItem, approach, { x: newX, y: newY }, shiftState, {
			cols: maxCols,
			rows: maxRows
		});
		shiftState = step;
		if (!step.changed) return;
		for (const [otherId, cell] of step.layout) {
			shiftExpected.set(otherId, cell);
			const other = gridParams.items[otherId];
			if (other && (other.x !== cell.x || other.y !== cell.y)) {
				other.x = cell.x;
				other.y = cell.y;
				other.invalidate();
			}
		}
		previewItem = { ...previewItem, ...step.target };
		gridParams.setDragTarget(placed(previewItem));
		gridParams.updateGrid();
	}

	function movePreviewWithCollisions(x: number, y: number) {
		if (gridParams.collision === 'compress') {
			movePreviewWithCollisionsWithCompress(x, y);
		} else {
			movePreviewWithCollisionsWithPush(x, y);
		}
	}

	/** Pointerup for a move or a resize: both end the same way. */
	function gestureEnd(event: PointerEvent) {
		if (event.button !== 0) return;
		endInteraction(event);
		removeGestureListeners();
	}

	function removeGestureListeners() {
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointermove', resize);
		window.removeEventListener('pointerup', gestureEnd);
	}

	// RESIZE ITEM LOGIC

	let initialSize = { width: 0, height: 0 };

	const minSize = $derived.by(() => {
		if (gridParams.itemSize) {
			return {
				width: coordinate2size(min.w, gridParams.itemSize.width, gridParams.gap),
				height: coordinate2size(min.h, gridParams.itemSize.height, gridParams.gap)
			};
		}
	});

	const maxSize = $derived.by(() => {
		if (gridParams.itemSize && max) {
			return {
				width: coordinate2size(max.w, gridParams.itemSize.width, gridParams.gap),
				height: coordinate2size(max.h, gridParams.itemSize.height, gridParams.gap)
			};
		}
	});

	const _resizable = $derived(!gridParams.readOnly && item.resizable);

	function resizeStart(event: PointerEvent) {
		if (event.button !== 0) return;
		event.stopPropagation();
		initInteraction(event);
		initialSize = { width, height };
		window.addEventListener('pointermove', resize);
		window.addEventListener('pointerup', gestureEnd);
	}

	function resize(event: PointerEvent) {
		if (!gridParams.itemSize) {
			throw new Error('Grid is not mounted yet');
		}

		width = event.pageX + initialSize.width - initialPointerPosition.left;
		height = event.pageY + initialSize.height - initialPointerPosition.top;

		if (gridParams.bounds && gridParams.boundsTo) {
			const parentRect = gridParams.boundsTo.getBoundingClientRect();
			if (width + left > parentRect.width) {
				width = parentRect.width - left;
			}
			if (height + top > parentRect.height) {
				height = parentRect.height - top;
			}
		}

		if (minSize) {
			width = Math.max(width, minSize.width);
			height = Math.max(height, minSize.height);
		}
		if (maxSize) {
			width = Math.min(width, maxSize.width);
			height = Math.min(height, maxSize.height);
		}

		const snapParams = gridParams as SnapGridParams;
		const { w: newW, h: newH } = snapOnResize(width, height, previewItem, snapParams);
		if (gridParams.collision === 'none') {
			if (!hasCollisions({ ...previewItem, w: newW, h: newH }, Object.values(gridParams.items))) {
				previewItem = { ...previewItem, w: newW, h: newH };
			}
		} else {
			resizePreviewWithCollisions(newW, newH);
		}
	}

	function resizePreviewWithCollisionsWithPush(newW: number, newH: number) {
		handleCollisionsForPreviewItemWithPush({ w: newW, h: newH });
	}

	function resizePreviewWithCollisionsWithCompress(newW: number, newH: number) {
		const sizeChanged = newW != previewItem.w || newH != previewItem.h;
		if (sizeChanged) {
			const hGap = newH - previewItem.h;
			previewItem = { ...previewItem, w: newW, h: newH };
			applyPreview();
			const collItems = getCollisions({ ...previewItem, w: newW, h: 9999 }, Object.values(gridParams.items));
			for (const i of collItems) {
				i.y += hGap;
				i.invalidate();
				gridParams.updateGrid();
			}
			compressItems();
		}
	}

	function resizePreviewWithCollisions(w: number, h: number) {
		if (gridParams.collision === 'compress') {
			resizePreviewWithCollisionsWithCompress(w, h);
		} else {
			resizePreviewWithCollisionsWithPush(w, h);
		}
	}

	function compressItems() {
		const gridItems = Object.values(gridParams.items);
		const sortedItems = [...gridItems].sort((a, b) => a.y - b.y);
		sortedItems.reduce(
			(accItem, currentItem) => {
				if (currentItem.id === previewItem.id) {
					// if previewItem do nothing
				} else if (previewItem.y < currentItem.y + currentItem.h) {
					// compress items above previewItem
					const maxY =
						currentItem.y >= previewItem.y ? currentItem.y + previewItem.h + 1 : previewItem.y + currentItem.h + 1;
					const newY = blockingRow(currentItem, accItem, maxY);
					currentItem.y = newY + 1;
					currentItem.invalidate();
					gridParams.updateGrid();
					accItem.push(currentItem);
				} else {
					// compress items below previewItem
					const newY = blockingRow(currentItem, accItem, currentItem.y);
					if (newY < currentItem.y && newY > 0) {
						currentItem.y = newY + 1;
					}
					currentItem.invalidate();
					gridParams.updateGrid();
					accItem.push(currentItem);
				}
				return accItem;
			},
			[previewItem as LayoutItem]
		);
	}

	const hasMoveHandle = $derived(!!moveHandle);
</script>

<div
	role="group"
	class={`${classes ?? ''} ${active ? (activeClass ?? '') : ''}`}
	class:item-default={!classes}
	class:active-default={!activeClass && active}
	class:non-active-default={!active}
	onpointerdown={_movable && !hasMoveHandle ? moveStart : undefined}
	style={`position: absolute; left:${left}px; top:${top}px; width: ${width}px; height: ${height}px; 
			${_movable && !hasMoveHandle ? 'cursor: move;' : ''} touch-action: none; user-select: none;
			${style}`}
	bind:this={itemRef}
>
	{#if _movable && moveHandle}
		{@render moveHandle({ moveStart })}
	{/if}

	{#if children}
		{@render children({ id, active, w, h })}
	{/if}

	{#if _resizable}
		{#if resizeHandle}
			{@render resizeHandle({ resizeStart })}
		{:else}
			<div
				role="button"
				tabindex="0"
				class={resizerClass ?? ''}
				class:resizer-default={!resizerClass}
				onpointerdown={resizeStart}
			></div>
		{/if}
	{/if}
</div>

{#if active && gridParams.itemSize}
	{@const preview = calcPosition(previewItem, {
		itemSize: gridParams.itemSize,
		gap: gridParams.gap
	})}
	<div
		class={previewClass ?? ''}
		class:item-preview-default={!previewClass}
		style={`position: absolute; left:${preview.left}px; top:${preview.top}px;  
		width: ${preview.width}px; height: ${preview.height}px; z-index: -10;`}
	></div>
{/if}

<style>
	.item-default {
		transition:
			width 0.2s,
			height 0.2s;
		transition:
			transform 0.2s,
			opacity 0.2s;
	}
	.active-default {
		opacity: 0.7;
	}
	.item-preview-default {
		background-color: rgb(192, 127, 127);
		transition: all 0.2s;
	}
	.non-active-default {
		transition:
			left 0.2s,
			top 0.2s;
		transition-timing-function: ease-in-out;
	}
	.resizer-default {
		user-select: none;
		touch-action: none;
		position: absolute;
		width: 20px;
		height: 20px;
		right: 0;
		bottom: 0;
		cursor: se-resize;
	}
	.resizer-default::after {
		content: '';
		position: absolute;
		right: 3px;
		bottom: 3px;
		width: 5px;
		height: 5px;
		border-right: 2px solid rgba(0, 0, 0, 0.4);
		border-bottom: 2px solid rgba(0, 0, 0, 0.4);
	}
</style>
