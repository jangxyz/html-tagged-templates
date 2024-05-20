import {
	buildSingleNode,
	queryContainer,
	type ContainerElement,
	type SpecifiedString,
	type DeterminedNodeOnString,
	type RestAttrOrStrings,
	type AttrValue,
} from "./base.js";
import { assert } from "./utils.js";

/**
 * Create single html node from (multiples of) string.
 */

// overload - accept single string
//export function htmlSingleFn<T extends Node | string>(htmlString: T extends string ? T : string): DeterminedNodeOnString<T>;

// overload - accept array of strings
//export function htmlSingleFn<T extends Node | string>(partialStrings: [T extends string ? T : string, ...RestAttrOrString]): DeterminedNodeOnString<T>;

// actual implementation
export function htmlSingleFn<T extends Node | string>(
	//stringInput: string | (string | AttrValue)[],
	stringInput: SpecifiedString<T> | [SpecifiedString<T>, ...RestAttrOrStrings],
): DeterminedNodeOnString<T> {
	const partialStrings: [SpecifiedString<T>, ...RestAttrOrStrings] = Array.isArray(stringInput)
		? stringInput
		: [stringInput];

	// reduce partial strings into a single html string, merging into a single html string.
	// temporarily marking callback functions with unique markers.
	const markMap: Map<[string, string], EventListener> = new Map();
	const [htmlString] = reducePartials(partialStrings, markMap);

	// build node from string
	const [node, containerEl] = buildSingleNode(htmlString);

	// now re-bind marks to function callbacks
	bindCallbackMarks(containerEl, markMap);

	return node as DeterminedNodeOnString<T>;
}

/**
 * Reduce partial strings into a single html, with following:
 *  - verify that attr values appear only on attribute value positions.
 *  - mark callback functions with temporal string.
 */
export function reducePartials<T extends string = string>(
	partialStrings: [T, ...(AttrValue | string)[]],
	markMap?: Map<[string, string], EventListener>,
) {
	const _markMap = markMap ?? new Map<[string, string], EventListener>();

	type Context = { htmlSoFar: string; insideTag: boolean; startAttr: '"' | "'" | null; lastAttrName: string | null };
	const context: Context = {
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

			// temporarily generate random function mark.
			// this will be replaced by actual functions later.
			const markName = `f${crypto.randomUUID().replaceAll("-", "")}`;
			_markMap.set([lastAttrName, markName], partial);

			htmlSoFar += markName;
		}
		// othe primitives, keep on chunking as string
		else {
			assert(insideTag && startAttr && lastAttrName, `${partial} is only allowed as an attribute`);

			htmlSoFar += String(partial);
		}

		return { htmlSoFar, insideTag, startAttr, lastAttrName };
	}, context);

	return [reduceResult.htmlSoFar as T, _markMap, reduceResult] as const;
}

export function bindCallbackMarks(containerEl: ContainerElement, markMap: Map<[string, string], EventListener>) {
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
}

export function htmlTupleFn<T extends Node | string>(
	stringInput: SpecifiedString<T> | [SpecifiedString<T>, ...RestAttrOrStrings],
): [DeterminedNodeOnString<T>, {}] {
	const element = htmlSingleFn(stringInput);
	return [element, {}];
}
