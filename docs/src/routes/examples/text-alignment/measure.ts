/** Where a label's text sits in its box: `centre` labels are centred, `top` labels top-aligned. */
export type Alignment = 'centre' | 'top';

export type TextLine = {
	/** The line the text is aligned by: the cap band's centre (`centre`) or the cap top (`top`). */
	text: number;
	/** Where that line should be: the box's centre, or the top of its content box. */
	target: number;
	/** `text - target` in device pixels; negative means the text sits high. */
	offsetDevicePx: number;
};

/**
 * Measures one label inside its box, in client coordinates. The baseline is the bottom of an
 * empty inline-block on the label's line, and the cap height the height of a `1cap` box, so
 * the cap band runs from $\text{baseline} - \text{cap}$ to the baseline. Its centre is
 * $\text{baseline} - \text{cap}/2$. The probes are added and removed in the same task, so the
 * page never paints them.
 */
export function measureLabel(label: HTMLElement, box: HTMLElement, alignment: Alignment): TextLine {
	const probe = (css: string) => {
		const span = document.createElement('span');
		span.style.cssText = css;
		label.append(span);
		const rect = span.getBoundingClientRect();
		span.remove();
		return rect;
	};
	const baseline = probe(
		'display:inline-block;inline-size:0;block-size:0;vertical-align:baseline'
	).bottom;
	const cap = probe('display:inline-block;inline-size:0;block-size:1cap').height;
	const rect = box.getBoundingClientRect();
	const style = getComputedStyle(box);
	const contentTop =
		rect.top + Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.paddingTop);
	const text = alignment === 'centre' ? baseline - cap / 2 : baseline - cap;
	const target = alignment === 'centre' ? (rect.top + rect.bottom) / 2 : contentTop;
	return { text, target, offsetDevicePx: (text - target) * window.devicePixelRatio };
}

/** Whether this browser can trim a line box to the cap height and baseline (`text-box`). */
export const supportsTrim = (): boolean => CSS.supports('text-box: trim-both cap alphabetic');
