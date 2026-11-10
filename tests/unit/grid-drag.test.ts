import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import GridDrag from './fixtures/GridDrag.svelte';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
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

test('updates the preview when another item occupies its destination', async () => {
	const { container, component, rerender } = render(GridDrag);
	const dragged = container.querySelector<HTMLElement>('.dragged')!;

	// jsdom does not implement pointer capture.
	dragged.setPointerCapture = vi.fn();
	dragged.releasePointerCapture = vi.fn();

	dragged.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
	window.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 0 }));
	await tick();

	const preview = container.querySelector<HTMLElement>('.preview')!;
	expect(preview.style.left).toBe('100px');

	await rerender({ show: true });

	expect(preview.style.left).toBe('0px');

	window.dispatchEvent(new MouseEvent('pointerup'));
	await tick();

	expect(component.position()).toEqual({ x: 0, y: 0 });
});

test('rejects an occupied destination before the preview effect runs', async () => {
	const { container, component, rerender } = render(GridDrag, {
		props: { dropOnReveal: true }
	});
	const dragged = container.querySelector<HTMLElement>('.dragged')!;

	dragged.setPointerCapture = vi.fn();
	dragged.releasePointerCapture = vi.fn();

	dragged.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
	window.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 0 }));
	await tick();

	expect(container.querySelector<HTMLElement>('.preview')!.style.left).toBe('100px');

	await rerender({ show: true });

	expect(component.position()).toEqual({ x: 0, y: 0 });
	expect(container.querySelector('.preview')).toBeNull();
});
