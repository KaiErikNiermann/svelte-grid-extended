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
export const MODES: readonly Collision[] = ['none', 'push', 'compress', 'shift'];
/** Item size given in full, so items mount before the first resize, as in a browser. */
export const FIXED_SIZE = { itemSize: { width: CELL, height: CELL } };

export const item = (id: string, x: number, y: number, w = 1, h = 1): LayoutSpec => ({ id, x, y, w, h });

/**
 * Registers per-test setup: `ResizeObserver` is replaced by one the test fires by hand (a
 * browser fires it after layout), pointer capture is stubbed (jsdom lacks it), and every
 * mounted grid is cleaned up afterwards.
 */
export function useLayoutHarness(): {
	resizeTo: (width: number, height: number) => void;
	/** ResizeObservers created and not yet disconnected: one per mounted grid. */
	liveObservers: () => number;
} {
	let callbacks: ResizeObserverCallback[] = [];
	beforeEach(() => {
		callbacks = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				private readonly callback: ResizeObserverCallback;
				constructor(callback: ResizeObserverCallback) {
					this.callback = callback;
					callbacks.push(callback);
				}
				observe() {}
				unobserve() {}
				// An unmounted grid disconnects; keeping its callback would fire resizes into it.
				disconnect() {
					callbacks = callbacks.filter((c) => c !== this.callback);
				}
			}
		);
		// jsdom has no pointer capture; a real browser keeps its own, which real input exercises.
		if (IN_JSDOM) {
			HTMLElement.prototype.setPointerCapture = () => {};
			HTMLElement.prototype.releasePointerCapture = () => {};
		}
	});
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});
	return {
		liveObservers: () => callbacks.length,
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
	setVisible: (show: boolean) => void;
	snapshot: () => LayoutSpec[];
	getController: () => import('../../src/lib/types').GridController | undefined;
};

/** A pointer left pressed by `hold()`; moves are in cells from where it was pressed. */
export type HeldPointer = { move: (dx: number, dy: number) => Promise<void>; release: () => Promise<void> };

export type DragStep = readonly [number, number] | (() => void | Promise<void>);

export type MountedLayout = {
	component: LayoutComponent;
	container: HTMLElement;
	unmount: () => void;
	settle: () => Promise<void>;
	/** Distance in pixels from one cell's origin to the next: the cell size plus the gap. */
	pitch: number;
	drag: (id: string, dx: number, dy: number, during?: () => Promise<void>) => Promise<void>;
	/** A drag through several pointer moves, each in cells from the start; push reacts to each. */
	dragPath: (id: string, path: readonly (readonly [number, number])[]) => Promise<void>;
	/**
	 * A drag whose steps are pointer moves (in cells from the start) or changes the page makes
	 * mid-drag. With `fast`, moves are not followed by a settle, so several arrive in one tick.
	 */
	dragSteps: (id: string, steps: readonly DragStep[], options?: { fast?: boolean }) => Promise<void>;
	resize: (id: string, dw: number, dh: number, during?: () => Promise<void>) => Promise<void>;
	/**
	 * Presses on `selector` (inside the grid) and moves by `dx`, `dy` cells, then leaves the
	 * pointer down: the test can change or destroy the grid, then move and release it.
	 */
	hold: (selector: string, dx: number, dy: number) => Promise<HeldPointer>;
	drawn: () => Record<string, { x: number; y: number; w: number; h: number }>;
	gridElement: () => HTMLElement;
};

/** Lets effects, and the effects they schedule, run to completion. */
async function settle(): Promise<void> {
	for (let i = 0; i < 3; i++) await tick();
}

/**
 * The suite runs in jsdom and in real browsers (Vitest browser mode). jsdom gets synthetic
 * pointer events; a browser gets real mouse input from Playwright, so its own hit-testing,
 * pointer capture and event order are part of every drag.
 */
export const IN_JSDOM = navigator.userAgent.includes('jsdom');

function pointer(target: EventTarget, type: string, x: number, y: number) {
	target.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }));
}

const clampTo = (v: number, max: number) => Math.min(Math.max(v, 0), max - 1);

/** A real pointer cannot leave the window: moves are kept inside the test viewport. */
function onScreen(x: number, y: number): { x: number; y: number } {
	return { x: clampTo(x, window.innerWidth), y: clampTo(y, window.innerHeight) };
}

type MouseStep = { type: 'move' | 'down' | 'up'; x: number; y: number };

