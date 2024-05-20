import { describe, expect, expectTypeOf, test } from "vitest"
import { htmlSingleFn } from "./index.js"

test("is a function", () => {
	expect(htmlSingleFn).toBeInstanceOf(Function)
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	expectTypeOf<Function>(htmlSingleFn)
})

describe("edge cases", () => {
	// NOTE this fails in DOM, but not in happy-dom
	test("can render <td>", () => {
		const el = htmlSingleFn("<td>Hi there</td>")

		expect(el).toBeInstanceOf(HTMLTableCellElement)
		expect((el as HTMLElement).tagName).toEqual("TD")
	})

	describe("type generics", () => {
		test("pass node type as generic", () => {
			const tdEl = htmlSingleFn<HTMLTableCellElement>("<td>Hi there</td>")
			expectTypeOf(tdEl).toEqualTypeOf<HTMLTableCellElement>()

			const el = htmlSingleFn<HTMLElement>("<td>Hi there</td>")
			expectTypeOf(el).toEqualTypeOf<HTMLElement>()
		})
	})

	describe("type inference", () => {
		test("recognize element from literal", () => {
			const el = htmlSingleFn("<div>Some element</div>")
			expectTypeOf(el).toEqualTypeOf<HTMLDivElement>()
		})

		test("recognize text from literal", () => {
			const text = htmlSingleFn("sample text")
			expectTypeOf(text).toEqualTypeOf<Text>()
		})

		test("recognize comment from literal", () => {
			const comment = htmlSingleFn("<!-- comment here -->")
			expectTypeOf(comment).toEqualTypeOf<Comment>()
		})

		test("unable to recognize text from expression", () => {
			const text = htmlSingleFn("sample" + "text")
			expectTypeOf(text).not.toEqualTypeOf<Text>()
			expectTypeOf(text).toEqualTypeOf<Node>()
		})
	})
})

describe("nesting", () => {
	test("create nested element", () => {
		const divEl = htmlSingleFn("<div>Hi there, <em>mate<em>!</div>")
		expect(divEl).toBeInstanceOf(HTMLDivElement)

		const emEl = (divEl as HTMLElement).querySelector("em")
		expect(emEl).toBeInstanceOf(HTMLElement)
	})

	//test.skip("nested query works with multiple input args too", () => {
	//	const result = htmlwithQueryFn(["<h1>Title</h1>", "<p>Hi there, <em>mate</em>!</p>"], {
	//		query: {
	//			emEl: "em",
	//		},
	//	})
	//	console.log("🚀 ~ file: html.test.ts:174 ~ test ~ result:", result)
	//	const [
	//		[headingEl, pEl],
	//		{ query: { emEl } },
	//	] = result
	//	expect(headingEl).toBeInstanceOf(HTMLHeadingElement)
	//	expect(pEl).toBeInstanceOf(HTMLParagraphElement)
	//	expect(emEl?.textContent).toEqual("mate")
	//})
})

describe("attributes", () => {
	test("assign attributes properly", () => {
		const result = htmlSingleFn('<button type="button" aria-pressed="false">Click me</button>')
		const button = result as HTMLButtonElement

		expect(button.getAttribute("type")).toEqual("button")
		expect(button.getAttribute("aria-pressed")).toEqual("false")
	})

	test("assign callbacks", () => {
		let clicked = false

		const button = htmlSingleFn([
			'<button type="button" aria-pressed="false" onclick="',
			() => {
				//console.log("click")
				clicked = true
			},
			'">Click me</button>',
		])

		//console.log("button")
		;(button as HTMLButtonElement).click()

		expect(clicked).toBe(true)
	})

	test("assign other primitives", () => {
		const checkbox = htmlSingleFn(['<input type="checkbox" checked="', true, '" />'])

		expect(checkbox.getAttribute("checked")).toEqual("true")
	})

	describe("types", () => {
		test.skip("first argument must be string", () => {
			const fn = () => htmlSingleFn([true, "<div>abc</div>"])
			expectTypeOf<never>(fn()).toBeNever()
			expect(fn).toThrowError()
		})

		test("pass node type as generic", () => {
			const checkbox = htmlSingleFn<HTMLElement>(['<input type="checkbox" checked="', true, '" />'])
			expectTypeOf(checkbox).toEqualTypeOf<HTMLElement>()
		})
	})
})
