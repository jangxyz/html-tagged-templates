//import { GlobalRegistrator } from "@happy-dom/global-registrator"
//GlobalRegistrator.register({ url: "http://localhost:3000" })

import { beforeAll, beforeEach, describe, expect, expectTypeOf, test } from "vitest"
import { htmlFn, htmlSingleFn, htmlMultipleFn, htmlWithQueryFn } from "./index.js"

test("is a function", () => {
	expect(htmlFn).toBeInstanceOf(Function)
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	expectTypeOf<Function>(htmlFn)
})

describe("htmlFn returing list-like", () => {
	let subject = htmlFn
	beforeAll(() => {
		subject = htmlFn
	})

	test("returns items of elements", () => {
		const result = subject("<div>Hi there</div>")
		expect(result).toHaveLength(1)

		const [el] = result
		expect(el).toBeInstanceOf(HTMLElement)
	})

	test.skip("returns list of elements", () => {
		const result = subject("<div>Hi there</div>")
		expect(result).toBeInstanceOf(NodeList)
	})
})

describe("edge cases", () => {
	// NOTE this fails in DOM, but not in happy-dom
	test("can render <td>", () => {
		const el = htmlSingleFn("<td>Hi there</td>")

		expect(el).toBeInstanceOf(HTMLTableCellElement)
		expect((el as HTMLElement).tagName).toEqual("TD")
	})
})

describe("returning many", () => {
	test("returns many elements", () => {
		const [divEl, pEl] = htmlMultipleFn(["<div>Hi there,</div>", "<p>I am here</p>"])

		expect((divEl as HTMLElement).tagName).toEqual("DIV")
		expect((pEl as HTMLElement).tagName).toEqual("P")
	})

	test("returns multiples of elements and nodes", () => {
		const [divEl, text, pEl] = htmlMultipleFn(["<div>Hi</div>", " there, ", "<p>I am here</p>"])

		expect((divEl as HTMLElement).tagName).toEqual("DIV")
		expect((text as Text).data).toEqual(" there, ")
		expect((pEl as HTMLElement).tagName).toEqual("P")
	})

	describe.skip("type generics", () => {
		test("returns many elements", () => {
			const [divEl, pEl] = htmlMultipleFn<[HTMLDivElement, HTMLParagraphElement]>([
				"<div>Hi there,</div>",
				"<p>I am here</p>",
			])

			expect(divEl.tagName).toEqual("DIV")
			expect(pEl.tagName).toEqual("P")
		})

		test("returns multiples of elements and nodes", () => {
			const [divEl, text, pEl] = htmlMultipleFn<[HTMLDivElement, Text, HTMLParagraphElement]>([
				"<div>Hi</div>",
				" there, ",
				"<p>I am here</p>",
			])

			expect(divEl.tagName).toEqual("DIV")
			expect(text.data).toEqual(" there, ")
			expect(pEl.tagName).toEqual("P")
		})
	})

	describe("type inference", () => {
		test("recognize text from literal", () => {
			const [text] = htmlMultipleFn(["sample text"])
			expectTypeOf(text).toEqualTypeOf<Text>()
		})

		test("recognize element from literal", () => {
			const result = htmlMultipleFn(["<div>Some element</div>"])
			const [el] = result
			expectTypeOf(el).toEqualTypeOf<HTMLDivElement>()
		})

		test("recognize comment from literal", () => {
			const [comment] = htmlMultipleFn(["<!-- comment here -->"])
			expectTypeOf(comment).toEqualTypeOf<Comment>()
		})

		test("unable to recognize text from expression", () => {
			const [text] = htmlMultipleFn(["sample" + "text"])

			expectTypeOf(text).not.toEqualTypeOf<Text>()
			expectTypeOf(text).toEqualTypeOf<Node>()
		})

		test("recognize multiples nodes", () => {
			const [divEl, text, pEl] = htmlMultipleFn(["<div>Hi</div>", " there, ", "<p>I am here</p>"])

			expectTypeOf(divEl).toEqualTypeOf<HTMLDivElement>()
			expectTypeOf(text).toEqualTypeOf<Text>()
			expectTypeOf(pEl).toEqualTypeOf<HTMLParagraphElement>()
		})
	})
})

describe("return many with array of elements as input", () => {
	let subject: typeof htmlMultipleFn
	beforeEach(() => {
		subject = htmlMultipleFn
	})

	test("single item - element", () => {
		const [node1] = subject(["<div>Hi</div>"])
		expectTypeOf<HTMLDivElement>(node1)
		expect(node1.tagName).toEqual("DIV")

		const [node2] = subject(["<p>Hi</p>"])
		expectTypeOf<HTMLParagraphElement>(node2).toEqualTypeOf(node1)
		expect(node2.tagName).toEqual("P")
	})
	test("single item - text", () => {
		const [node] = subject(["Hi"])

		expectTypeOf<Text>(node)
		expect(node.nodeType).toEqual(document.TEXT_NODE)
		expect(node.nodeValue).toEqual("Hi")
	})
	test("single item - comment", () => {
		const [node] = subject(["<!-- I am a comment -->"])
		expect(node.nodeType).toEqual(document.COMMENT_NODE)
	})

	test("many nodes", () => {
		// TODO: can I make it auto-infer?
		const [divEl, text, pEl] = subject(["<div>Hi</div>", " there, ", "<p>I am here</p>"])

		expect(divEl.tagName).toEqual("DIV")
		expect(text.data).toEqual(" there, ")
		expect(pEl.tagName).toEqual("P")
	})
})

describe("nesting", () => {
	test("create nested element", () => {
		const divEl = htmlSingleFn("<div>Hi there, <em>mate<em>!</div>")
		expect(divEl).toBeInstanceOf(HTMLDivElement)

		const emEl = (divEl as HTMLElement).querySelector("em")
		expect(emEl).toBeInstanceOf(HTMLElement)
	})

	test("assign nested queries as option", () => {
		const result = htmlWithQueryFn("<div>Hi there, <em>mate<em>!</div>", {
			query: {
				emEl: "em",
				boldEl: "bold",
			},
		})

		//const [divEl] = result
		//const { emEl, boldEl } = lastOf(result)
		const {
			element: divEl,
			query: { emEl, boldEl },
		} = result

		expect(divEl).toBeInstanceOf(HTMLDivElement)
		expect(emEl).toBeInstanceOf(HTMLElement)
		expect(boldEl).toBeNull()
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

		expect((checkbox as HTMLInputElement).getAttribute("checked")).toEqual("true")
	})
})
