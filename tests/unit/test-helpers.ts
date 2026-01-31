import type { LayoutItem } from '../../src/lib/types';

/**
 * Creates a LayoutItem with default invalidate function for testing
 */
export function createTestItem(item: Omit<LayoutItem, 'invalidate'> & { invalidate?: () => void }): LayoutItem {
	return {
		...item,
		invalidate: item.invalidate ?? (() => {})
	};
}

/**
 * Creates an array of LayoutItems with default invalidate functions for testing
 */
export function createTestItems(
	items: Array<Omit<LayoutItem, 'invalidate'> & { invalidate?: () => void }>
): LayoutItem[] {
	return items.map(createTestItem);
}
