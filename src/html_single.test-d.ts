import { describe, expectTypeOf, test } from "vitest"
import { htmlSingleFn } from "./html_single.js"

describe("htmlSingleFn", () => {
	describe("typing", () => {
		describe("type generics", () => {
			test("pass node type as generic", () => {
				const tdEl = htmlSingleFn<HTMLTableCellElement>("<td>Hi there</td>")
				//    ^?
				expectTypeOf(tdEl).toEqualTypeOf<HTMLTableCellElement>()

				const el = htmlSingleFn<HTMLElement>("<td>Hi there</td>")
				//    ^?
				expectTypeOf(el).toEqualTypeOf<HTMLElement>()
			})
		})

		describe("infer node type", () => {
			test("recognize element from literal", () => {
				const el = htmlSingleFn("<div>Some element</div>")
				//    ^?
				expectTypeOf(el).toEqualTypeOf<HTMLDivElement>()
			})

			test("recognize text from literal", () => {
				const text = htmlSingleFn("sample text")
				//    ^?
				expectTypeOf(text).toEqualTypeOf<Text>()
			})

			test("recognize comment from literal", () => {
				const comment = htmlSingleFn("<!-- comment here -->")
				//    ^?
				expectTypeOf(comment).toEqualTypeOf<Comment>()
			})

			test("unable to recognize text from expression", () => {
				const text = htmlSingleFn("sample" + "text")
				//    ^?
				expectTypeOf(text).not.toEqualTypeOf<Text>()
				expectTypeOf(text).toEqualTypeOf<Node>()
			})
		})

		describe("infer event type", () => {
			let clicked = false
			const button = htmlSingleFn([
				"<button ",
				'name="my-button"',
				'onclick="',
				(event) => {
					// ^?
					expectTypeOf(event).toEqualTypeOf<MouseEvent>()
					clicked = true
				},
				'">click me</button>',
			])

			button.click()
		})
	})
})

//type TagOpenPrefix = `<${"button"}`
//type TagOpener = `${TagOpenPrefix}>` | `${TagOpenPrefix} `
//type TagCloser = `${string}>`

//type Middles0 = (string | ((event: Event) => void))[]
//type Middles = Middles0

//type ClickHandlerTriplet = ['onclick="', (event: MouseEvent) => void, `"${string}`]

//type WithClickHandler_Head = [...ClickHandlerTriplet, ...string[]]

//function htmlSingleFn_(inputs: [TagOpener, ...Middles, TagCloser]): HTMLElement {
//	const [node, _containerEl] = buildSingleNode<HTMLElement>("<html />")

//	return node
//}
