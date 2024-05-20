import { buildChildNodes, buildSingleNode } from "./base.js";
import type { htmlMultipleFn } from "./html_multiple.js";
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
export function htmlUnifiedFn<T extends Node[]>(htmlString: string): T;
// overload - with query option
export function htmlUnifiedFn<T extends Node[], Q extends NestedQuery>(
	htmlString: string,
	options: { query: Q },
): [...T, QueryResultOf<Q>];
// overload - string array
export function htmlUnifiedFn(htmlStrings: string[]): ReturnType<typeof htmlMultipleFn>;
// overload - string array + query option
export function htmlUnifiedFn<Q extends NestedQuery>(
	htmlStrings: string[],
	options: { query: Q },
): [ReturnType<typeof htmlMultipleFn>, QueryResultOf<Q>];
// overload - default options
export function htmlUnifiedFn<T extends Node[], Q extends NestedQuery>(
	htmlString: string,
	options: Partial<Options<Q>>,
): [...T, QueryResultOf<Q>];
// impl.
export function htmlUnifiedFn<T_Nodes extends Node[], Q extends NestedQuery>(
	htmlString: string | string[],
	options?: Partial<Options<Q>>,
): T_Nodes | [...T_Nodes, QueryResultOf<Q>?] | [T_Nodes, QueryResultOf<Q>] {
	// input as array
	if (Array.isArray(htmlString)) {
		const resultNodes = htmlString.map((str) => {
			const result = buildSingleNode<T_Nodes[number]>(str);
			return result[0] as T_Nodes[number];
		});

		//if (hasAnyQueryOption(options)) {
		//	const queryResults = containerEl ? buildQueryResult(containerEl, options) : ({} as QueryResultOf<Q>);
		//	return [resultNodes, queryResults];
		//}

		return resultNodes as T_Nodes;
	}

	//// query option
	//if (hasQueryOption(options)) {
	//	return htmlWithQueryFn<T_Nodes, Q>(htmlString, options);
	//}

	const [resultNodes] = buildChildNodes<T_Nodes>(htmlString);
	return resultNodes;
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
