import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
	// This will keep running your existing tests.
	// If you don't need to run those in Node.js anymore,
	// You can safely remove it from the workspace file
	// Or move the browser test configuration to the config file.
	//"vitest.config.ts",
	{
		extends: "vitest.config.ts",
		test: {
			name: "node",
			include: ["src/**/*.test.ts"],
		},
	},
	{
		extends: "vitest.config.ts",
		test: {
			name: "browser",
			include: ["src/**/*.browser-test.ts"],
			browser: {
				provider: "playwright",
				enabled: !true,
				name: "chromium",
				//headless: false,
				// https://playwright.dev
				providerOptions: {},
			},
		},
	},
]);
