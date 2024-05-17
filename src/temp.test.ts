import { beforeAll, beforeEach, describe, expect, expectTypeOf, test } from "vitest"
import type {
	CommentPrefixedString,
	ElementPrefixedString,
	HtmlTagName,
	NotStartWithLeftAngleBracket,
} from "./utils.js"
import { htmlTagNamesMap } from "./utils/html_tags.js"
import { buildSingleNode } from "./base.js"

type Value = number | string | boolean | null | undefined

function asTuple<T extends Array<unknown>>(items: [...T]) {
	return items
}

//const b = asTuple([1, 3, "ABC"]) // [number, number, string]

///

//function iterative(values: Value[]) {
function iterativeDouble<T extends Value[]>(values: T): T {
	return values.map((v) => {
		switch (typeof v) {
			case "number":
				return v * 2
			case "string":
				return v.repeat(2)
			default:
				return v
		}
	}) as T
}

///

// use conditional type to construct a new tuple
type CircularShift<T extends Value[]> = T extends [infer U, ...infer Rest] ? [...Rest, U] : never

function circularShift<T extends Value[]>(values: T): CircularShift<T> {
	const result = values.slice()
	const v = result.shift()
	result.push(v)
	return result as CircularShift<T>
}

///

function h0<T_Str extends HtmlTagName>(htmlString: ElementPrefixedString<T_Str>): HTMLElementTagNameMap[T_Str] {
	const [result] = buildSingleNode(htmlString)
	return result as HTMLElementTagNameMap[T_Str]
}

//

type H1Type<T_Str extends string> = T_Str extends ElementPrefixedString<infer T_TagName>
	? HTMLElementTagNameMap[T_TagName]
	: Text

function h1<T_Str extends string>(htmlString: T_Str): H1Type<T_Str> {
	const [result] = buildSingleNode(htmlString)
	return result as H1Type<T_Str>
}

//

function h2<T_Str extends HtmlTagName>(htmlStrings: [ElementPrefixedString<T_Str>]): [HTMLElementTagNameMap[T_Str]]
function h2<T_Nodes extends Node[]>(htmlStrings: string[]): T_Nodes {
	const [result] = buildSingleNode<T_Nodes[number]>(htmlStrings[0])
	return [result] as T_Nodes
}

const x0 = h0("<div>abc</div>")
const y0 = h0("<div>a bc</div>")
const z0 = h0("<div>abc abc abc</div>")

const x1 = h1("<div>abc</div>")
const y1 = h1("abc")

const x2 = h2(["<div>abc</div>"])
const y2 = h2(["<div>abc</div>", "abc", "<span>spam</span>"])

///

//type AllElementPrefixedString = ElementPrefixedString<HtmlTagName>
type AllElementPrefixedString = ElementPrefixedString<"div">
//type AllElementPrefixedString = ElementPrefixedString<"img" | "input">;
const example1: AllElementPrefixedString = "<div>This is a div</div>"

//

type ContainingSubstr<S extends string> = `${string}${S}${string}`
const cs1: ContainingSubstr<"b" | "c"> = "a bc"

type DoesNotContainSpace<S extends string> = S extends ContainingSubstr<" "> ? never : S
function f_dncs<S extends string>(input: DoesNotContainSpace<S>) {}
const dncs1 = f_dncs("a bc")

type TagDelimiter = " " | ">" | "/"

type ContainsDelimiter<S extends string> = S extends ContainingSubstr<TagDelimiter> ? S : never
type NoDelimiter<S extends string> = S extends ContainingSubstr<TagDelimiter> ? never : S

type CheckValidSuffix<S extends string> = S extends TagDelimiter ? S : never
type vs1 = CheckValidSuffix<" ">
type vs2 = CheckValidSuffix<"\t">

type CaptureOpenBracket<S extends string> = S extends `<${infer Name} ${string}` ? Name : never
type CaptureOpenBracket2<S extends string> = S extends `<${infer TagName}${TagDelimiter}${string}`
	? TagName extends ContainsDelimiter<TagName>
		? never
		: TagName
	: never

type ValidEnding = ">" | "/>" | " "
type ValidSuffix = `${ValidEnding}${string}`
//type ValidSuffix = `${ValidEnding}${string}`

//function captureOpenBracket<T_Str extends string>(string: T_Str): T_Str extends `<${infer Name}${ValidSuffix}` ? Name : null {
function captureOpenBracket<S extends string>(input: S): CaptureOpenBracket2<S> {
	const match = input.match(/^<([a-zA-Z0-9-]+)(\s|>|[/])/)
	if (match) {
		return match[1] as CaptureTagName<S>
	}
	return null
}
const name1 = captureOpenBracket("abc")
const name2 = captureOpenBracket("<name here>")

//

type CaptureTagName<S extends string> = S extends `<${infer T_TagName}${TagDelimiter}${string}`
	? T_TagName extends HtmlTagName
		? T_TagName
		: never
	: never

function captureTagName<S extends string>(
	htmlString: S,
): CaptureTagName<S> extends HtmlTagName ? CaptureTagName<S> : null {
	return null
}

