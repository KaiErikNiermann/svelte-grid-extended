import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import GridRegistration from './fixtures/GridRegistration.svelte';

let notify: ResizeObserverCallback;

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: ResizeObserverCallback) {
				notify = callback;
			}
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

test.each(['none', 'push', 'compress'] as const)(
	'relocates a revealed item in %s mode and updates its bindings',
	async (collision) => {
		const { component, rerender } = render(GridRegistration, {
			props: { collision }
		});

		notify([{ contentRect: { width: 600, height: 400 } } as ResizeObserverEntry], {} as ResizeObserver);

		await rerender({ show: true });

		expect(component.position()).toEqual({ x: 2, y: 0 });
	}
);
