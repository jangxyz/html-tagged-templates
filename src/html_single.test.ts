import { describe, expect, expectTypeOf, test } from "vitest"
import { htmlSingleFn } from "./html_single.js"

describe("htmlSingleFn", () => {
	test("is a function", () => {
		expect(htmlSingleFn).toBeInstanceOf(Function)
		// biome-ignore lint/complexity/noBannedTypes: <explanation>
		expectTypeOf<Function>(htmlSingleFn)
	})

	test("returns a HTMLElement from string", () => {
		const el = htmlSingleFn("<div>I am an element")
		expect(el).toBeInstanceOf(HTMLElement)
	})

	describe("edge cases", () => {
		// some implementations cannot render <td> correctly,
		// like using `divEl.innerHTML = ...`
		// NOTE this fails in DOM, but not in happy-dom
		test("can render <td>", () => {
			const el = htmlSingleFn("<td>Hi there</td>")

			expect(el).toBeInstanceOf(HTMLTableCellElement)
			expect((el as HTMLElement).tagName).toEqual("TD")
		})
	})

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

		describe("type inference", () => {
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
	})

	describe("children nesting", () => {
		test("create nested element from string", () => {
			const divEl = htmlSingleFn("<div>Hi there, <em>mate<em>!</div>")
			expect(divEl).toBeInstanceOf(HTMLDivElement)

			const emEl = (divEl as HTMLElement).querySelector("em")
			expect(emEl).toBeInstanceOf(HTMLElement)
		})

		test("accepts node as child", () => {
			const emEl = htmlSingleFn("<em>Emp!</em>")
			const divEl = htmlSingleFn(["<div>Hi there, ", emEl, "</div>"])
			expect(divEl).toBeInstanceOf(HTMLDivElement)

			const childEl = divEl.querySelector("em")
			expect(childEl?.textContent).toEqual("Emp!")
			expect(childEl).toBe(emEl)
		})

		test("accepts arrays of nodes as child", () => {
			const items = [1, 2, 3].map((n) => htmlSingleFn(`<li>${n}.</li>`))
			const ulEl = htmlSingleFn(["<ul>", items, "</ul>"])

			const itemEls = ulEl.querySelectorAll("li")
			expect(itemEls).toHaveLength(3)
		})

		test("accepts nested arrays of children nodes", () => {
			const containerEl = htmlSingleFn([
				"<div>",
				[
					"<p>List goes here:</p>",
					"<ul>",
					[
						"<li>123</li>",
						"<li>456</li>",
						"<li>789</li>",
						"<li>123</li>",
						"<li>456</li>",
						"<li>789</li>",
						"<li>123</li>",
					],
					"</ul>",
				],
				"</div>",
			])

			expect(containerEl.childElementCount).toEqual(2)
			expect(containerEl.querySelectorAll("ul li")).toHaveLength(7)
		})
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

		test("assign true leaves only attribute name", () => {
			// true
			const checkbox1 = htmlSingleFn(['<input type="checkbox" checked="', true, '" />'])

			expect(checkbox1.hasAttribute("checked")).toBeTruthy()
			expect(checkbox1.getAttribute("checked")).toBeFalsy()
		})
		test("assign false removes attrbute at all", () => {
			// false
			const checkbox2 = htmlSingleFn(['<input type="checkbox" checked="', false, '" />'])

			expect(checkbox2.hasAttribute("checked")).toBeFalsy()
			expect(checkbox2.outerHTML).toEqual('<input type="checkbox">')
		})

		test("should be inside enclosing quotes", () => {
			let clicked = false
			const onClick = () => {
				clicked = true
			}

			// attributes without enclosing quotes throws error
			expect(() => htmlSingleFn(["<button onclick=", onClick, ">Click me</button>"])).toThrowError()

			// both double & single quotes are allowed
			const attrInSingleQuote = htmlSingleFn(["<button onclick='", onClick, "'>Click me</button>"])
			expect(attrInSingleQuote.getAttribute("type")).toBe("checkbox")
		})

		test.todo("assign other primitives", () => {
			const numberInput = htmlSingleFn(['<input type="number" min="', 1, '" />'])

			expect(numberInput.getAttribute("min")).toEqual("1")
		})

		describe("edge cases", () => {
			test.todo("raise error if brackets does not match")

			test("okay to have partial string to start with tag name", () => {
				const el = htmlSingleFn<HTMLDivElement>(["<", "div", ">", "Click me", "</div>"])
				expect(el.tagName).toEqual("DIV")
			})

			test("okay to have partial string concatenated into tag name", () => {
				const el = htmlSingleFn<HTMLDivElement>(["<", "scr", "ipt", ">", "Click me", "</div>"])
				expect(el.tagName).toEqual("SCRIPT")
			})

			test("okay to have partial string to start with attr name", () => {
				let clicked = false
				const el = htmlSingleFn([
					"<a ",
					'onclick="',
					() => {
						//console.log('click')
						clicked = true
					},
					'">',
					"Click me",
					"</a>",
				])

				el.click()
				expect(clicked).toEqual(true)
			})

			test("okay to have partial string concatenated into attr name", () => {
				let clicked = false
				const el = htmlSingleFn([
					"<a ",
					"on",
					'click="',
					() => {
						//console.log('click')
						clicked = true
					},
					'">',
					"Click me",
					"</a>",
				])

				el.click()
				expect(clicked).toEqual(true)
			})
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
})
