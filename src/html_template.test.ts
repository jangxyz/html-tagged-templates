import { beforeEach, describe, expect, expectTypeOf, test } from "vitest"

import { template } from "./html_template.ts"
import { htmlSingleFn } from "./html_single.js"

test("is a tagged template string that renders an element", () => {
	const t = template("<div>I am an element</div>")
	const el = t()

	expect(el).toBeInstanceOf(HTMLDivElement)
	expect(el.tagName).toEqual("DIV")
	expect(el.textContent).toEqual("I am an element")
})

test("may pass data", () => {
	const t = template("<div>I am {name}</div>")
	const el = t({ name: "me" })

	expect(el).toBeInstanceOf(HTMLDivElement)
	expect(el.tagName).toEqual("DIV")
	expect(el.textContent).toEqual("I am me")
})

test("may pass multiple data", () => {
	const t = template("<div>I am {name} and you are {you}</div>")
	const el = t({ name: "me", you: "not me" })

	expect(el).toBeInstanceOf(HTMLDivElement)
	expect(el.tagName).toEqual("DIV")
	expect(el.textContent).toEqual("I am me and you are not me")
})

test("is reusable with new data", () => {
	const t = template("<div>I am {name}</div>")
	const el = t({ name: "me" })

	const el2 = t({ name: "you" })
	expect(el2.textContent).toEqual("I am you")
})
