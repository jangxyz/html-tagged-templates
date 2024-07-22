/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
	test: {
		//include: [
		//	"**/*.{test,spec}.?(c|m)[jt]s?(x)", // default
		//	"**/*.type-{test,spec}.?(c|m)[jt]s?(x)",
		//],
		//poolMatchGlobs: [
		//	["**/*.{test,spec}.?(c|m)[jt]s?(x)", "threads"],
		//	["**/*.type-{test,spec}.?(c|m)[jt]s?(x)", "typescript"],
		//],

		//environment: 'happy-dom',
		environment: "jsdom",
		environmentOptions: {
			jsdom: {
				resources: "usable",
			},
		},
	},
});
