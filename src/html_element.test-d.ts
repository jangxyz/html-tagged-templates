import { describe, expect, expectTypeOf, test } from "vitest"
import { htmlElement } from "./html_element.js"

describe("htmlElement", () => {
	describe("typing", () => {
		describe("infer node type", () => {
			test("recognize element from literal", () => {
				const el = htmlElement("div", {}, "Some element")
				//    ^?
				expectTypeOf(el).toEqualTypeOf<HTMLDivElement>()
			})
		})

		describe("infer event type", () => {
			let clicked = false
			const button = htmlElement(
				"button",
				{
					name: "my-button",
					onclick: (event) => {
						//       ^?
						expectTypeOf(event).toEqualTypeOf<MouseEvent>()
						clicked = true
					},
				},
				"click me",
			)

			button.click()
		})
	})
})
