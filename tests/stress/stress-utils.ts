/**
 * Helpers shared by the stress tests: garbage collection, window-listener accounting and a
 * non-overlapping layout generator. They run in jsdom (Node) and in real browsers.
 */
import { afterEach, beforeEach } from 'vitest';

import { IN_JSDOM, item, type LayoutSpec } from '../unit/layout-harness';

type NodeProcess = { stderr: { write: (s: string) => void }; memoryUsage: () => { heapUsed: number } };
const node = (globalThis as { process?: NodeProcess }).process;
/** Chromium's heap figures; precise only with --enable-precise-memory-info (vitest.config.ts). */
const chromeMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
/** gc() from Node's --expose-gc or Chromium's --js-flags=--expose-gc; Firefox has none. */
const gc = (globalThis as { gc?: () => void }).gc;

/**
 * Whether this environment can force a full collection, which the leak checks need. Firefox
 * gives a page no way to: its garbage and cycle collectors run on their own schedule, and in
 * probes (2026-11-11) the same untouched, destroyed grid was freed within 5 s in one run and
 * still reachable after 30 s in another. A reachability check there would be flaky, so the
 * leak checks run in jsdom and Chromium only.
 */
export const canForceGc = gc !== undefined;

/** Writes a measurement where vitest shows it next to the test. */
export const report = (line: string) => (node ? node.stderr.write(`${line}\n`) : console.log(line));

/** Heap in use, or undefined where the page cannot read it (Firefox). */
export function heapUsed(): number | undefined {
	if (node) return node.memoryUsage().heapUsed;
	return chromeMemory?.usedJSHeapSize;
}
export const canMeasureHeap = heapUsed() !== undefined;

/**
 * Empties jsdom's selector cache. nwsapi keeps the result list of the last query for every
 * selector string, so a removed grid stayed reachable from
 * `document._nwsapi.selectResolvers['.svelte-grid-extended'].results` (traced in a heap
 * snapshot). Browsers have no such cache. See .upstream-issues/nwsapi-*.
 */
function clearSelectorCache(): void {
	const impl = Object.getOwnPropertySymbols(document).find((s) => s.description === 'impl');
	if (!impl) throw new Error('jsdom document internals not found; the leak checks would report false leaks');
	const internals = (document as unknown as Record<symbol, { _nwsapi?: { selectResolvers?: unknown } }>)[impl];
	// nwsapi is created on the first query; before that there is nothing cached.
	const cache = internals?._nwsapi?.selectResolvers;
	if (cache instanceof Map) cache.clear();
	else if (cache && typeof cache === 'object') {
		for (const key of Object.keys(cache)) delete (cache as Record<string, unknown>)[key];
	}
}

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Chromium keeps the element last found under the pointer in Blink's HitTestCache
 * (a heap snapshot showed Document -> LayoutView -> HitTestCache -> the removed item -> its
 * grid). That holds one destroyed grid until
 * the next hit test, which in a page is the next mouse move. Moving the real pointer to an
 * empty corner and hit-testing there replaces those references before collecting.
 */
/**
 * Chromium keeps the element last found under the pointer in Blink's HitTestCache (heap
 * snapshot: Document -> LayoutView -> HitTestCache -> the removed item -> its grid), which
 * holds one destroyed grid until the next hit test. Moving the real pointer to an empty
 * corner and hit-testing there replaces it before collecting.
 */
async function forgetLastPointerTarget(): Promise<void> {
	// The bottom-right corner: test grids render from the top-left.
	const x = window.innerWidth - 3;
	const y = window.innerHeight - 3;
	const { commands } = await import('vitest/browser');
	await commands.mouse([
		{ type: 'move', x: x - 1, y: y - 1 },
		{ type: 'move', x, y }
	]);
	document.elementFromPoint(x, y);
}

/**
 * How many destroyed grids an environment may keep after a pointer press, however many were
 * destroyed. Chromium keeps one: the target of a pointer event Svelte delegated stays
 * reachable through a currentTarget getter that V8 keeps in PointerEvent's shared shape (heap
 * snapshot: NativeContext -> PointerEvent template -> Map -> DescriptorArray -> AccessorPair
 * -> getter -> the item), and neither a later script event nor a later real press elsewhere
 * reliably replaced it. One element per page is not a leak; a leak keeps every grid.
 */
export const RETAINED_AFTER_PRESS = IN_JSDOM ? 0 : 1;

/**
 * Runs full collections until finalisation has had a chance to run: gc() from Node's
 * --expose-gc (the stress project) or Chromium's --js-flags=--expose-gc (vitest.config.ts).
 */
export async function collectGarbage(): Promise<void> {
	if (!gc) throw new Error('gc() is missing: run the stress project or Chromium, which expose it');
	if (IN_JSDOM) clearSelectorCache();
	else await forgetLastPointerTarget();
	for (let i = 0; i < 4; i++) {
		await nextTask();
		gc();
	}
}

/** The references still alive after a full collection. */
export async function stillReachable<T extends object>(refs: WeakRef<T>[]): Promise<WeakRef<T>[]> {
	await collectGarbage();
	return refs.filter((ref) => ref.deref() !== undefined);
}

/** Counts window listeners that were added and not removed, per event type. */
export function trackWindowListeners(): { live: (...types: string[]) => number } {
	let listeners = new Map<string, Set<unknown>>();
	let original: Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined;
	beforeEach(() => {
		listeners = new Map();
		const add = window.addEventListener.bind(window);
		const remove = window.removeEventListener.bind(window);
		window.addEventListener = ((type: string, listener: EventListener, options?: AddEventListenerOptions) => {
			if (!listeners.has(type)) listeners.set(type, new Set());
			listeners.get(type)!.add(listener);
			add(type, listener, options);
		}) as typeof window.addEventListener;
		window.removeEventListener = ((type: string, listener: EventListener, options?: EventListenerOptions) => {
			listeners.get(type)?.delete(listener);
			remove(type, listener, options);
		}) as typeof window.removeEventListener;
		original = { addEventListener: add, removeEventListener: remove };
	});
	afterEach(() => {
		if (original) Object.assign(window, original);
	});
	return { live: (...types) => types.reduce((n, type) => n + (listeners.get(type)?.size ?? 0), 0) };
}

/**
 * `count` items laid out without overlaps in a 6-column grid. Every third one has no
 * position; those come last, so auto-placement cannot take a cell a later item asks for.
 */
export function layoutItems(count: number, seed = 0): LayoutSpec[] {
	const all = Array.from({ length: count }, (_, i) => ({ i, w: 1 + ((seed + i) % 2), unplaced: (seed + i) % 3 === 0 }));
	return [
		...all.filter((s) => !s.unplaced).map(({ i, w }) => item(`i${i}`, (i % 3) * 2, Math.floor(i / 3), w, 1)),
		...all.filter((s) => s.unplaced).map(({ i, w }) => ({ id: `i${i}`, w, h: 1 }))
	];
}

export function gridsOnPage(): number {
	return document.querySelectorAll('.svelte-grid-extended').length;
}
