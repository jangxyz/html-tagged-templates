import {
	assert,
	type CommentPrefixedString,
	type ElementPrefixedString,
	type HtmlTagName,
	type LastElementOf,
} from "./utils.js";

type NestedQuery = Record<string, string>;

type Options<Q extends NestedQuery> = {
	query: Q;
	queryAll: Q;
};

type QueryResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: HTMLElement | null;
};
type QueryAllResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: NodeList;
};

type ContainerElement = HTMLElement | HTMLTemplateElement;

/**
 * Create HTML elements
 */
// overload - single htmlString
export function htmlFn<T extends Node[]>(htmlString: string): T;
// overload - with query option
export function htmlFn<T extends Node[], Q extends NestedQuery>(
	htmlString: string,
	options: { query: Q },
): [...T, QueryResultOf<Q>];
// overload - string array
export function htmlFn(htmlStrings: string[]): ReturnType<typeof htmlWithArrayArgsFn>;
// overload - string array + query option
export function htmlFn<Q extends NestedQuery>(
	htmlStrings: string[],
	options: { query: Q },
): [ReturnType<typeof htmlWithArrayArgsFn>, QueryResultOf<Q>];
// overload - default options
export function htmlFn<T extends Node[], Q extends NestedQuery>(
	htmlString: string,
	options: Partial<Options<Q>>,
): [...T, QueryResultOf<Q>];
// impl.
export function htmlFn<T_Nodes extends Node[], Q extends NestedQuery>(
	htmlString: string | string[],
	options?: Partial<Options<Q>>,
): T_Nodes | [...T_Nodes, QueryResultOf<Q>?] | [T_Nodes, QueryResultOf<Q>] {
	// input as array
	if (Array.isArray(htmlString)) {
		//const resultNodes = htmlFnWithArrayArgs<T>(htmlString);
		let containerEl: ContainerElement | undefined = undefined;
		const resultNodes = htmlString.map((str) => {
			const result = buildSingleNode<T_Nodes[number]>(str);
			containerEl = result[1];
			return result[0];
		}) as T_Nodes;

		//if (hasAnyQueryOption(options)) {
		//	const queryResults = containerEl ? buildQueryResult(containerEl, options) : ({} as QueryResultOf<Q>);
		//	return [resultNodes, queryResults];
		//}

		return resultNodes;
	}

	//// query option
	//if (hasQueryOption(options)) {
	//	return htmlWithQueryFn<T_Nodes, Q>(htmlString, options);
	//}

	const [resultNodes] = buildChildNodes<T_Nodes>(htmlString);
	return resultNodes;
}

/**
 * Accept html strings as array of strings.
 */
// overload: single-element
export function htmlWithArrayArgsFn<T_Str extends HtmlTagName>(
	htmlString: [ElementPrefixedString<T_Str>],
): [HTMLElementTagNameMap[T_Str]];
// overload: single-comment
export function htmlWithArrayArgsFn(htmlString: [CommentPrefixedString]): [Comment];
// overload: single-text
export function htmlWithArrayArgsFn(htmlString: [string]): [Text];
// overload: single-any
export function htmlWithArrayArgsFn<T_Node extends Node>(htmlStrings: [string]): [T_Node];
// overload: multiple any
export function htmlWithArrayArgsFn<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes;
// impl.
export function htmlWithArrayArgsFn<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes {
	if (htmlStrings.length === 0) return [] as unknown as T_Nodes;

	if (htmlStrings.length === 1) {
		const [result] = buildSingleNode<T_Nodes[number]>(htmlStrings[0]);
		return [result] as T_Nodes;
	}

	const results = htmlStrings.map((str) => {
		const result = buildSingleNode<T_Nodes[number]>(str);
		return result[0];
	}) as T_Nodes;
	return results;

	//// recursive way?
	//
	//const [firstHtml, ...restHtmls] = htmlStrings;
	////buildSingleNode<T_Nodes[number]>(firstHtml);
	//
	//type FirstType = T_Nodes[0];
	//type RestTypes = T_Nodes[0];
	//
	//return [
	//  buildSingleNode<T_Nodes[number]>(firstHtml),
	//  ...htmlFnWithArrayArgs<T_Nodes>(restHtmls),
	//]
}

/**
 * only create single html node
 */
