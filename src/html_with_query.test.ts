import { describe, expect, test } from "vitest"
import { htmlWithQueryFn } from "./html_with_query_option"

describe("htmlWithQueryFn", () => {
	test("assign nested queries as option", () => {
		const result = htmlWithQueryFn("<div>Hi there, <em>mate<em>!</div>", {
			query: {
				emEl: "em",
				boldEl: "bold",
			},
		})

		//const [divEl] = result
		//const { emEl, boldEl } = lastOf(result)
		const [divEl, { emEl, boldEl }] = result

		expect(divEl).toBeInstanceOf(HTMLDivElement)
		expect(emEl).toBeInstanceOf(HTMLElement)
		expect(boldEl).toBeNull()
	})

	test("assign nested queriesAll as option", () => {
		const result = htmlWithQueryFn(
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
		const result = htmlWithQueryFn(
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

	test("when in conflict, single query wins", () => {
		const result = htmlWithQueryFn(
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
