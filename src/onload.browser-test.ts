import { describe, expect, expectTypeOf, test } from "vitest"
import { htmlSingleFn } from "./html_single.js"

const sourceUrls = [
	"http://placehold.it/350x150",
	"data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7",
	//"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAE0lEQVR42mJ8/+/PfwYGBgYGAAAN/wGfcCNYKwAAAABJRU5ErkJggg==",
]

describe("callbacks", () => {
	describe("img.onload should be assigned before src", () => {
		test("document.createElement", () => {
			let loaded = false

			//const sourceUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAE0lEQVR42mJ8/+/PfwYGBgYGAAAN/wGfcCNYKwAAAABJRU5ErkJggg=="
			//const sourceUrl = "http://placehold.it/350x150"
			const sourceUrl =
				"data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7"

			//const image = htmlSingleFn([
			//	"<img",
			//	//[ ' onload="', (ev) => { console.log("loaded.") loaded = true }, '"', ],
			//	//[' src="', sourceUrl, '"'],
			//	"/>",
			//])
			//

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

		test("htmlSingleFn", { timeout: 5000 }, async () => {
			let loaded = false

			const sourceUrl = sourceUrls[2]

			const image = htmlSingleFn([
				"<img",
				[
					' onload="',
					() => {
						console.log("loaded.")
						loaded = true
					},
					'"',
				],
				[' src="', sourceUrl, '"'],
				"/>",
			])

			const imageLoadPr = new Promise((resolve) => {
				setTimeout(() => {
					resolve(loaded)
				}, 100)
			})

			expect(imageLoadPr).resolves.toBe(true)
		})
	})
})