// biome-ignore lint/complexity/noBannedTypes: <explanation>
export function htmlSingleFn<T extends Node, Q extends NestedQuery = {}>(
	partialStrings: (string | EventListener | number | boolean)[],
	options?: { query: Q },
): [T, QueryResultOf<Q>?] {
	const context: { htmlSoFar: string; insideTag: boolean; startAttr: '"' | "'" | null; lastAttrName: string | null } = {
		insideTag: false,
		startAttr: null,
		lastAttrName: null,
		htmlSoFar: "",
	};
	const markMap: Map<[string, string], EventListener> = new Map();

	// reduce callback attribute
	const { htmlSoFar: htmlString } = partialStrings.reduce((memo, partial) => {
		let { htmlSoFar, insideTag, startAttr, lastAttrName } = memo;

		// part of html chunk
		if (typeof partial === "string") {
			const strChunk = partial;
			for (let i = 0; i < strChunk.length; i += 1) {
				const ch = strChunk[i];
				htmlSoFar += ch;

				// reducer
				switch (ch) {
					case "<":
						assert(!insideTag, "should be outside tag");
						insideTag = true;
						break;
					case ">":
						assert(insideTag, "should be inside tag");
						insideTag = false;
						break;
					case "=":
						// start attribute
						if (insideTag) {
							const next = strChunk[i + 1];
							if (next === '"' || next === "'") {
								startAttr = strChunk[i + 1] as typeof next;

								const spaceIndex = strChunk.slice(0, i).lastIndexOf(" ");
								assert(spaceIndex !== -1, "cannot find attribute name");
								lastAttrName = strChunk.slice(spaceIndex + 1, i);

								// skip
								htmlSoFar += next;
								i += 1;
								continue;
							}
						}
						break;
					case '"':
					case "'":
						// end attribute
						if (insideTag && startAttr) {
							assert(startAttr === ch, `attr should end with ${ch}`);
							startAttr = null;
							lastAttrName = null;
						}
						break;

					default:
				}
			}
		}
		// attribute callback function
		else if (typeof partial === "function") {
			assert(insideTag && startAttr && lastAttrName, "functions are allowed only as an attribute");

			// temporarily generate random function mark
			const markName = `f${crypto.randomUUID().replaceAll("-", "")}`;
			markMap.set([lastAttrName, markName], partial);

			htmlSoFar += markName;
		}
		// othe primitives, keep on chunking as string
		else {
			assert(insideTag && startAttr && lastAttrName, "only allowed as an attribute");

			htmlSoFar += String(partial);
		}

		return { htmlSoFar, insideTag, startAttr, lastAttrName };
	}, context);

	//console.log("🚀 ~ file: html.ts:212 ~ htmlString:", htmlString);

	const [node, containerEl] = buildSingleNode(htmlString);

	// re-bind function marks
	for (const [[attrName, markName], callback] of markMap.entries()) {
		const selector = `[${attrName}=${markName}]`;
		const targetNode = queryContainer(containerEl, selector);
		if (!targetNode) {
			console.warn("failed finding element with attr:", attrName);
			continue;
		}

		targetNode.removeAttribute(attrName);
		targetNode.addEventListener(attrName.replace(/^on/i, ""), callback);
	}

	return [node as unknown as T];

	///
}

type OptionsWithQuery<Q extends NestedQuery> = { query: Q };
type OptionsWithQueryAll<Q extends NestedQuery> = { queryAll: Q };
type OptionsWithBothQuery<Q1 extends NestedQuery, Q2 extends NestedQuery> = { query: Q1; queryAll: Q2 };

/**
 * Accept query option
 */
// overload: both 'query' and 'queryAll'
export function htmlWithQueryFn<T extends Node, Q1 extends NestedQuery, Q2 extends NestedQuery>(
	htmlString: string,
	options?: OptionsWithBothQuery<Q1, Q2>,
): {
	element: T;
	query: QueryResultOf<Q1>;
	queryAll: QueryAllResultOf<Q2>;
};
// overload: 'query' only
export function htmlWithQueryFn<T extends Node, Q1 extends NestedQuery, Q2 extends NestedQuery>(
	htmlString: string,
	options?: OptionsWithQuery<Q1>,
): {
	element: T;
	query: QueryResultOf<Q1>;
	queryAll: undefined;
};
// overload: 'queryAll' only
export function htmlWithQueryFn<T extends Node, Q1 extends NestedQuery, Q2 extends NestedQuery>(
	htmlString: string,
	options?: OptionsWithQueryAll<Q2>,
): {
	element: T;
	query: undefined;
	queryAll: QueryAllResultOf<Q2>;
};
// actual implementation
export function htmlWithQueryFn<T extends Node, Q extends NestedQuery>(
	htmlString: string,
	options?: Partial<Options<Q>>,
): {
	element: T;
	query?: QueryResultOf<Q>;
	queryAll?: QueryAllResultOf<Q>;
} {
	//const [resultNodes, containerEl] = buildChildNodes<T>(htmlString);
	const [resultNode, containerEl] = buildSingleNode<T>(htmlString);

	const queryResults = buildQueryResult<Q>(containerEl, options);

	return {
		element: resultNode,
		...queryResults,
	};
}

