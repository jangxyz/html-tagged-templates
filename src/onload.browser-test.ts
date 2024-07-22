import { describe, expect, expectTypeOf, test } from "vitest"
import { htmlSingleFn } from "./html_single.js"
import { html } from "./html_tagged_templates.js"

const sourceUrls = [
	"http://placehold.it/350x150",
	"data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7",
	//"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAE0lEQVR42mJ8/+/PfwYGBgYGAAAN/wGfcCNYKwAAAABJRU5ErkJggg==",
]

describe("callbacks", () => {
	describe("img.onload should be assigned before src", () => {
		test("load image with document.createElement", () => {
			let loaded = false

			const sourceUrl = sourceUrls[1]

			const image = document.createElement("img")

			const imageLoadPr = new Promise((resolve, reject) => {
				let settled = false
				image.onerror = (ev) => {
					console.log("error", ev)
					settled = true
					reject(ev)
					clearTimeout(timeoutId)
				}
				image.onload = (ev) => {
					console.log(ev.type)
					loaded = true
					settled = true
					resolve(loaded)
					clearTimeout(timeoutId)
				}

				const timeoutId = setTimeout(() => {
					if (settled) return
					reject("timeout")
				}, 1000)
			})

			image.src = sourceUrl
			console.log("awaiting for image to load...")

			expect(imageLoadPr).resolves.toBe(true)
		})

		test("load image with htmlSingleFn", { timeout: 5_000 }, async () => {
			const sourceUrl = sourceUrls[1]

			let loaded = false
			let clicked = false

			let loadedResolvers: [() => void, (reason?: any) => void]
			const loadedPr = new Promise<void>((resolve, reject) => {
				loadedResolvers = [resolve, reject]

				setTimeout(() => {
					reject("timeout")
				}, 2_000)
			})

			const image = htmlSingleFn<HTMLImageElement>([
				"<img",
				[
					' onload="',
					() => {
						console.log("loaded.")
						loaded = true
						loadedResolvers[0]()
					},
					'"',
				],
				[
					' onclick="',
					() => {
						console.log("click.")
						clicked = true
					},
					'"',
				],
				[' src="', sourceUrl, '"'],
				"/>",
			])
			console.log(image.outerHTML)
			console.log("image:", image)

			//document.body.append(image)
			//const fragment = document.createDocumentFragment()
			//fragment.appendChild(image)

			//image.addEventListener("load", () => {
			//	console.log("load2")
			//	loaded = true
			//})
			//image.onload = () => {
			//	console.log("load3")
			//	loaded = true
			//}
			//image.setAttribute("src", sourceUrl)

			//const imageLoadPr = new Promise((resolve) => {
			//	setTimeout(() => {
			//		console.log("timeend:", { loaded, clicked })
			//		resolve(loaded)
			//	}, 2_000)
			//})

			//image.click()
			//expect(clicked).toBe(true)

			console.log("awaiting image load to resolve...")
			try {
				console.time("await")
				//await expect(imageLoadPr).resolves.toBe(undefined)
				await expect(loadedPr).resolves.toBe(undefined)
				expect(loaded).toBe(true)
			} finally {
				console.timeEnd("await")
				console.log("settled.")
			}
		})

		test("load image with html tagged template", { timeout: 5_000 }, async () => {
			const sourceUrl = sourceUrls[1]

			let loadedResolvers: [() => void, (reason?: any) => void]
			const loadedPr = new Promise<void>((resolve, reject) => {
				loadedResolvers = [resolve, reject]

				setTimeout(() => {
					reject("timeout")
				}, 2_000)
			})

			const image = html`
				<img onload="${() => {
					console.log("loaded.")
					loadedResolvers[0]()
				}}" src="${sourceUrl}" />` as HTMLImageElement

			console.log(image.outerHTML)
			console.log("image:", image)

			document.body.append(image)

			console.log("awaiting image load to resolve...")
			try {
				console.time("await")
				await expect(loadedPr).resolves.toBe(undefined)
			} finally {
				console.timeEnd("await")
				console.log("settled.")
			}
		})
	})
})
