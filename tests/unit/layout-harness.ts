/**
 * Shared harness for component-level layout tests: mounts a real `<Grid>` with `<GridItem>`s
 * in jsdom, drives it (props, container resizes, pointer drags and resizes) and checks the
 * layout invariants every collision mode is meant to keep.
 */
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, vi } from 'vitest';

import Layout from './fixtures/Layout.svelte';
import type { LayoutSpec } from './fixtures/layout-types';
import type { Collision } from '../../src/lib/types';

export type { LayoutSpec } from './fixtures/layout-types';

/** Cell size used by every harness grid; with `gap: 0` a cell's pixel origin is `x * CELL`. */
export const CELL = 100;
export const MODES: readonly Collision[] = ['none', 'push', 'compress'];
/** Item size given in full, so items mount before the first resize, as in a browser. */
export const FIXED_SIZE = { itemSize: { width: CELL, height: CELL } };

export const item = (id: string, x: number, y: number, w = 1, h = 1): LayoutSpec => ({ id, x, y, w, h });

/**
 * Registers per-test setup: `ResizeObserver` is replaced by one the test fires by hand (a
 * browser fires it after layout), pointer capture is stubbed (jsdom lacks it), and every
 * mounted grid is cleaned up afterwards.
 */
export function useLayoutHarness(): { resizeTo: (width: number, height: number) => void } {
	let callbacks: ResizeObserverCallback[] = [];
	beforeEach(() => {
		callbacks = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(callback: ResizeObserverCallback) {
					callbacks.push(callback);
				}
				observe() {}
				unobserve() {}
				disconnect() {}
			}
		);
		HTMLElement.prototype.setPointerCapture = () => {};
		HTMLElement.prototype.releasePointerCapture = () => {};
	});
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});
	return {
		resizeTo: (width, height) => {
			for (const callback of callbacks) {
				callback([{ contentRect: { width, height } } as ResizeObserverEntry], {} as ResizeObserver);
			}
		}
	};
}

export type LayoutComponent = {
	add: (...specs: LayoutSpec[]) => void;
	remove: (id: string) => void;
	patch: (id: string, change: Partial<LayoutSpec>) => void;
	setGrid: (change: Record<string, unknown>) => void;
	snapshot: () => LayoutSpec[];
	getController: () => import('../../src/lib/types').GridController | undefined;
};

export type MountedLayout = {
	component: LayoutComponent;
	container: HTMLElement;
	unmount: () => void;
	settle: () => Promise<void>;
	/** Distance in pixels from one cell's origin to the next: `CELL + gap`. */
	pitch: number;
	drag: (id: string, dx: number, dy: number, during?: () => Promise<void>) => Promise<void>;
	/** A drag through several pointer moves, each in cells from the start; push reacts to each. */
	dragPath: (id: string, path: readonly (readonly [number, number])[]) => Promise<void>;
	resize: (id: string, dw: number, dh: number, during?: () => Promise<void>) => Promise<void>;
	drawn: () => Record<string, { x: number; y: number; w: number; h: number }>;
	gridElement: () => HTMLElement;
};

/** Lets effects, and the effects they schedule, run to completion. */
async function settle(): Promise<void> {
	for (let i = 0; i < 3; i++) await tick();
}

function pointer(target: EventTarget, type: string, x: number, y: number) {
	target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }));
}

