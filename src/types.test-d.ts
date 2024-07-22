import { describe, expect, expectTypeOf, test } from "vitest";
import type { DeterminedNode } from "./base.js";

describe("types", () => {
	describe("DeterminedNode returns corresponding Node type", () => {
		test("html element", () => {
			type T_Result = DeterminedNode<"<div>abc</div>">;
			expectTypeOf<T_Result>().toEqualTypeOf<HTMLDivElement>();
		});

		test("comment node", () => {
			type T_Result = DeterminedNode<"<!-- this is a comment -->">;
			expectTypeOf<T_Result>().toEqualTypeOf<Comment>();
		});

		test("text node", () => {
			type T_Result = DeterminedNode<"there is no element here">;
			expectTypeOf<T_Result>().toEqualTypeOf<Text>();
		});

		test("any node", () => {
			type T_Result = DeterminedNode<"<invalid node>">;
			expectTypeOf<T_Result>().toEqualTypeOf<Node>();
		});
	});

	describe("SpecStringInputs", () => {
		//
	});
});
