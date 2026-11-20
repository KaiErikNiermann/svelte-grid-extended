import type { Element, ElementContent, Root } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

const TYPES = ['note', 'tip', 'important', 'warning', 'caution'] as const;
type AdmonitionType = (typeof TYPES)[number];

const isType = (name: string): name is AdmonitionType =>
	(TYPES as readonly string[]).includes(name);

/**
 * Turns a blockquote that opens with a bold label (`> **Note:** ...`) into an admonition: a
 * flat tinted box with a title row, in the markup `Note.svelte` also produces, so app.css styles
 * both. A blockquote without such a label stays a plain blockquote.
 */
export function rehypeAdmonition() {
	return convertBlockquotes;
}

function convertBlockquotes(tree: Root): void {
	visit(tree, 'element', (node: Element, index, parent) => {
		if (node.tagName !== 'blockquote' || !parent || index === undefined) return;
		const label = takeLabel(node);
		if (!label) return;
		const title: Element = {
			type: 'element',
			tagName: 'p',
			properties: { className: ['admonition-title'] },
			children: [{ type: 'text', value: label.title }]
		};
		parent.children[index] = {
			type: 'element',
			tagName: 'aside',
			properties: { className: ['admonition', label.type] },
			children: [title, ...node.children]
		};
		return [SKIP, index + 1];
	});
}

/** Removes the leading `**Label:**` from the quote's first paragraph and returns what it said. */
function takeLabel(quote: Element): { type: AdmonitionType; title: string } | undefined {
	const paragraph = quote.children.find(
		(child): child is Element => child.type === 'element' && child.tagName === 'p'
	);
	const [strong, ...rest] = paragraph?.children ?? [];
	if (!paragraph || strong?.type !== 'element' || strong.tagName !== 'strong') return undefined;
	const text = strong.children.map((child) => ('value' in child ? child.value : '')).join('');
	const name = text.replace(/:$/, '').trim();
	const type = name.toLowerCase();
	if (!isType(type)) return undefined;
	paragraph.children = trimLeadingSpace(rest);
	return { type, title: name };
}

function trimLeadingSpace(nodes: ElementContent[]): ElementContent[] {
	const [first, ...rest] = nodes;
	if (first?.type !== 'text') return nodes;
	const value = first.value.replace(/^\s+/, '');
	return value ? [{ ...first, value }, ...rest] : rest;
}
