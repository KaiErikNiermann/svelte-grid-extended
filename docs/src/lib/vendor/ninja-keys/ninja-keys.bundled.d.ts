/** The part of ninja-keys' public API the docs use; the rest is in the fork's README. */
export interface INinjaAction {
	id: string;
	title: string;
	hotkey?: string;
	handler?: (action: INinjaAction) => { keepOpen?: boolean } | void;
	mdIcon?: string;
	icon?: string;
	parent?: string;
	keywords?: string;
	children?: string[];
	section?: string;
}

export class NinjaKeys extends HTMLElement {
	data: INinjaAction[];
	placeholder: string;
	hideBreadcrumbs: boolean;
	noAutoLoadMdIcons: boolean;
	openHotkey: string;
	open(options?: { parent?: string; search?: string }): void;
	close(): void;
}
