type Options<Q extends object> = {
	//returns: "element" | "node" | ("element" | "node")[];
	query: Q;
};

type QueryResultOf<Q extends object> = {
	[K in keyof Q]: HTMLElement | null;
};

//export function htmlFn<T extends Node[]>(htmlString: string, options: Partial<Options>): [...T, object];
//export function htmlFn<T extends Node[], Q extends object>(htmlString: string, options: Omit<Options<Q>, "query">): T;

/**
 * Create HTML elements
 */
export function htmlFn<T extends Node[]>(htmlString: string): T;
export function htmlFn<T extends Node[], Q extends object>(
	htmlString: string,
	options: { query: Q },
): [...T, QueryResultOf<Q>];
export function htmlFn<T extends Node[], Q extends object>(
	htmlString: string,
	options?: Partial<Options<Q>>,
): T | [...T, QueryResultOf<Q>?] {
	const el = document.createElement("div");
	el.innerHTML = htmlString;

	//const lastArg = moreArgs[moreArgs.length - 1];
	//console.log("🚀 ~ file: html.ts:9 ~ htmlFn ~ lastArg:", lastArg);
	//let options: Partial<Options> = {};
	//if (typeof lastArg === "object") {
	//	options = lastArg;
	//}

	const childNodes = el.childNodes;

	const resultNodes = [...childNodes] as unknown as T;
	//const resultNodes: T = [] as T;
	//for (const node of childNodes) {
	//	resultNodes.push(node);
	//}
	if (!options?.query) {
		return resultNodes;
	}

	// assign query results
	const queryResult: QueryResultOf<Q> = Object.entries(options.query).reduce(
		(memo, [name, selector]) => {
			memo[name as keyof Q] = el.querySelector<HTMLElement>(selector);
			return memo;
		},
		{} as Record<keyof Q, HTMLElement | null>,
	);
	return [...resultNodes, queryResult];
}

export function htmlFnWithMultipleArgs<T extends Node[]>(
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
