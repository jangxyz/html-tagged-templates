type NestedQuery = Record<string, string>;

type Options<Q extends NestedQuery> = {
	//returns: "element" | "node" | ("element" | "node")[];
	query: Q;
};

type QueryResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: HTMLElement | null;
};

// type - html tags

type HtmlTagName = keyof HTMLElementTagNameMap;

type HtmlElementPrefix<TagName extends HtmlTagName> = `<${TagName}>` | `<${TagName} ` | `<${TagName}/>`;
type ElementPrefixedString<TagName extends HtmlTagName> = `${HtmlElementPrefix<TagName>}${string}`;
type CommentPrefixedString = `<!--${string}`;
//type TypedHtmlString<T extends string> = T extends HtmlTagName ? HtmlPrefix<"div"> : Text;

//export function htmlFn<T extends Node[]>(htmlString: string, options: Partial<Options>): [...T, object];
//export function htmlFn<T extends Node[], Q extends NestedQuery>(htmlString: string, options: Omit<Options<Q>, "query">): T;

type LastElementOf<T extends readonly unknown[]> = T extends readonly [...unknown[], infer Last] ? Last : never;

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
export function htmlFn(htmlStrings: string[]): ReturnType<typeof htmlFnWithArrayArgs>;
// overload - string array + query option
export function htmlFn<Q extends NestedQuery>(
	htmlStrings: string[],
	options: { query: Q },
): [ReturnType<typeof htmlFnWithArrayArgs>, QueryResultOf<Q>];
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
		let containerEl: HTMLElement | undefined = undefined;
		const resultNodes = htmlString.map((str) => {
			const result = buildSingleNode<T_Nodes[number]>(str, containerEl);
			containerEl = result[1];
			return result[0];
		}) as T_Nodes;

		if (hasQueryOption(options)) {
			const queryResult = containerEl ? buildQueryResult(containerEl, options?.query) : ({} as QueryResultOf<Q>);
			return [resultNodes, queryResult];
		}

		return resultNodes;
	}

	// query option
	if (hasQueryOption(options)) {
		return htmlFnWithQueryOption<T_Nodes, Q>(htmlString, options);
	}

	const [resultNodes] = buildChildNodes<T_Nodes>(htmlString);
	return resultNodes;
}

/**
 * Accept html strings as string array.
 */
// overload: single-element
export function htmlFnWithArrayArgs<T_Str extends HtmlTagName>(
	htmlString: [ElementPrefixedString<T_Str>],
): [HTMLElementTagNameMap[T_Str]];
// overload: single-comment
export function htmlFnWithArrayArgs(htmlString: [CommentPrefixedString]): [Comment];
// overload: single-text
export function htmlFnWithArrayArgs(htmlString: [string]): [Text];
// overload: single-any
export function htmlFnWithArrayArgs<T_Node extends Node>(htmlStrings: [string]): [T_Node];
// overload: multiple any
export function htmlFnWithArrayArgs<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes;
// impl.
export function htmlFnWithArrayArgs<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes {
	if (htmlStrings.length === 0) return [] as unknown as T_Nodes;

	if (htmlStrings.length === 1) {
		const [result] = buildSingleNode<T_Nodes[number]>(htmlStrings[0]);
		return [result] as T_Nodes;
	}

	let containerEl: HTMLElement | undefined = undefined;
	const results = htmlStrings.map((str) => {
		const result = buildSingleNode<T_Nodes[number]>(str, containerEl);
		containerEl = result[1];
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
	//

	// reduce callback attribute

	const context: { htmlSoFar: string; insideTag: boolean; startAttr: '"' | "'" | null; lastAttrName: string | null } = {
		insideTag: false,
		startAttr: null,
		lastAttrName: null,
		htmlSoFar: "",
	};
	const markMap: Map<[string, string], EventListener> = new Map();

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
		const targetNode = containerEl.querySelector(selector);
		if (!targetNode) {
			console.warn("failed finding element with attr:", attrName);
			continue;
		}

		targetNode.removeAttribute(attrName);
		targetNode.addEventListener(attrName.replace(/^on/i, ""), callback);
	}

	return [node as unknown as T];

	///

	function assert(condition: unknown, errorMsg: string): asserts condition {
		if (!condition) {
			throw new Error(errorMsg);
		}
	}
}

/**
 * Accept query option
 */
function htmlFnWithQueryOption<T extends Node[], Q extends NestedQuery>(
	htmlString: string,
	options: { query: Q },
): [...T, QueryResultOf<Q>] {
	const [resultNodes, containerEl] = buildChildNodes<T>(htmlString);
	const queryResult = buildQueryResult(containerEl, options.query);
	return [...resultNodes, queryResult];
}

///
/// helper functions

function hasQueryOption<Q extends NestedQuery>(options?: Partial<Options<Q>>): options is { query: Q } {
	return Boolean(options?.query);
}

/**
 * Build a single element from an html string. Will reuse the container element if provided.
 */
// overload: HTMLElement
function buildSingleNode<T extends HtmlTagName>(
	htmlString: ElementPrefixedString<T>,
	containerEl?: HTMLElement,
): [HTMLElementTagNameMap[T], HTMLElement];
// overload: Comment
function buildSingleNode(htmlString: CommentPrefixedString, containerEl?: HTMLElement): [Comment, HTMLElement];
// overload: other - Text
function buildSingleNode(htmlString: string, containerEl?: HTMLElement): [Text, HTMLElement];
// overload: default
function buildSingleNode<T extends Node>(htmlString: string, containerEl?: HTMLElement): [T, HTMLElement];
// impl.
function buildSingleNode<T extends Node>(htmlString: string, containerEl?: HTMLElement): [T, HTMLElement] {
	const _containerEl = containerEl ?? document.createElement("div");
	_containerEl.innerHTML = htmlString;

	const childNodes = _containerEl.childNodes;
	if (childNodes.length > 1) {
		throw new Error("has more than one node");
	}

	return [childNodes[0] as unknown as T, _containerEl];
}

function buildChildNodes<T extends Node[]>(htmlString: string): [T, HTMLElement] {
	const containerEl = document.createElement("div");
	containerEl.innerHTML = htmlString;

	const childNodes = containerEl.childNodes;
	const resultNodes = [...childNodes] as unknown as T;

	return [resultNodes, containerEl] as const;
}

function buildQueryResult<Q extends NestedQuery>(containerEl: HTMLElement, query: Q) {
	const queryResult: QueryResultOf<Q> = Object.entries(query).reduce(
		(memo, [name, selector]) => {
			memo[name as keyof Q] = containerEl.querySelector<HTMLElement>(selector);
			return memo;
		},
		{} as Record<keyof Q, HTMLElement | null>,
	);

	return queryResult;
}

export function lastOf<T extends readonly unknown[]>(tuple: T): LastElementOf<T> {
	return tuple[tuple.length - 1] as LastElementOf<T>;
}

///

function htmlFnWithMultipleArgs<T extends Node[]>(
	htmlString: string,
	...moreArgs: string[] | [...string[], options: Partial<Options>]
): [...T, object?] {
	return [] as unknown as [...T, object?];
}

export function htmlNodeFn(string: string): NodeList {
	const el = document.createElement("div");
	el.innerHTML = string;

	return el.childNodes;
}
