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

test("may have nested element2", () => {
	const el = html`<select>
		${html`<option>option 1</option>`}
	</select>`

	expect(el.querySelector("option")).toBeInstanceOf(HTMLOptionElement)
})

test("may have array of nested elements", () => {
	const el = html`<div>
    I am an element, and this is a 
		${["click", "cancel"].map((text) => html`<button>${text}</button>`)}
  </div>`

	expect(el.querySelectorAll("button")).toHaveLength(2)
})

test("may have array of nested elements2", () => {
	const select = html`<select>
		${["draw", "fill", "rectangle", "pick"].map((text) => html`<option>${text}</option>`)}
	</select>`

	//console.log("select:", select.outerHTML)

	expect(select.querySelectorAll("option")).toHaveLength(4)
})

describe("text node", () => {
	test.skip("should be trimmed on the edge", () => {
		const buttonEl = html`<button>
			click 
		</button>`

		expect(buttonEl.childNodes).toHaveLength(1)
		expect(buttonEl.childNodes[0].nodeValue).toEqual("click")
	})

	test("should be contracted on the edge", () => {
		const buttonEl = html`<button>
			click 
		</button>`

		expect(buttonEl.childNodes).toHaveLength(1)
		expect(buttonEl.childNodes[0].nodeValue).toEqual(" click ")
	})

	test("should NOT be trimmed inside", () => {
		const buttonEl = html`<button>
			${"click"}${"  "}${"me"}
		</button>`

		expect(buttonEl.childNodes).toHaveLength(1)
		expect(buttonEl.childNodes[0].nodeValue?.trim()).toEqual("click  me")
	})
})

describe("attributes", () => {
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

describe("options", () => {
	test.skip("by default it strip whitespaces between nodes", () => {
		const el = html`<div>
			<span>span 1</span>
			<span>span 2</span>
		</div>`

		expect(el.childNodes.length).toEqual(2)
	})
})
