import { queryContainer, queryAllContainer } from "./base.js";
import type { ContainerElement, DeterminedNodeOnString, NestedQuery, SpecString, SpecStringInputs } from "./base.js";
import { _htmlSingleFn } from "./html_single.js";

type OptionsWithQuery<Q extends NestedQuery> = { query: Q };
type OptionsWithQueryAll<Q extends NestedQuery> = { queryAll: Q };
type OptionsWithBothQuery<Q1 extends NestedQuery, Q2 extends NestedQuery> = { query: Q1; queryAll: Q2 };
type QueryOptions<Q extends NestedQuery> = { query: Q; queryAll: Q };

type AnyQueryOptions<Q1 extends NestedQuery, Q2 extends NestedQuery> = Partial<{ query: Q1; queryAll: Q2 }>;

export type QueryResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: HTMLElement | null;
};
export type QueryAllResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: NodeList;
};

type QueryResult<Q extends NestedQuery> = { query: QueryResultOf<Q>; queryAll: QueryAllResultOf<Q> };

type QueryResultMerged<Q extends NestedQuery> = QueryResultOf<Q> & QueryAllResultOf<Q>;
type QueryResultMerged2<Q1 extends NestedQuery, Q2 extends NestedQuery> = QueryResultOf<Q1> & QueryAllResultOf<Q2>;

/**
 * Accept query options.
 *
 * @example
 *
 * const [ulEl, { items, firstItem } = htmlTupleFn(
 *   `<ul><li>first item</li><li>second item</li><ul>`, {
 *     queryAll: { items: 'li' }
 *     query: { firstItem: 'li:first-of-type' }
 *   })
 */
export function htmlTupleFn<T extends Node | string, Q1 extends NestedQuery, Q2 extends NestedQuery>(
	stringInput: SpecString<T> | SpecStringInputs<T>,
	options?: AnyQueryOptions<Q1, Q2>,
): [DeterminedNodeOnString<T>, QueryResultMerged2<Q1, Q2>] {
	const [resultNode, containerEl] = _htmlSingleFn(stringInput);

	// append query
	//const queryResults = buildQueryResult<Q>(containerEl, options);
	const queryResultsMerged = buildQueryResultMerged<Q1, Q2>(containerEl, options);
	return [resultNode as DeterminedNodeOnString<T>, queryResultsMerged] as const;
}

export function htmlQuery<Q1 extends NestedQuery, Q2 extends NestedQuery>(
	element: HTMLElement,
	queryOptions: AnyQueryOptions<Q1, Q2>,
) {
	return buildQueryResultMerged<Q1, Q2>(element, queryOptions);
}

// @deprecated
function buildQueryResult<Q extends NestedQuery>(
	containerEl: ContainerElement,
	queryOptions?: Partial<QueryOptions<Q>>,
): QueryResult<Q> {
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

	const result = { query, queryAll };
	return result;
}

function buildQueryResultMerged<Q1 extends NestedQuery, Q2 extends NestedQuery>(
	element: ContainerElement,
	queryOptions?: AnyQueryOptions<Q1, Q2>,
): QueryResultMerged2<Q1, Q2> {
	// 'query'
	let query = {} as QueryResultOf<Q1>;
	if (hasQueryOption(queryOptions)) {
		query = Object.entries(queryOptions.query).reduce((memo, [name, selector]) => {
			memo[name as keyof Q1] = queryContainer(element, selector);
			return memo;
		}, query);
	}

	// 'queryAll'
	let queryAll = {} as QueryAllResultOf<Q2>;
	if (hasQueryAllOption(queryOptions)) {
		queryAll = Object.entries(queryOptions.queryAll).reduce((memo, [name, selector]) => {
			memo[name as keyof Q2] = queryAllContainer(element, selector);
			return memo;
		}, queryAll);
	}

	const result = { ...queryAll, ...query };
	return result;
}

export function hasQueryOption<Q1 extends NestedQuery, Q2 extends NestedQuery>(
	options?: AnyQueryOptions<Q1, Q2>,
): options is { query: Q1 } {
	return Boolean(options?.query);
}

export function hasQueryAllOption<Q1 extends NestedQuery, Q2 extends NestedQuery>(
	options?: AnyQueryOptions<Q1, Q2>,
): options is { queryAll: Q2 } {
	return Boolean(options?.queryAll);
}

export function hasAnyQueryOption<Q1 extends NestedQuery, Q2 extends NestedQuery>(options?: AnyQueryOptions<Q1, Q2>) {
	return hasQueryOption<Q1, Q2>(options) || hasQueryAllOption<Q1, Q2>(options);
}
