import { HTMLCollection } from "happy-dom"

import { GlobalRegistrator } from "@happy-dom/global-registrator"
GlobalRegistrator.register({ url: "http://localhost:3000" })

import { beforeEach, describe, expect, expectTypeOf, test } from "vitest"

import { htmlFn, htmlFnWithArrayArgs, htmlSingleFn, lastOf } from "./html.js"

test("is a function", () => {
	expect(htmlFn).toBeInstanceOf(Function)
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	expectTypeOf<Function>(htmlFn)
})

test("returns items of elements", () => {
	const result = htmlFn("<div>Hi there</div>")
	expect(result).toHaveLength(1)

	const [el] = result
	expect(el).toBeInstanceOf(HTMLElement)
})

test.skip("returns list of elements", () => {
	const result = htmlFn("<div>Hi there</div>")
	expect(result).toBeInstanceOf(NodeList)
})

describe("returning many", () => {
	test("returns many elements", () => {
		const [divEl, pEl] = htmlFn("<div>Hi there,</div><p>I am here</p>")

		expect((divEl as HTMLElement).tagName).toEqual("DIV")
		expect((pEl as HTMLElement).tagName).toEqual("P")
	})

	test("returns multiples of elements and nodes", () => {
		const [divEl, text, pEl] = htmlFn("<div>Hi</div> there, <p>I am here</p>")

		expect((divEl as HTMLElement).tagName).toEqual("DIV")
		expect((text as Text).data).toEqual(" there, ")
		expect((pEl as HTMLElement).tagName).toEqual("P")
	})

	describe("with types", () => {
		test("returns many elements", () => {
			const [divEl, pEl] = htmlFn<[HTMLDivElement, HTMLParagraphElement]>("<div>Hi there,</div><p>I am here</p>")

			expect(divEl.tagName).toEqual("DIV")
			expect(pEl.tagName).toEqual("P")
		})

		test("returns multiples of elements and nodes", () => {
			const [divEl, text, pEl] = htmlFn<[HTMLDivElement, Text, HTMLParagraphElement]>(
				"<div>Hi</div> there, <p>I am here</p>",
			)

			expect(divEl.tagName).toEqual("DIV")
			expect(text.data).toEqual(" there, ")
			expect(pEl.tagName).toEqual("P")
		})
	})
})

describe("return many with array of elements as input", () => {
	let subject: typeof htmlFnWithArrayArgs
	beforeEach(() => {
		subject = htmlFnWithArrayArgs
		//subject = htmlFn as unknown as typeof htmlFnWithArrayArgs
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
		const [divEl, text, pEl] = subject<[HTMLDivElement, Text, HTMLParagraphElement]>([
			"<div>Hi</div>",
			" there, ",
			"<p>I am here</p>",
		])

		expect(divEl.tagName).toEqual("DIV")
		expect(text.data).toEqual(" there, ")
		expect(pEl.tagName).toEqual("P")
	})
})

test("last argument may be an option", () => {
	const result = htmlFn("<div>Hi there</div>", {})
	const [el] = result
	expect(el).toBeInstanceOf(HTMLElement)
	expect(result).toHaveLength(1)
})

describe("nesting", () => {
	test("create nested element", () => {
		const [divEl] = htmlFn<[HTMLElement]>("<div>Hi there, <em>mate<em>!</div>")
		expect(divEl).toBeInstanceOf(HTMLDivElement)

		const emEl = divEl.querySelector("em")
		expect(emEl).toBeInstanceOf(HTMLElement)
	})

	test("assign nested queries as option", () => {
		const result = htmlFn("<div>Hi there, <em>mate<em>!</div>", {
			query: {
				emEl: "em",
				boldEl: "bold",
			},
		})

		const [divEl] = result
		const { emEl, boldEl } = lastOf(result)

		expect(divEl).toBeInstanceOf(HTMLDivElement)
		expect(emEl).toBeInstanceOf(HTMLElement)
		expect(boldEl).toBeNull()
	})

	test("nested query works with multiple input args too", () => {
		const result = htmlFn(["<h1>Title</h1>", "<p>Hi there, <em>mate</em>!</p>"], {
			query: {
				emEl: "em",
			},
		})
		const [[headingEl, pEl], { emEl }] = result
		expect(headingEl).toBeInstanceOf(HTMLHeadElement)
		expect(pEl).toBeInstanceOf(HTMLParagraphElement)
		expect(emEl?.textContent).toEqual("mate")
	})
})

describe("attributes", () => {
	test("assign attributes properly", () => {
		const [button] = htmlFn<[HTMLButtonElement]>('<button type="button" aria-pressed="false">Click me</button>')

		expect(button.getAttribute("type")).toEqual("button")
		expect(button.getAttribute("aria-pressed")).toEqual("false")
	})

	test("assign callbacks", () => {
		let clicked = false

		const [button] = htmlSingleFn([
			'<button type="button" aria-pressed="false" onclick="',
			() => {
				console.log("click")
				clicked = true
			},
			'">Click me</button>',
		])

		//console.log("button")
		;(button as HTMLButtonElement).click()

		expect(clicked).toBe(true)
	})

	test("assign other primitives", () => {
		const [checkbox] = htmlSingleFn(['<input type="checkbox" checked="', true, '" />'])

		expect((checkbox as HTMLInputElement).getAttribute("checked")).toEqual("true")
	})
})
