/**
 * Helpers shared by the stress tests: garbage collection, window-listener accounting and a
 * non-overlapping layout generator.
 */
import { afterEach, beforeEach } from 'vitest';

import { item, type LayoutSpec } from '../unit/layout-harness';

type NodeProcess = { stderr: { write: (s: string) => void }; memoryUsage: () => { heapUsed: number } };
const node = (globalThis as { process?: NodeProcess }).process!;

/** Writes a measurement to stderr, where vitest shows it next to the test. */
export const report = (line: string) => node.stderr.write(`${line}\n`);
export const heapUsed = () => node.memoryUsage().heapUsed;

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

/**
 * Runs full collections until finalisation has had a chance to run. Needs `--expose-gc`,
 * which the stress project passes.
 */
export async function collectGarbage(): Promise<void> {
	const gc = (globalThis as { gc?: () => void }).gc;
	if (!gc) throw new Error('gc() is missing: run the stress project, which passes --expose-gc');
	clearSelectorCache();
	for (let i = 0; i < 4; i++) {
		await new Promise((resolve) => setTimeout(resolve, 0));
		gc();
	}
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
