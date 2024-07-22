import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";

import { html } from "./html_tagged_templates.js";

describe("typing", () => {
	describe("with generics", () => {
		test("can pass type as generic", () => {
			const divEl = html<HTMLDivElement>`<div>I am a DIV element</div>`;
			//    ^?
			expectTypeOf<HTMLDivElement>(divEl);

			const pEl = html<HTMLParagraphElement>`<p>I am a P element</p>`;
			//    ^?
			expectTypeOf<HTMLParagraphElement>(pEl);
		});

		test("can pass tag name as generic", () => {
			const divEl = html<"div">`<div>I am a DIV element</div>`;
			//    ^?
			expectTypeOf<HTMLDivElement>(divEl);

			const pEl = html<"p">`<p>I am a P element</p>`;
			//    ^?
			expectTypeOf<HTMLParagraphElement>(pEl);
		});
	});

	describe("inference", () => {
		test("can only return HTMLElement by default", () => {
			const divEl = html`<div>I am just an element</div>`;
			//    ^?
			expectTypeOf<HTMLElement>(divEl);
		});

		//// not possible before typescript supports it
		//test.skip("can figure out type of outermost element", () => {
		//	const divEl = html`<div>I am a DIV element</div>`;
		//	//    ^?
		//	expectTypeOf<HTMLDivElement>(divEl);
		//
		//	const pEl = html`<p>I am a P element</p>`;
		//	//    ^?
		//	expectTypeOf<HTMLParagraphElement>(pEl);
		//});
	});
});
