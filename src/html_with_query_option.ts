import {
	buildSingleNode,
	queryContainer,
	queryAllContainer,
	type ContainerElement,
	type NestedQuery,
	type QueryOptions,
} from "./base.js";

type OptionsWithQuery<Q extends NestedQuery> = { query: Q };
type OptionsWithQueryAll<Q extends NestedQuery> = { queryAll: Q };
type OptionsWithBothQuery<Q1 extends NestedQuery, Q2 extends NestedQuery> = { query: Q1; queryAll: Q2 };

export type QueryResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: HTMLElement | null;
};
export type QueryAllResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: NodeList;
};

/**
 * Accept query options.
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
	options?: Partial<QueryOptions<Q>>,
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

function buildQueryResult<Q extends NestedQuery>(
	containerEl: ContainerElement,
	queryOptions?: Partial<QueryOptions<Q>>,
): Partial<{ query: QueryResultOf<Q>; queryAll: QueryAllResultOf<Q> }> {
	// 'query'
	let query = {} as QueryResultOf<Q>;
	if (hasQueryOption(queryOptions)) {
		query = Object.entries(queryOptions.query).reduce((memo, [name, selector]) => {
			memo[name as keyof Q] = queryContainer(containerEl, selector);
			return memo;
		}, query);
	}

	// 'queryAll'
	let queryAll = {} as QueryAllResultOf<Q>;
	if (hasQueryAllOption(queryOptions)) {
		queryAll = Object.entries(queryOptions.queryAll).reduce((memo, [name, selector]) => {
			memo[name as keyof Q] = queryAllContainer(containerEl, selector);
			return memo;
		}, queryAll);
	}

	return { query, queryAll };
}

export function hasQueryOption<Q extends NestedQuery>(options?: Partial<QueryOptions<Q>>): options is { query: Q } {
	return Boolean(options?.query);
}
export function hasQueryAllOption<Q extends NestedQuery>(
	options?: Partial<QueryOptions<Q>>,
): options is { queryAll: Q } {
	return Boolean(options?.queryAll);
}
export function hasAnyQueryOption<Q extends NestedQuery>(options?: Partial<QueryOptions<Q>>) {
	return hasQueryOption<Q>(options) || hasQueryAllOption<Q>(options);
}
