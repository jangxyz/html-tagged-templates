import { beforeEach, describe, expect, expectTypeOf, test } from "vitest"

import { html } from "./html_tagged_templates.js"

test("is a tagged template string", () => {
	const el = html`<div>I am an element</div>`

	expect(el).toBeInstanceOf(HTMLDivElement)
	expect(el.tagName).toEqual("DIV")
	expect(el.textContent).toEqual("I am an element")
})

test("may have nested elements", () => {
	const el = html`<div>
    I am an element, and this is a <button>button</button>
  </div>`

	expect(el.querySelector("button")).toBeInstanceOf(HTMLButtonElement)
})

describe("attributes", () => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	let context: any = {}
	beforeEach(() => {
		context = {
			clicked: false,
		}
	})

	test("may assign values and callbacks as attributes", () => {
		const checkbox = html`<input type="checkbox" checked="${true}" onclick="${() => {
			context.clicked = true
		}}" />` as HTMLInputElement

		expect(checkbox.getAttribute("checked")).toEqual("true")

		checkbox.click()
		expect(context.clicked).toBe(true)
	})

	test("it must be inside quotes", () => {
		expect(() => html`<input type="checkbox" checked=${true} />`).toThrowError()

		// both double & single quotes are allowed
		const attrInSingleQuote = html`<input type="checkbox" checked='${true}' />`
		expect(attrInSingleQuote.getAttribute("checked")).toBe("true")
	})
})

describe.skip("typing", () => {
	test("can figure out type of outermost element", () => {
		const divEl = html`<div>I am a DIV element</div>`
		expectTypeOf<HTMLDivElement>(divEl)

		const pEl = html`<p>I am a P element</p>`
		expectTypeOf<HTMLParagraphElement>(pEl)
	})
})
