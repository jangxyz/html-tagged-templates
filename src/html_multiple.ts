/**
 * Accept html strings as array of strings.
 */

import { buildSingleNode } from "./base.js";
import type { CommentPrefixedString, ElementPrefixedString, HtmlTagName } from "./utils.js";

/**
 * Accept html as array of strings.
 *
 * @example
 *
 * const [divEl, pEl] = htmlMultipleFn(["<div>Hi there,</div>", "<p>I am here</p>"])
 */
// overload: single-element
export function htmlMultipleFn<T_Str extends HtmlTagName>(
	htmlString: [ElementPrefixedString<T_Str>],
): [HTMLElementTagNameMap[T_Str]];
// overload: single-comment
export function htmlMultipleFn(htmlString: [CommentPrefixedString]): [Comment];
// overload: single-text
export function htmlMultipleFn(htmlString: [string]): [Text];
// overload: single-any
export function htmlMultipleFn<T_Node extends Node>(htmlStrings: [string]): [T_Node];
// overload: multiple any
export function htmlMultipleFn<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes;
// acutla implementation
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