type cpn1 = CaptureTagName<"<div>This is a div</div>">
const tagName = captureTagName("<div>This is a div</div>")

type CaptureTagElement<S extends string> = CaptureTagName<S> extends never
	? never
	: CaptureTagName<S> extends HtmlTagName
		? HTMLElementTagNameMap[CaptureTagName<S>]
		: never

function getElement<S extends string>(htmlString: S): CaptureTagElement<S> extends never ? Node : CaptureTagElement<S> {
	const match = htmlString.match(/^<([a-zA-Z0-9-]+)(\s|>)/)
	if (match) {
		const tagName = match[1] as CaptureTagName<S>
		if (tagName in document.createElement(tagName)) {
			return document.createElement(tagName) as CaptureTagName<S> extends HtmlTagName
				? HTMLElementTagNameMap[CaptureTagName<S>]
				: never
		}
	}
	return null as CaptureTagName<S> extends HtmlTagName ? HTMLElementTagNameMap[CaptureTagName<S>] : null
}

//type cte1 = "<div>This is a div</div>" extends CaptureTagName<"<div>This is a div</div>"> ? 1 : 2

//type ge1 = "<div>This is a div</div>" extends CaptureTagName

const el1 = getElement("<div>This is a div</div>")
const el2 = getElement("<span>This is a span</span>")
const el3 = getElement("<wrong element>")
const el4 = getElement("This is a text")

///

type DeterminedNode<S extends string> = S extends ElementPrefixedString<infer T_TagName>
	? HTMLElementTagNameMap[T_TagName]
	: S extends CommentPrefixedString
		? Comment
		: S extends NotStartWithLeftAngleBracket<S>
			? Text
			: Node

type dn1 = DeterminedNode<"<div ">
type dn2 = DeterminedNode<"<input />">
type dn3 = DeterminedNode<"<!-- a comment -->">
type dn4 = DeterminedNode<"just text">
type dn5 = DeterminedNode<"<invalid node>">

const dn_v1: DeterminedNode<"abc"> = new Text("abc")

function hm_fn1<S extends string>(htmlString: S): DeterminedNode<S> {
	// Text node
	if (!htmlString.startsWith("<")) {
		const textNode = new Text(htmlString)
		return textNode as DeterminedNode<S>
	}

	// Comment node
	if (htmlString.startsWith("<!--")) {
		const commentNode = new Comment()
		commentNode.nodeValue = htmlString
		return commentNode as DeterminedNode<S>
	}

	// Element node
	const md = htmlString.match(/^<(\w+)/)
	if (md && htmlTagNamesMap[md[1]]) {
		const tagName = md[1]
		const el = document.createElement(tagName)
		return el as DeterminedNode<S>
	}

	const node = new Node()
	node.nodeValue = htmlString
	return node as DeterminedNode<S>
}

const hmfn1_v1 = hm_fn1("<div>I am here</div>")

function hm_fn2<S extends string>(htmlString: S): [DeterminedNode<S>] {
	// Text node
	if (!htmlString.startsWith("<")) {
		const textNode = new Text(htmlString)
		return [textNode as DeterminedNode<S>]
	}

	// Comment node
	if (htmlString.startsWith("<!--")) {
		const commentNode = new Comment()
		commentNode.nodeValue = htmlString
		return [commentNode as DeterminedNode<S>]
	}

	// Element node
	const md = htmlString.match(/^<(\w+)/)
	if (md && htmlTagNamesMap[md[1]]) {
		const tagName = md[1]
		const el = document.createElement(tagName)
		return [el as DeterminedNode<S>]
	}

	const node = new Node()
	node.nodeValue = htmlString
	return [node as DeterminedNode<S>]
}

///

describe("experiment", () => {
	describe("iterativeDouble", () => {
		test("run result", () => {
			const input: [number, number, boolean, null, string, undefined] = [0, 1, true, null, "abc", undefined]
			const result = iterativeDouble(input)
			expect(result).toEqual([0, 2, true, null, "abcabc", undefined])
		})

		test("type inference", () => {
			//const input: [number, number, boolean, null, string, undefined] = [0, 1, true, null, "abc", undefined]
			//const result = iterative(input)
			const input = asTuple([0, 1, true, null, "abc", undefined])
			const result = iterativeDouble(input)
			expectTypeOf(result).toEqualTypeOf<[number, number, boolean, null, string, undefined]>()
		})
	})

	describe("circulrShift", () => {
		test("run result", () => {
			const input = asTuple([0, 1, true, null, "abc", undefined])
			const result = circularShift(input)
			expect(result).toEqual([1, true, null, "abc", undefined, 0])
		})

		test("type inference", () => {
			const input = asTuple([0, 1, true, null, "abc", undefined])
			expectTypeOf(input).toEqualTypeOf<[number, number, boolean, null, string, undefined]>()

			const result = circularShift(input)
			expectTypeOf(result).toEqualTypeOf<[number, boolean, null, string, undefined, number]>()
		})
	})
})
