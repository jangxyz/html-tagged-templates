import { buildSingleNode, queryContainer } from "./base.js";
import { assert } from "./utils.js";

export type AttrValue = EventListener | number | boolean;

/**
 * Only create single html node
 */
export function htmlSingleFn<T extends Node>(partialStrings: string): T;
export function htmlSingleFn<T extends Node>(partialStrings: (string | AttrValue)[]): T;
export function htmlSingleFn<T extends Node>(stringInput: string | (string | AttrValue)[]): T {
	const partialStrings: (string | AttrValue)[] = Array.isArray(stringInput) ? stringInput : [stringInput];

	// reduce callback attribute
	const markMap: Map<[string, string], EventListener> = new Map();
	const [{ htmlSoFar: htmlString }] = reduceCallbackAttribute(partialStrings, markMap);

	const [node, containerEl] = buildSingleNode(htmlString);

	// re-bind function marks
	for (const [[attrName, markName], callback] of markMap.entries()) {
		const selector = `[${attrName}=${markName}]`;

		// bind to first match
		const targetNode = queryContainer(containerEl, selector);
		if (!targetNode) {
			console.warn("failed finding element with attr:", attrName);
			continue;
		}

		targetNode.removeAttribute(attrName);
		targetNode.addEventListener(attrName.replace(/^on/i, ""), callback);
	}

	return node as unknown as T;
}

function reduceCallbackAttribute(
	partialStrings: (string | AttrValue)[],
	markMap: Map<[string, string], EventListener>,
) {
	const context: { htmlSoFar: string; insideTag: boolean; startAttr: '"' | "'" | null; lastAttrName: string | null } = {
		insideTag: false,
		startAttr: null,
		lastAttrName: null,
		htmlSoFar: "",
	};

	const reduceResult = partialStrings.reduce((memo, partial) => {
		let { htmlSoFar, insideTag, startAttr, lastAttrName } = memo;

		// part of html chunk
		if (typeof partial === "string") {
			const strChunk = partial;
			for (let i = 0; i < strChunk.length; i += 1) {
				const ch = strChunk[i];
				htmlSoFar += ch;

				// reducer
				switch (ch) {
					case "<":
						assert(!insideTag, "should be outside tag");
						insideTag = true;
						break;
					case ">":
						assert(insideTag, "should be inside tag");
						insideTag = false;
						break;
					case "=":
						// start attribute
						if (insideTag) {
							const next = strChunk[i + 1];
							if (next === '"' || next === "'") {
								startAttr = strChunk[i + 1] as typeof next;

								const spaceIndex = strChunk.slice(0, i).lastIndexOf(" ");
								assert(spaceIndex !== -1, "cannot find attribute name");
								lastAttrName = strChunk.slice(spaceIndex + 1, i);

								// skip
								htmlSoFar += next;
								i += 1;
								continue;
							}
						}
						break;
					case '"':
					case "'":
						// end attribute
						if (insideTag && startAttr) {
							assert(startAttr === ch, `attr should end with ${ch}`);
							startAttr = null;
							lastAttrName = null;
						}
						break;

					default:
				}
			}
		}
		// attribute callback function
		else if (typeof partial === "function") {
			assert(insideTag && startAttr && lastAttrName, "functions are allowed only as an attribute");

			// temporarily generate random function mark
			const markName = `f${crypto.randomUUID().replaceAll("-", "")}`;
			markMap.set([lastAttrName, markName], partial);

			htmlSoFar += markName;
		}
		// othe primitives, keep on chunking as string
		else {
			assert(insideTag && startAttr && lastAttrName, `${partial} is only allowed as an attribute`);

			htmlSoFar += String(partial);
		}

		return { htmlSoFar, insideTag, startAttr, lastAttrName };
	}, context);

	return [reduceResult, markMap] as const;
}
