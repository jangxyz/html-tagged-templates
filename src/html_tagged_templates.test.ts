import { beforeEach, describe, expect, expectTypeOf, test } from "vitest"

import { html } from "./html_tagged_templates.js"

test("is a tagged template string", () => {
	const el = html`<div>I am an element</div>`

	expect(el).toBeInstanceOf(HTMLDivElement)
	expect(el.tagName).toEqual("DIV")
	expect(el.textContent).toEqual("I am an element")
})

test("may have nested element", () => {
	const el = html`<div>
    I am an element, and this is a 
		${html`<button>button</button>`}
  </div>`

	expect(el.querySelector("button")).toBeInstanceOf(HTMLButtonElement)
})

test("may have array of nested elements", () => {
	const el = html`<div>
    I am an element, and this is a 
		${["click", "cancel"].map((text) => html`<button>${text}</button>`)}
  </div>`

	expect(el.querySelectorAll("button")).toHaveLength(2)
})

describe("attributes", () => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	let context: any = {}
	beforeEach(() => {
		context = {
			clicked: false,
		}
	})

	test("may assign callbacks as attributes", () => {
		const checkbox = html`<input type="checkbox" onclick="${() => {
			context.clicked = true
		}}" />` as HTMLInputElement

		checkbox.click()
		expect(context.clicked).toBe(true)
	})

	test("assign true leaves only attribute name", () => {
		// true
		const checkbox1 = html`<input type="checkbox" checked="${true}" />`

		expect(checkbox1.hasAttribute("checked")).toBeTruthy()
		expect(checkbox1.getAttribute("checked")).toBeFalsy()
	})
	test("assign false removes attrbute at all", () => {
		// false
		const checkbox2 = html`<input type="checkbox" checked="${false}" />`

		expect(checkbox2.hasAttribute("checked")).toBeFalsy()
		expect(checkbox2.outerHTML).toEqual('<input type="checkbox">')
	})

	test("it must be inside quotes", () => {
		expect(() => html`<input type="checkbox" checked=${true} />`).toThrowError()

		// both double & single quotes are allowed
		const attrInSingleQuote = html`<input type="checkbox" checked='${true}' />`
		expect(attrInSingleQuote.hasAttribute("checked")).toBeTruthy()
	})
})

describe("typing", () => {
	describe("with generics", () => {
		test("can pass type as generic", () => {
			const divEl = html<HTMLDivElement>`<div>I am a DIV element</div>`
			//    ^?
			expectTypeOf<HTMLDivElement>(divEl)

			const pEl = html<HTMLParagraphElement>`<p>I am a P element</p>`
			//    ^?
			expectTypeOf<HTMLParagraphElement>(pEl)
		})

		test("can pass tag name as generic", () => {
			const divEl = html<"div">`<div>I am a DIV element</div>`
			//    ^?
			expectTypeOf<HTMLDivElement>(divEl)

			const pEl = html<"p">`<p>I am a P element</p>`
			//    ^?
			expectTypeOf<HTMLParagraphElement>(pEl)
		})
	})

	describe("inference", () => {
		test("can only return HTMLElement by default", () => {
			const divEl = html`<div>I am just an element</div>`
			//    ^?
			expectTypeOf<HTMLElement>(divEl)
		})

		// not possible before typescript supports it
		test.skip("can figure out type of outermost element", () => {
			const divEl = html`<div>I am a DIV element</div>`
			//    ^?
			expectTypeOf<HTMLDivElement>(divEl)

			const pEl = html`<p>I am a P element</p>`
			//    ^?
			expectTypeOf<HTMLParagraphElement>(pEl)
		})
	})
})