///
/// helper functions

function hasQueryOption<Q extends NestedQuery>(options?: Partial<Options<Q>>): options is { query: Q } {
	return Boolean(options?.query);
}
function hasQueryAllOption<Q extends NestedQuery>(options?: Partial<Options<Q>>): options is { queryAll: Q } {
	return Boolean(options?.queryAll);
}
function hasAnyQueryOption<Q extends NestedQuery>(options?: Partial<Options<Q>>) {
	return hasQueryOption<Q>(options) || hasQueryAllOption<Q>(options);
}

/**
 * Build a single element from an html string. Will reuse the container element if provided.
 */
// overload: HTMLElement
function buildSingleNode<T extends HtmlTagName>(
	htmlString: ElementPrefixedString<T>,
): [HTMLElementTagNameMap[T], ContainerElement];
// overload: Comment
function buildSingleNode(htmlString: CommentPrefixedString): [Comment, ContainerElement];
// overload: other - Text
function buildSingleNode(htmlString: string): [Text, ContainerElement];
// overload: default
function buildSingleNode<T extends Node>(htmlString: string): [T, ContainerElement];
// impl.
function buildSingleNode<T extends Node>(htmlString: string): [T, ContainerElement] {
	//const _containerEl = containerEl ?? document.createElement("div");
	//_containerEl.innerHTML = htmlString;
	//
	//const childNodes = _containerEl.childNodes;
	//if (childNodes.length > 1) {
	//	throw new Error("has more than one node");
	//}
	//
	//return [childNodes[0] as unknown as T, _containerEl];

	const [resultNodes, _containerEl] = buildChildNodes(htmlString);
	if (resultNodes.length > 1) {
		throw new Error("has more than one node");
	}

	return [resultNodes[0] as unknown as T, _containerEl];
}

function buildChildNodes<T extends Node[]>(htmlString: string, container?: ContainerElement): [T, ContainerElement] {
	const containerEl = container ?? document.createElement("template");

	// assign innerHTML
	containerEl.innerHTML = htmlString;

	let resultNodes: NodeListOf<ChildNode>;
	if (containerEl instanceof HTMLTemplateElement) {
		resultNodes = containerEl.content.childNodes;
	} else {
		resultNodes = containerEl.childNodes;
	}

	return [[...resultNodes] as unknown as T, containerEl];
}

function buildQueryResult<Q extends NestedQuery>(
	containerEl: ContainerElement,
	queryOptions?: Partial<Options<Q>>,
): Partial<{ query: QueryResultOf<Q>; queryAll: QueryAllResultOf<Q> }> {
	// 'query'
	let query = {} as QueryResultOf<Q>;
	if (queryOptions?.query) {
		query = Object.entries(queryOptions.query).reduce((memo, [name, selector]) => {
			memo[name as keyof Q] = queryContainer(containerEl, selector);
			return memo;
		}, query);
	}

	// 'queryAll'
	let queryAll = {} as QueryAllResultOf<Q>;
	if (queryOptions?.queryAll) {
		queryAll = Object.entries(queryOptions.queryAll).reduce((memo, [name, selector]) => {
			memo[name as keyof Q] = queryAllContainer(containerEl, selector);
			return memo;
		}, queryAll);
	}

	return { query, queryAll };
}

export function lastOf<T extends readonly unknown[]>(tuple: T): LastElementOf<T> {
	return tuple[tuple.length - 1] as LastElementOf<T>;
}

///

function htmlFnWithMultipleArgs<T extends Node[], Q extends NestedQuery>(
	htmlString: string,
	...moreArgs: string[] | [...string[], options: Partial<Options<Q>>]
): [...T, object?] {
	return [] as unknown as [...T, object?];
}

function htmlNodeFn(string: string): NodeList {
	const el = document.createElement("div");
	el.innerHTML = string;

	return el.childNodes;
}

function queryContainer<T extends HTMLElement = HTMLElement>(containerEl: ContainerElement, selector: string) {
	let queryEl: HTMLElement | DocumentFragment;
	if (containerEl instanceof HTMLTemplateElement) {
		queryEl = containerEl.content;
	} else {
		queryEl = containerEl;
	}

	return queryEl.querySelector<T>(selector);
}

function queryAllContainer<T extends HTMLElement = HTMLElement>(containerEl: ContainerElement, selector: string) {
	let queryEl: HTMLElement | DocumentFragment;
	if (containerEl instanceof HTMLTemplateElement) {
		queryEl = containerEl.content;
	} else {
		queryEl = containerEl;
	}

	return queryEl.querySelectorAll<T>(selector);
}
