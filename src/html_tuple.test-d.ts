import { describe, expectTypeOf, test } from "vitest"
import { htmlQuery, htmlTupleFn } from "./html_tuple.js"

describe("htmlTupleFn", () => {
	describe.skip("type generics", () => {
		test("pass node type as generic", () => {
			const [tdEl] = htmlTupleFn<HTMLTableCellElement>("<td>Hi there</td>")
			//     ^?
			expectTypeOf(tdEl).toEqualTypeOf<HTMLTableCellElement>()

			const [el] = htmlTupleFn<HTMLElement>("<td>Hi there</td>")
			//     ^?
			expectTypeOf(el).toEqualTypeOf<HTMLElement>()
		})
	})

	describe("type inference", () => {
		test("recognize types from literal", () => {
			const [el] = htmlTupleFn("<div>Some element</div>")
			expectTypeOf(el).toEqualTypeOf<HTMLDivElement>()

			const [text] = htmlTupleFn("sample text")
			expectTypeOf(text).toEqualTypeOf<Text>()

			const [comment] = htmlTupleFn("<!-- comment here -->")
			expectTypeOf(comment).toEqualTypeOf<Comment>()
		})

		test("does not recognize text from expression", () => {
			const [text] = htmlTupleFn("sample" + "text")
			expectTypeOf(text).not.toEqualTypeOf<Text>()
			expectTypeOf(text).toEqualTypeOf<Node>()
		})

		test("recognize query type", () => {
			const [divEl, { firstItemEl }] = htmlTupleFn(
				`<div>
					<p>See the list</p>
					<ul>
						<li>first item</li>
						<li>second item</li>
					</ul>
				</div>`,
				{ query: { firstItemEl: "li:first-of-type" } },
			)

			expectTypeOf(divEl).toEqualTypeOf<HTMLDivElement>()
			//           ^?
			expectTypeOf(firstItemEl).toEqualTypeOf<HTMLLIElement>()
			//           ^?
		})
		test("recognize query all type", () => {
			const [divEl, { itemEls }] = htmlTupleFn(
				`<div>
					<p>See the list</p>
					<ul>
						<li>first item</li>
						<li>second item</li>
					</ul>
				</div>`,
				{
					queryAll: { itemEls: "li" },
				},
			)

			expectTypeOf(itemEls).toEqualTypeOf<NodeListOf<HTMLLIElement>>()
			//           ^?
		})
		test("recognize mixed query types", () => {
			const [divEl, { firstItemEl, itemEls }] = htmlTupleFn(
				`<div>
					<p>See the list</p>
					<ul>
						<li>first item</li>
						<li>second item</li>
					</ul>
				</div>`,
				{
					query: { firstItemEl: "li:first-of-type" },
					queryAll: { itemEls: "li" },
				},
			)

			expectTypeOf(firstItemEl).toEqualTypeOf<HTMLLIElement>()
			//           ^?
			expectTypeOf(itemEls).toEqualTypeOf<NodeListOf<HTMLLIElement>>()
			//           ^?
		})
	})
})

describe("htmlQuery", () => {
	test("recognize mixed query types", () => {
		const [divEl] = htmlTupleFn(`<div>
				<p>See the list</p>
				<ul>
					<li>first item</li>
					<li>second item</li>
				</ul>
			</div>
		`)

		const { firstItemEl, itemEls } = htmlQuery(divEl, {
			query: { firstItemEl: "li:first-of-type" },
			queryAll: { itemEls: "li" },
		})

		expectTypeOf(firstItemEl).toEqualTypeOf<HTMLLIElement>()
		//           ^?
		expectTypeOf(itemEls).toEqualTypeOf<NodeListOf<HTMLLIElement>>()
		//           ^?
	})
})

describe("htmlQuery", () => {
	test("recognize mixed query types", () => {
		const [divEl] = htmlTupleFn(`<div>
				<p>See the list</p>
				<ul>
					<li>first item</li>
					<li>second item</li>
				</ul>
			</div>
		`)

		const { firstItemEl, itemEls } = htmlQuery(divEl, {
			query: { firstItemEl: "li:first-of-type" },
			queryAll: { itemEls: "li" },
		})

		expectTypeOf(firstItemEl).toEqualTypeOf<HTMLLIElement>()
		//           ^?
		expectTypeOf(itemEls).toEqualTypeOf<NodeListOf<HTMLLIElement>>()
		//           ^?
	})
})
