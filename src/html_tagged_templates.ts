import { htmlSingleFn, type AttrValue } from "./html_single.js";
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

//// overload - div
//function taggedTemplates(strings: DivTemplateStringsArray, ...values: AttrValue[]): HTMLDivElement;
//// overload - default
//function taggedTemplates(strings: MyTemplateStringsArray, ...values: AttrValue[]): HTMLElement;
//// actual implementation
function htmlTaggedTemplates<T extends HTMLElement>(strings: TemplateStringsArray, ...values: AttrValue[]): T {
	if (strings.length === 0) {
		throw new Error("empty string");
	}

	// template string always start with a string, and ends with string.
	// hence, length of `strings` is always larger than length of `values`.
	const partialStrings: [string, ...(string | AttrValue)[]] = [strings[0]];
	for (let i = 1; i < strings.length; i += 1) {
		const stringPart = strings[i];
		partialStrings.push(stringPart);

		const valuePart = values[i];
		if (valuePart !== undefined) {
			partialStrings.push(valuePart);
		}
	}

	const result = htmlSingleFn(partialStrings);
	return result as T;
}

export { htmlTaggedTemplates as html };
