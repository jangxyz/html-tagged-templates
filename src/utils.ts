export type HtmlTagName = keyof HTMLElementTagNameMap;

export type HtmlElementPrefix<TagName extends HtmlTagName> = `<${TagName}>` | `<${TagName} ` | `<${TagName}/>`;
export type ElementPrefixedString<TagName extends HtmlTagName> = `${HtmlElementPrefix<TagName>}${string}`;

//
export type CommentPrefixedString = `<!--${string}`;
//type TypedHtmlString<T extends string> = T extends HtmlTagName ? HtmlPrefix<"div"> : Text;

//export function htmlFn<T extends Node[]>(htmlString: string, options: Partial<Options>): [...T, object];
//export function htmlFn<T extends Node[], Q extends NestedQuery>(htmlString: string, options: Omit<Options<Q>, "query">): T;

export type LastElementOf<T extends readonly unknown[]> = T extends readonly [...unknown[], infer Last] ? Last : never;

export function assert(condition: unknown, errorMsg: string): asserts condition {
	if (!condition) {
		throw new Error(errorMsg);
	}
}

export function lastOf<T extends readonly unknown[]>(tuple: T): LastElementOf<T> {
	return tuple[tuple.length - 1] as LastElementOf<T>;
}
