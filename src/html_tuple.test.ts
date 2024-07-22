import { describe, expect, expectTypeOf, test } from "vitest"
import { htmlQuery, htmlTupleFn } from "./html_tuple.js"

describe.skip("htmlTupleFn", () => {
	test("returns a tuple of HTMLElement from string", () => {
		const [result] = htmlTupleFn('<button type="button" aria-pressed="false">Click me</button>')
		const button = result as HTMLButtonElement

		expect(button.getAttribute("type")).toEqual("button")
		expect(button.getAttribute("aria-pressed")).toEqual("false")
	})

	describe("query", () => {
		test("assign nested queries as option", () => {
			const result = htmlTupleFn("<div>Hi there, <em>mate<em>!</div>", {
				query: {
					emEl: "em",
					boldEl: "bold",
				},
			})

			const [divEl, { emEl, boldEl }] = result

			expect(divEl).toBeInstanceOf(HTMLDivElement)
			expect(emEl).toBeInstanceOf(HTMLElement)
			expect(boldEl).toBeNull()
		})

		test("assign nested queriesAll as option", () => {
			const result = htmlTupleFn(
				`<ul>
					<li>first item</li>
					<li>second item</li>
				</ul>`,
				{
					queryAll: {
						items: "li",
					},
				},
			)
			const [listEl, { items }] = result

			expect(listEl).toBeInstanceOf(HTMLUListElement)
			expect(items).toHaveLength(2)
		})

		test("both options play together", () => {
			const result = htmlTupleFn(
				`<div>
					<p>See the list</p>
					<ul>
						<li>first item</li>
						<li>second item</li>
					</ul>
				</div>`,
				{
					query: { intro: "p" },
					queryAll: { items: "li" },
				},
			)
			const [_container, { intro, items }] = result

			expect(intro).toBeInstanceOf(HTMLParagraphElement)
			expect(items).toHaveLength(2)
		})
	})

	test("when in conflict, single query wins", () => {
		const result = htmlTupleFn(
			`<div>
        <p>See the list</p>
        <ul>
          <li>first item</li>
          <li>second item</li>
        </ul>
      </div>`,
			{
				query: { item: "p" },
				queryAll: { item: "li" },
			},
		)
		const [_container, { item }] = result

		expect(item).toBeInstanceOf(HTMLParagraphElement)
	})
})
