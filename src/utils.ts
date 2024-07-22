import type { HtmlElementTagName } from "./utils/html-types.js";

//type ReservedNames = "this" | "that"
//type NotA<T> = T extends ReservedNames ? never : T
//type NotB<T> = ReservedNames extends T ? never : T
type StartWithLessThan = `<${string}`;
type NotA<T> = T extends StartWithLessThan ? never : T;
type NotB<T> = StartWithLessThan extends T ? never : T;
//type FooName<T> = NotA<T> & NotB<T>;
export type NotStartWithLeftAngleBracket<T> = NotA<T> & NotB<T>;

//const f1: FooName<'This'> = 'This' // works
//const f2: FooName<'this'> = 'this' // error

//export function htmlFn<T extends Node[]>(htmlString: string, options: Partial<Options>): [...T, object];
//export function htmlFn<T extends Node[], Q extends NestedQuery>(htmlString: string, options: Omit<Options<Q>, "query">): T;

export type TagStartDelimiter = " " | ">" | "/>";
//export type TagStartDelimiter = ">";

//
//export type HtmlElementPrefix<TagName extends HtmlElementTagName> = `<${TagName}>` | `<${TagName} ` | `<${TagName}/>`;
export type HtmlElementPrefix<T_TagName extends HtmlElementTagName> = `<${T_TagName}${string}`;
//export type HtmlElementPrefix<TagName extends HtmlElementTagName> = `<${TagName} ` | `<${TagName}/>`;
//export type HtmlElementPrefix<TagName extends HtmlElementTagName> = `<${TagName}>`;
export type ElementPrefixedString<T_TagName extends HtmlElementTagName> = `<${T_TagName}${TagStartDelimiter}${string}`;
export type ExtractElementPrefix<S extends string> = S extends `<${infer T_TagName}${TagStartDelimiter}${string}`
	? T_TagName extends HtmlElementTagName
		? T_TagName
		: never
	: never;

//const eps1: ElementPrefixedString<"div"> = "<div>abc</div>";
//const eps2: ElementPrefixedString<"div"> = "<div>ab ";

//

export type CommentPrefixedString = `<!--${string}`;
//type TypedHtmlString<T extends string> = T extends HtmlElementTagName ? HtmlPrefix<"div"> : Text;

export type CheckCommentPrefix<T extends string> = T extends `<!--${string}` ? T : never;

export type CheckTextPrefix<T extends string> = NotStartWithLeftAngleBracket<T>;

type CaptureTagName<S extends string> = S extends `<${infer T_TagName}${TagStartDelimiter}${string}`
	? T_TagName extends HtmlElementTagName
		? T_TagName
		: never
	: never;

//type ctn1 = CaptureTagName<"<div>ab ">;

//
// helper functions

export function assert(condition: unknown, errorMsg: string, callback?: (error: Error) => void): asserts condition {
	if (!condition) {
		const error = new Error(errorMsg);
		if (callback) callback(error);
		throw error;
	}
}

export type LastElementOf<T extends readonly unknown[]> = T extends readonly [...unknown[], infer Last] ? Last : never;

export function lastOf<T extends readonly unknown[]>(tuple: T): LastElementOf<T> {
	return tuple[tuple.length - 1] as LastElementOf<T>;
}
