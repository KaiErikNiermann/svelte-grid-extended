import { blockingRow, getAvailablePosition } from './utils/grid';
import type { GridParams, GridController as GridControllerType, LayoutItem } from './types';

export class GridController implements GridControllerType {
	private _gridParamsRef: { current: GridParams };

	constructor(gridParamsOrRef: GridParams | { current: GridParams }) {
		// Support both direct gridParams (for tests/external use) and reference object (for internal use)
		this._gridParamsRef = 'current' in gridParamsOrRef ? gridParamsOrRef : { current: gridParamsOrRef };
	}

	get gridParams(): GridParams {
		return this._gridParamsRef.current;
	}

	set gridParams(value: GridParams) {
		// Update the reference for external updates
		this._gridParamsRef.current = value;
	}

	getFirstAvailablePosition(w: number, h: number) {
		const { items, maxCols, maxRows } = this.gridParams;
		return getAvailablePosition(
			{
				id: '',
				x: 0,
				y: 0,
				w,
				h,
				movable: true,
				resizable: true,
				invalidate: () => {
					/* .. */
				}
			},
			Object.values(items),
			maxCols,
			maxRows
		);
	}

	compress(): void {
		this._compress(this.gridParams.items);
	}

	/**
	 * Compresses `items`, which the grid passes as its live state: reading them through the
	 * context instead returned a stale snapshot during an item's teardown, so removing several
	 * items in one tick compressed against items that were already gone.
	 */
	_internalCompress(items: Record<string, LayoutItem>): void {
		this._compress(items, true);
	}

	private _compress(items: Record<string, LayoutItem>, skipUpdate = false): void {
		const gridItems = Object.values(items);
		const sortedItems = [...gridItems].sort((a, b) => a.y - b.y);

		sortedItems.reduce((accItem, currentItem) => {
			const newY = blockingRow(currentItem, accItem, currentItem.y);
			if (newY !== currentItem.y - 1) {
				currentItem.y = newY + 1;
				currentItem.invalidate();
			}
			accItem.push(currentItem);
			return accItem;
		}, [] as LayoutItem[]);

		if (!skipUpdate) {
			this.gridParams.updateGrid();
		}
	}
}
