/**
 * Accept html strings as array of strings.
 */

import { buildSingleNode } from "./base.js";
import type { ExtractElementPrefix, CommentPrefixedString, NotStartWithLeftAngleBracket } from "./utils.js";
import type { IfNotNeverThen } from "./utils/types_util.js";

type DeterminedNode<S extends string> = IfNotNeverThen<
	ExtractElementPrefix<S>,
	HTMLElementTagNameMap[ExtractElementPrefix<S>],
	S extends CommentPrefixedString ? Comment : S extends NotStartWithLeftAngleBracket<S> ? Text : Node
>;

/**
 * Accept html as array of strings.
 *
 * @example
 *
 * const [divEl, pEl] = htmlMultipleFn(["<div>Hi there,</div>", "<p>I am here</p>"])
 */
//export function htmlMultipleFn<const T extends string[]>(htmlStrings: [...T]): { [I in keyof T]: DeterminedNode<T[I]> };
export function htmlMultipleFn<const T extends (Node | string)[]>(
	htmlStrings: { [I in keyof T]: T[I] extends string ? T[I] : string },
): { [I in keyof T]: T[I] extends string ? DeterminedNode<T[I]> : T[I] };
export function htmlMultipleFn<const T extends string[]>(
	htmlStrings: [...T],
): { [I in keyof T]: DeterminedNode<T[I]> } {
	type ReturnType = { [Index in keyof T]: DeterminedNode<T[Index]> };

	//if (htmlStrings.length === 0) return [] as ReturnType;

	//if (htmlStrings.length === 1) {
	//	const [result] = buildSingleNode(htmlStrings[0]);
	//	return [result] as ReturnType;
	//}

	return htmlStrings.map((str) => {
		const result = buildSingleNode(str);
		return result[0];
	}) as ReturnType;

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
