import { htmlSingleFn } from "./html_single.js";
import type { AttrValue, DeterminedNode, DeterminedNodeOnString } from "./base.js";
import type { HtmlTagName } from "./utils.js";
//import type { ElementPrefixedString } from "./utils";

//interface MyTemplateStringsArray extends ReadonlyArray<string> {
//	readonly raw: readonly string[];
//}
//type MyTemplateStringsArray = string[] & { readonly raw: readonly string[]; ;

// ts does not support this (as of 5.4.5)
// see:
// - https://github.com/microsoft/TypeScript/issues/31422
// - https://github.com/microsoft/TypeScript/pull/49552
// - https://github.com/microsoft/TypeScript/issues/33304
// - Design Meeting Notes, 8/18/2021: https://github.com/microsoft/TypeScript/issues/45504

interface DivTemplateStringsArray extends TemplateStringsArray {
	raw: ["<div " | `${"<div "}${string}`, ...string[]];
	0: "<div " | `${"<div "}${string}`;
}

function htmlTaggedTemplates<T extends HTMLElement | HtmlTagName>(
	strings: TemplateStringsArray,
	...values: AttrValue[]
): T extends HtmlTagName ? HTMLElementTagNameMap[T] : T {
	if (strings.length === 0) {
		throw new Error("empty string");
	}

	// template string always start with a string, and ends with string.
	// hence, length of `strings` is always larger than length of `values`.
	const partialStrings: (string | AttrValue)[] = [];
	for (let i = 0; i < strings.length; i += 1) {
		const stringPart = strings[i];
		partialStrings.push(stringPart);

		const valuePart = values[i];
		if (valuePart !== undefined) {
			partialStrings.push(valuePart);
		}
	}

	const result = htmlSingleFn(partialStrings as [string, ...(string | AttrValue)[]]);
	return result as T extends HtmlTagName ? HTMLElementTagNameMap[T] : T;
}

export { htmlTaggedTemplates as html };
