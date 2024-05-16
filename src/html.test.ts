import { HTMLCollection } from "happy-dom"

import { GlobalRegistrator } from "@happy-dom/global-registrator"
GlobalRegistrator.register({ url: "http://localhost:3000" })

import { describe, expect, expectTypeOf, test } from "vitest"

import { htmlFn } from "./html.js"

test("is a function", () => {
	console.log("type:", typeof htmlFn)
	expectTypeOf(htmlFn).toBeFunction()
})

test("returns items of elements", () => {
	const result = htmlFn("<div>Hi there</div>")
	const [el] = result
	expect(el).toBeInstanceOf(HTMLElement)
	expect(result).toHaveLength(1)
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
		expect((text as Text).wholeText).toEqual(" there, ")
		expect((pEl as HTMLElement).tagName).toEqual("P")
	})

	describe("with types", () => {
		test("returns many elementswith types", () => {
			const [divEl, pEl] = htmlFn<[HTMLDivElement, HTMLParagraphElement]>("<div>Hi there,</div><p>I am here</p>")

			expect(divEl.tagName).toEqual("DIV")
			expect(pEl.tagName).toEqual("P")
		})

		test("returns multiples of elements and nodes", () => {
			const [divEl, text, pEl] = htmlFn<[HTMLDivElement, Text, HTMLParagraphElement]>(
				"<div>Hi</div> there, <p>I am here</p>",
			)

			expect(divEl.tagName).toEqual("DIV")
			expect(text.wholeText).toEqual(" there, ")
			expect(pEl.tagName).toEqual("P")
		})
	})
})

describe("return many with array of elements as input", () => {
	test.only("returns many elements", () => {
		const [divEl, text, pEl] = htmlFn(["<div>Hi</div>", " there, ", "<p>I am here</p>"])

		expect(divEl.tagName).toEqual("DIV")
		expect(text.wholeText).toEqual(" there, ")
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
			},
		})
		const [divEl, { emEl }] = result
		expect(divEl).toBeInstanceOf(HTMLDivElement)
		expect(emEl).toBeInstanceOf(HTMLElement)
	})
})

describe("attributes", () => {
	test("assign attributes properly", () => {
		const [button] = htmlFn<[HTMLButtonElement]>('<button type="button" aria-pressed="false">Click me</button>')

		expect(button.getAttribute("type")).toEqual("button")
		expect(button.getAttribute("aria-pressed")).toEqual("false")
	})
})
