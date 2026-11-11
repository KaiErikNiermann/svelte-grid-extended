import { parse } from 'svelte/compiler';
import {
	createTwoslasher as createTypeScriptTwoslasher,
	type TwoslashInstance,
	type TwoslashOptions,
	type TwoslashReturn
} from 'twoslash';
import {
	removeCodeRanges,
	resolveNodePositions,
	type NodeHover,
	type NodeWithoutPosition
} from 'twoslash-protocol';
import { createTwoslasher as createSvelteTwoslasher } from 'twoslash-svelte';

/*
 * twoslash-svelte hovers identifiers only, and svelte2tsx writes a component's props as quoted
 * keys (`"cols":10`), so `<Grid cols={10}>` has no hover on `cols`. This wraps it: each prop
 * written on an imported component gets the hover TypeScript gives `ComponentProps<typeof
 * Component>['prop']`, found with a second, plain TypeScript pass over a generated snippet.
 */

/** The parts of the Svelte AST this file reads. */
interface AstNode {
	type: string;
	name?: string;
	start: number;
	end: number;
	attributes?: AstNode[];
	[key: string]: unknown;
}

interface PropUse {
	component: string;
	prop: string;
	/** Offset of the prop name in the Svelte source. */
	start: number;
}

const COMPONENT_NAME = /^[A-Z]\w*$/;

function isAstNode(value: unknown): value is AstNode {
	return typeof value === 'object' && value !== null && 'type' in value;
}

/** Every attribute written on an element named like an imported component. */
function collectPropUses(node: unknown, source: string, components: Set<string>): PropUse[] {
	if (Array.isArray(node))
		return node.flatMap((child) => collectPropUses(child, source, components));
	if (!isAstNode(node)) return [];
	const own: PropUse[] = [];
	if (node.type === 'Component' && node.name && components.has(node.name)) {
		for (const attribute of node.attributes ?? []) {
			if (
				attribute.name &&
				(attribute.type === 'Attribute' || attribute.type === 'BindDirective')
			) {
				// `indexOf` skips the `bind:` prefix and the `{` of the `{itemSize}` shorthand.
				own.push({
					component: node.name,
					prop: attribute.name,
					start: source.indexOf(attribute.name, attribute.start)
				});
			}
		}
	}
	const nested = Object.values(node).flatMap((child) => collectPropUses(child, source, components));
	return [...own, ...nested];
}

/** The `import` statements of the instance script, as source text, and the names they bind. */
function readImports(source: string): { text: string; components: Set<string> } {
	const ast = parse(source, { modern: true });
	const body: AstNode[] = (ast.instance?.content?.body as AstNode[] | undefined) ?? [];
	const imports = body.filter((statement) => statement.type === 'ImportDeclaration');
	const components = new Set<string>();
	for (const statement of imports) {
		for (const specifier of (statement.specifiers as { local: { name: string } }[]) ?? []) {
			if (COMPONENT_NAME.test(specifier.local.name)) components.add(specifier.local.name);
		}
	}
	return { text: imports.map((i) => source.slice(i.start, i.end)).join('\n'), components };
}

interface Probe {
	use: PropUse;
	/** Offset of the prop name in the generated snippet. */
	offset: number;
}

/** A TypeScript snippet that reads each used prop off its component's props type. */
function buildProbeSnippet(imports: string, uses: PropUse[]): { code: string; probes: Probe[] } {
	let code = `${imports}\nimport type { ComponentProps as __Props } from 'svelte';\n`;
	const probes: Probe[] = [];
	for (const [index, use] of uses.entries()) {
		const variable = `__props${index}`;
		code += `declare const ${variable}: __Props<typeof ${use.component}>;\n${variable}.`;
		probes.push({ use, offset: code.length });
		code += `${use.prop};\n`;
	}
	return { code, probes };
}

function propHoverNodes(
	source: string,
	typeScript: TwoslashInstance,
	options: TwoslashOptions
): NodeWithoutPosition[] {
	const { text: imports, components } = readImports(source);
	const uses = collectPropUses(parse(source, { modern: true }).fragment, source, components);
	if (uses.length === 0) return [];
	const { code, probes } = buildProbeSnippet(imports, uses);
	const probed = typeScript(code, 'ts', options);
	const hovers = probed.nodes.filter((node): node is NodeHover => node.type === 'hover');
	return probes.flatMap(({ use, offset }) => {
		const hover = hovers.find((node) => node.start === offset);
		if (!hover) return [];
		return [
			{
				type: 'hover' as const,
				target: use.prop,
				text: hover.text,
				docs: hover.docs,
				tags: hover.tags,
				start: use.start,
				length: use.prop.length
			}
		];
	});
}

/** A twoslasher for `.svelte` and TypeScript code, with hovers on component props. */
export function createTwoslasher(options: TwoslashOptions): TwoslashInstance {
	const svelte = createSvelteTwoslasher(options);
	const typeScript = createTypeScriptTwoslasher(options);

	const twoslasher = (
		code: string,
		extension: string = 'ts',
		execOptions: TwoslashOptions = {}
	): TwoslashReturn => {
		if (extension !== 'svelte') return svelte(code, extension, execOptions);
		const result = svelte(code, extension, execOptions);
		const taken = new Set(result.nodes.map((node) => `${node.type}:${node.start}`));
		// The prop offsets are in the original code; the removals are too, so the cut notations
		// move them to where they land in `result.code`.
		const extra = removeCodeRanges(
			code,
			result.meta.removals,
			propHoverNodes(code, typeScript, options)
		);
		const nodes = resolveNodePositions(
			extra.nodes.filter((node) => !taken.has(`${node.type}:${node.start}`)),
			result.code
		);
		return { ...result, nodes: [...result.nodes, ...nodes] };
	};
	twoslasher.getCacheMap = svelte.getCacheMap;
	return twoslasher;
}
