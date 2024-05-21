import { queryContainer, queryAllContainer } from "./base.js";
import type {
	ContainerElement,
	DeterminedNodeOnString,
	NestedQuery,
	PartialChunk,
	SpecString,
	SpecStringInputs,
} from "./base.js";
import { _htmlSingleFn } from "./html_single.js";

type OptionsWithQuery<Q extends NestedQuery> = { query: Q };
type OptionsWithQueryAll<Q extends NestedQuery> = { queryAll: Q };
type OptionsWithBothQuery<Q1 extends NestedQuery, Q2 extends NestedQuery> = { query: Q1; queryAll: Q2 };
type QueryOptions<Q extends NestedQuery> = { query: Q; queryAll: Q };

export type QueryResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: HTMLElement | null;
};
export type QueryAllResultOf<Q extends NestedQuery> = {
	[K in keyof Q]: NodeList;
};

type QueryResult<Q extends NestedQuery> = { query: QueryResultOf<Q>; queryAll: QueryAllResultOf<Q> };
type QueryResultMerged<Q extends NestedQuery> = QueryResultOf<Q> & QueryAllResultOf<Q>;

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
export function htmlTupleFn<T extends Node | string, Q extends NestedQuery>(
	stringInput: SpecString<T> | SpecStringInputs<T>,
	options?: Partial<QueryOptions<Q>>,
): [DeterminedNodeOnString<T>, QueryResultMerged<Q>] {
	const [resultNode, containerEl] = _htmlSingleFn(stringInput);

	// append query
	//const queryResults = buildQueryResult<Q>(containerEl, options);
	const queryResultsMerged = buildQueryResultMerged<Q>(containerEl, options);
	return [resultNode as DeterminedNodeOnString<T>, queryResultsMerged] as const;
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

function buildQueryResultMerged<Q extends NestedQuery>(
	containerEl: ContainerElement,
	queryOptions?: Partial<QueryOptions<Q>>,
): QueryResultMerged<Q> {
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

	const result = { ...queryAll, ...query };
	return result;
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