/** The last pointer event the page received, recorded before any handler can stop it. */
let lastPointer: { type: string; x: number; y: number } | undefined;
if (!IN_JSDOM) {
	for (const type of ['pointermove', 'pointerdown', 'pointerup']) {
		window.addEventListener(
			type,
			(event) => {
				const { clientX: x, clientY: y } = event as PointerEvent;
				lastPointer = { type, x, y };
			},
			{ capture: true }
		);
	}
}

const EVENT_OF = { move: 'pointermove', down: 'pointerdown', up: 'pointerup' } as const;

/**
 * Waits until the page has received the event for `step`. Playwright's Firefox resolves a
 * mouse call before the page has handled the event (Chromium waits for it), so reading the
 * layout right after the call raced the event. Bounded: fails loudly after `timeoutMs`.
 */
async function received(step: MouseStep, timeoutMs = 2000): Promise<void> {
	const deadline = performance.now() + timeoutMs;
	const matches = () =>
		lastPointer?.type === EVENT_OF[step.type] &&
		Math.abs(lastPointer.x - step.x) < 1 &&
		Math.abs(lastPointer.y - step.y) < 1;
	while (!matches()) {
		if (performance.now() > deadline) {
			throw new Error(
				`the page never received ${EVENT_OF[step.type]} at (${step.x}, ${step.y}); last: ${JSON.stringify(lastPointer)}`
			);
		}
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}
}

/** Sends real mouse input through the Playwright browser command (browser mode only). */
async function realMouse(steps: MouseStep[]): Promise<void> {
	if (steps.length === 0) return;
	const { commands } = await import('vitest/browser');
	const placed = steps.map((step) => ({ ...step, ...onScreen(step.x, step.y) }));
	await commands.mouse(placed);
	await received(placed.at(-1)!);
}

export function mountLayout(options: {
	grid: Record<string, unknown>;
	items: LayoutSpec[];
	onchange?: (id: string) => void;
}): MountedLayout {
	const { component, container, unmount } = render(Layout, {
		// skipOffscreen is off unless a test turns it on: with content-visibility: auto a browser
		// decides at its next rendering update whether a grid is near the viewport, and until then
		// Firefox reports its items at 0x0, so geometry read right after a change is not the
		// layout. Skipping has its own tests (layout-offscreen.test.ts).
		props: {
			grid: { gap: 0, skipOffscreen: false, ...options.grid },
			initial: options.items,
			onchange: options.onchange
		}
	});
	const layout = component as unknown as LayoutComponent;
	const gap = typeof options.grid.gap === 'number' ? options.grid.gap : 0;
	// Square cells: a grid may pass its own itemSize (e.g. a fractional one), else CELL.
	const cell = (options.grid.itemSize as { width?: number } | undefined)?.width ?? CELL;
	const pitch = cell + gap;
	// Inverse of calcPosition: $\text{left} = x \cdot pitch + gap$, $\text{width} = w \cdot pitch - gap$.
	const toCells = (left: string, top: string, width: string, height: string) => ({
		x: (Number.parseFloat(left) - gap) / pitch,
		y: (Number.parseFloat(top) - gap) / pitch,
		w: (Number.parseFloat(width) + gap) / pitch,
		h: (Number.parseFloat(height) + gap) / pitch
	});

	async function gesture(
		selector: string,
		steps: readonly DragStep[],
		during?: () => Promise<void>,
		options: { fast?: boolean } = {}
	) {
		const handle = container.querySelector(selector);
		if (!handle) throw new Error(`nothing matches ${selector}`);
		await (IN_JSDOM ? syntheticGesture : realGesture)(handle, steps, during, options);
	}

	async function syntheticGesture(
		handle: Element,
		steps: readonly DragStep[],
		during: (() => Promise<void>) | undefined,
		options: { fast?: boolean }
	) {
		pointer(handle, 'pointerdown', 0, 0);
		let last: readonly [number, number] = [0, 0];
		for (const step of steps) {
			if (typeof step === 'function') {
				await step();
				continue;
			}
			last = step;
			pointer(window, 'pointermove', step[0] * pitch, step[1] * pitch);
			if (!options.fast) await settle();
		}
		if (during) await during();
		pointer(window, 'pointerup', last[0] * pitch, last[1] * pitch);
		await settle();
	}

	/**
	 * The same gesture with real input: press at the handle's centre, then each move in cells
	 * from there. With `fast`, consecutive moves go to the browser in one batch.
	 */
	async function hold(selector: string, dx: number, dy: number): Promise<HeldPointer> {
		const handle = container.querySelector(selector);
		if (!handle) throw new Error(`nothing matches ${selector}`);
		const box = handle.getBoundingClientRect();
		const start = IN_JSDOM ? { x: 0, y: 0 } : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
		let at = start;
		const to = (cx: number, cy: number) => ({ x: start.x + cx * pitch, y: start.y + cy * pitch });
		const send = async (type: 'move' | 'up', point: { x: number; y: number }) => {
			if (IN_JSDOM) pointer(window, `pointer${type}`, point.x, point.y);
			else await realMouse([{ type, ...point }]);
			await settle();
		};
		if (IN_JSDOM) pointer(handle, 'pointerdown', start.x, start.y);
		else await realMouse([{ type: 'down', ...start }]);
		at = to(dx, dy);
		await send('move', at);
		return {
			move: async (mx, my) => {
				at = to(mx, my);
				await send('move', at);
			},
			release: () => send('up', at)
		};
	}

	async function realGesture(
		handle: Element,
		steps: readonly DragStep[],
		during: (() => Promise<void>) | undefined,
		options: { fast?: boolean }
	) {
		const box = handle.getBoundingClientRect();
		const start = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
		const at = ([dx, dy]: readonly [number, number]) => ({ x: start.x + dx * pitch, y: start.y + dy * pitch });
		await realMouse([{ type: 'down', ...start }]);
		await settle();
		let last: readonly [number, number] = [0, 0];
		let batch: MouseStep[] = [];
		const flush = async () => {
			await realMouse(batch);
			batch = [];
			await settle();
		};
		for (const step of steps) {
			if (typeof step === 'function') {
				await flush();
				await step();
				continue;
			}
			last = step;
			batch.push({ type: 'move', ...at(step) });
			if (!options.fast) await flush();
		}
		await flush();
		if (during) await during();
		await realMouse([{ type: 'up', ...at(last) }]);
		await settle();
	}

	return {
		component: layout,
		container,
		unmount: () => {
			unmount();
			container.remove();
		},
		settle,
		pitch,
		drag: (id, dx, dy, during) => gesture(`.it-${id}`, [[dx, dy]], during),
		dragPath: (id, path) => gesture(`.it-${id}`, path),
		dragSteps: (id, steps, options) => gesture(`.it-${id}`, steps, undefined, options),
		resize: (id, dw, dh, during) => gesture(`.it-${id} .resizer-default`, [[dw, dh]], during),
		hold,
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
		...(rows === Infinity ? heightProblems(mounted, items) : []),
		...(IN_JSDOM ? [] : renderedProblems(mounted))
	];
}

