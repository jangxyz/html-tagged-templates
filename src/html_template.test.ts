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
	const e = htmlSingleFn("<div></div>")

	const t = template("<div>I am {name}</div>")
	const el = t({ name: "me" })

	expect(el).toBeInstanceOf(HTMLDivElement)
	expect(el.tagName).toEqual("DIV")
	expect(el.textContent).toEqual("I am me")
})