export function mountLayout(options: {
	grid: Record<string, unknown>;
	items: LayoutSpec[];
	onchange?: (id: string) => void;
}): MountedLayout {
	const { component, container, unmount } = render(Layout, {
		props: { grid: { gap: 0, ...options.grid }, initial: options.items, onchange: options.onchange }
	});
	const layout = component as unknown as LayoutComponent;
	const gap = typeof options.grid.gap === 'number' ? options.grid.gap : 0;
	const pitch = CELL + gap;
	// Inverse of calcPosition: $\text{left} = x \cdot pitch + gap$, $\text{width} = w \cdot pitch - gap$.
	const toCells = (left: string, top: string, width: string, height: string) => ({
		x: (Number.parseFloat(left) - gap) / pitch,
		y: (Number.parseFloat(top) - gap) / pitch,
		w: (Number.parseFloat(width) + gap) / pitch,
		h: (Number.parseFloat(height) + gap) / pitch
	});

	async function gesture(selector: string, path: readonly (readonly [number, number])[], during?: () => Promise<void>) {
		const handle = container.querySelector(selector);
		if (!handle) throw new Error(`nothing matches ${selector}`);
		pointer(handle, 'pointerdown', 0, 0);
		for (const [dx, dy] of path) {
			pointer(window, 'pointermove', dx * pitch, dy * pitch);
			await settle();
		}
		if (during) await during();
		const [endX, endY] = path.at(-1) ?? [0, 0];
		pointer(window, 'pointerup', endX * pitch, endY * pitch);
		await settle();
	}

	return {
		component: layout,
		container,
		unmount,
		settle,
		pitch,
		drag: (id, dx, dy, during) => gesture(`.it-${id}`, [[dx, dy]], during),
		dragPath: (id, path) => gesture(`.it-${id}`, path),
		resize: (id, dw, dh, during) => gesture(`.it-${id} .resizer-default`, [[dw, dh]], during),
		drawn: () =>
			Object.fromEntries(
				[...container.querySelectorAll<HTMLElement>('.it')].map((el) => {
					const id = [...el.classList].find((c) => c.startsWith('it-'))!.slice(3);
					const { left, top, width, height } = el.style;
					return [id, toCells(left, top, width, height)];
				})
			),
		gridElement: () => container.querySelector<HTMLElement>('.svelte-grid-extended')!
	};
}

function overlaps(a: LayoutSpec, b: LayoutSpec): boolean {
	return a.x! < b.x! + b.w && b.x! < a.x! + a.w && a.y! < b.y! + b.h && b.y! < a.y! + a.h;
}

export type InvariantOptions = {
	collision: Collision;
	/** Fixed column count, or `Infinity` when the grid grows sideways. */
	cols: number;
	/** Fixed row count, or `Infinity`. Push and compress always grow downwards. */
	rows: number;
	/** `none` mode lets explicit props overlap items; only then is overlap allowed. */
	allowOverlap?: boolean;
};

function overlapProblems(items: LayoutSpec[]): string[] {
	return items.flatMap((a, i) =>
		items.slice(i + 1).flatMap((b) => (overlaps(a, b) ? [`${a.id} overlaps ${b.id}`] : []))
	);
}

type Drawn = ReturnType<MountedLayout['drawn']>;

function itemProblems(it: LayoutSpec, drawn: Drawn, cols: number, rows: number): string[] {
	const at = `${it.id}(${it.x},${it.y} ${it.w}x${it.h})`;
	const problems: string[] = [];
	if (![it.x, it.y, it.w, it.h].every((v) => Number.isInteger(v))) problems.push(`${at} has a non-integer field`);
	if (it.w < 1 || it.h < 1) problems.push(`${at} is smaller than one cell`);
	if (it.x! < 0 || it.y! < 0 || it.x! + it.w > cols || it.y! + it.h > rows) problems.push(`${at} is outside the grid`);
	const d = drawn[it.id];
	if (!d) problems.push(`${at} is not drawn`);
	else if (d.x !== it.x || d.y !== it.y || d.w !== it.w || d.h !== it.h) {
		problems.push(`${at} is drawn at (${d.x},${d.y} ${d.w}x${d.h})`);
	}
	return problems;
}

/** A grid that grows downwards must be at least as tall as its lowest item reaches. */
function heightProblems(mounted: MountedLayout, items: LayoutSpec[]): string[] {
	if (items.length === 0) return [];
	const bottom = Math.max(...items.map((i) => i.y! + i.h)) * mounted.pitch;
	const height = mounted.gridElement().style.height;
	if (!height.endsWith('px')) return [`grid height is ${height} while items reach ${bottom}px`];
	return Number.parseFloat(height) < bottom ? [`grid is ${height} tall but items reach ${bottom}px`] : [];
}

/** Every way a settled layout can be wrong, as readable strings (empty when it is valid). */
export function layoutProblems(mounted: MountedLayout, options: InvariantOptions): string[] {
	const items = mounted.component.snapshot();
	const drawn = mounted.drawn();
	const rows = options.collision === 'none' ? options.rows : Infinity;
	return [
		...(options.allowOverlap ? [] : overlapProblems(items)),
		...items.flatMap((it) => itemProblems(it, drawn, options.cols, rows)),
		...(rows === Infinity ? heightProblems(mounted, items) : [])
	];
}
