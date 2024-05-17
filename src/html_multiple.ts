/**
 * Accept html strings as array of strings.
 */

import { buildSingleNode } from "./base.js";
import type {
	ExtractElementPrefix,
	CommentPrefixedString,
	ElementPrefixedString,
	HtmlTagName,
	NotStartWithLeftAngleBracket,
	TagStartDelimiter,
	TextPrefixedString,
} from "./utils.js";

type IsNeverType<T> = [T] extends [never] ? true : never;
type IfNeverThen<T, P, N> = [T] extends [never] ? P : N;
type IfNotNeverThen<T, P, N> = [T] extends [never] ? N : P;

//type DeterminedNode<S extends string> = S extends ElementPrefixedString<infer T_TagName>
//	? HTMLElementTagNameMap[T_TagName]
//	: S extends CommentPrefixedString
//		? Comment
//		: S extends NotStartWithLeftAngleBracket<S>
//			? Text
//			: Node;

//type DeterminedNode<S extends string> = [ExtractElementPrefix<S>] extends [never]
//	? S extends CommentPrefixedString
//		? Comment
//		: S extends NotStartWithLeftAngleBracket<S>
//			? Text
//			: Node
//	: HTMLElementTagNameMap[ExtractElementPrefix<S>];
type DeterminedNode<S extends string> = IfNotNeverThen<
	ExtractElementPrefix<S>,
	HTMLElementTagNameMap[ExtractElementPrefix<S>],
	S extends CommentPrefixedString ? Comment : S extends NotStartWithLeftAngleBracket<S> ? Text : Node
>;

//
const hMFn_v1 = htmlMultipleFn(["<div "]);
const hMFn_v1_5 = htmlMultipleFn(["<a> "]);
const hMFn_v2 = htmlMultipleFn(["<input />"]);
const hMFn_v3 = htmlMultipleFn(["<!-- comment -->"]);
const hMFn_v4 = htmlMultipleFn(["just text"]);
const hMFn_v5 = htmlMultipleFn(["<invalid node>"]);

type hmfn_1_5 = DeterminedNode<"<a> ">;

type hmfn_x1 = "<div >" extends ElementPrefixedString<"div"> ? 1 : 2;
//type hmfn_x1_5 = "<a> " extends ElementPrefixedString<infer T_TagName> ? T_TagName : never;
type hmfn_x1_5_2 = "<a> " extends `<${infer T_TagName}${TagStartDelimiter}${string}`
	? T_TagName extends HtmlTagName
		? T_TagName
		: never
	: never;
type hmfn_x1_5_3 = ExtractElementPrefix<"<a> ">;
type hmfn_x1_5_4 = ExtractElementPrefix<"<x> ">;

/**
 * Accept html as array of strings.
 *
 * @example
 *
 * const [divEl, pEl] = htmlMultipleFn(["<div>Hi there,</div>", "<p>I am here</p>"])
 */

//// overload: single-element
//export function htmlMultipleFn<T_Str extends HtmlTagName>( htmlString: [ElementPrefixedString<T_Str>]): [HTMLElementTagNameMap[T_Str]];
//// overload: single-comment
//export function htmlMultipleFn(htmlString: [CommentPrefixedString]): [Comment];
//// overload: single-text
//export function htmlMultipleFn<T_String extends string>(htmlString: [TextPrefixedString<T_String>]): [Text];
//// overload: single-any
//export function htmlMultipleFn<T_Node extends Node>(htmlStrings: [string]): [T_Node];

export function htmlMultipleFn<T_String extends string>(htmlString: [T_String]): [DeterminedNode<T_String>];

// overload: multiple any
export function htmlMultipleFn<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes;
// actual implementation
export function htmlMultipleFn<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes {
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