/**
 * In a real browser: each item is laid out where its inline style says, within half a pixel.
 * jsdom does no layout, so this is where engine differences in positioning (subpixel
 * rounding, transforms, borders) would show up.
 */
/**
 * The largest coordinate both engines lay out: Firefox stores lengths as 1/60px integers up
 * to $2^{30}$, so $2^{30} / 60 \approx 17\,895\,697$px (beyond it an item is drawn with no
 * height); Chromium clamps at 33 554 428px. Items placed further (the edge-value tests' 1e6
 * cells) keep a correct state but cannot be drawn there by any engine.
 */
const LAYOUT_LIMIT_PX = 17_895_697;

function renderedProblems(mounted: MountedLayout): string[] {
	const grid = mounted.gridElement();
	const origin = grid.getBoundingClientRect();
	return [...grid.querySelectorAll<HTMLElement>('.it')].flatMap((el) => {
		const id = [...el.classList].find((c) => c.startsWith('it-'))!.slice(3);
		// Items animate to a new place (CSS transitions); the check is about where they end up.
		for (const animation of el.getAnimations()) animation.finish();
		const rect = el.getBoundingClientRect();
		const actual = {
			left: rect.left - origin.left - grid.clientLeft,
			top: rect.top - origin.top - grid.clientTop,
			width: rect.width,
			height: rect.height
		};
		const px = (side: 'left' | 'top' | 'width' | 'height') => Number.parseFloat(el.style[side]);
		if (px('left') + px('width') > LAYOUT_LIMIT_PX || px('top') + px('height') > LAYOUT_LIMIT_PX) return [];
		return (['left', 'top', 'width', 'height'] as const).flatMap((side) => {
			const declared = Number.parseFloat(el.style[side]);
			return Math.abs(actual[side] - declared) > 0.5
				? [`${id} is rendered with ${side} ${actual[side].toFixed(2)}px, its style says ${declared}px`]
				: [];
		});
	});
}
