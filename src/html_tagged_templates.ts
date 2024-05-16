import { htmlSingleFn, type AttrValue } from "./html_single.js";
//import type { ElementPrefixedString } from "./utils";

//interface MyTemplateStringsArray extends ReadonlyArray<string> {
//	readonly raw: readonly string[];
//}
//type MyTemplateStringsArray = string[] & { readonly raw: readonly string[]; ;

interface DivTemplateStringsArray extends TemplateStringsArray {
	raw: ["<div " | `${"<div "}${string}`, ...string[]];
	0: "<div " | `${"<div "}${string}`;
}

//// overload - div
//function taggedTemplates(strings: DivTemplateStringsArray, ...values: AttrValue[]): HTMLDivElement;
//// overload - default
//function taggedTemplates(strings: MyTemplateStringsArray, ...values: AttrValue[]): HTMLElement;
//// actual implementation
function htmlTaggedTemplates(strings: TemplateStringsArray, ...values: AttrValue[]): HTMLElement {
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

	const result = htmlSingleFn(partialStrings);
	return result as HTMLElement;
}

export { htmlTaggedTemplates as html };
