import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import GridLimits from './fixtures/GridLimits.svelte';

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test.each([
	{ cols: 12, rows: 0 },
	{ cols: 0, rows: 8 }
])('updates limits immediately for $cols columns and $rows rows', (props) => {
	let notify!: ResizeObserverCallback;

	class MockResizeObserver {
		constructor(callback: ResizeObserverCallback) {
			notify = callback;
		}
		observe() {}
		unobserve() {}
		disconnect() {}
	}

	vi.stubGlobal('ResizeObserver', MockResizeObserver);

	const { component } = render(GridLimits, { props });

	notify(
		[
			{
				contentRect: { width: 600, height: 400 }
			} as ResizeObserverEntry
		],
		{} as ResizeObserver
	);

	// No tick: limits must already reflect the resize notification.
	expect(component.availablePosition()).toEqual({ x: 0, y: 0 });
});
