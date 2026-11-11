import type { Element, Root } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

/**
 * Wraps every Markdown table in `<div class="table-scroll">`. The table keeps a minimum width
 * (see app.css) and the wrapper scrolls sideways below it, as code blocks do, so a wide table
 * no longer sets the minimum width of the whole page on a phone.
 *
 * It also drops the backslash of `\|` in a table's inline code. GFM tables need the pipe
 * escaped even inside backticks, and GFM removes the backslash again; mdsvex's parser keeps it,
 * so `'none' \| 'push'` showed with its backslashes.
 */
export function rehypeTableScroll() {
	return wrapTables;
}

function wrapTables(tree: Root): void {
	visit(tree, 'element', (node: Element, index, parent) => {
		if (node.tagName !== 'table' || !parent || index === undefined) return;
		unescapePipes(node);
		const wrapper: Element = {
			type: 'element',
			tagName: 'div',
			// Focusable, so a keyboard can scroll it; labelled for screen readers.
			properties: {
				className: ['table-scroll'],
				tabIndex: 0,
				role: 'region',
				ariaLabel: 'Table'
			},
			children: [node]
		};
		parent.children[index] = wrapper;
		return [SKIP, index + 1];
	});
}

function unescapePipes(table: Element): void {
	visit(table, 'element', (code: Element) => {
		if (code.tagName !== 'code') return;
		for (const child of code.children) {
			if (child.type === 'text') child.value = child.value.replaceAll(String.raw`\|`, '|');
		}
	});
}
