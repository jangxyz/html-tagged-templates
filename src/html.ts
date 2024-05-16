import { buildChildNodes, buildSingleNode, queryContainer } from "./base.js";
import { assert } from "./utils.js";
import type { htmlWithArrayArgsFn } from "./html_with_array_args.js";
import type { QueryResultOf } from "./html_with_query_option.js";

type NestedQuery = Record<string, string>;

type Options<Q extends NestedQuery> = {
	query: Q;
	queryAll: Q;
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
}

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
