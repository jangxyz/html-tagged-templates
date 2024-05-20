import {
	buildSingleNode,
	queryContainer,
	type ContainerElement,
	type SpecifiedString,
	type DeterminedNodeOnString,
	type PartialChunk,
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
	//partialInput: string | (string | AttrValue)[],
	partialInput: SpecifiedString<T> | [SpecifiedString<T>, ...PartialChunk[]],
): DeterminedNodeOnString<T> {
	return _htmlSingleFn(partialInput)[0];
}

export function _htmlSingleFn<T extends Node | string>(
	partialInput: SpecifiedString<T> | [SpecifiedString<T>, ...PartialChunk[]],
) {
	const partials: [SpecifiedString<T>, ...PartialChunk[]] = Array.isArray(partialInput) ? partialInput : [partialInput];

	// reduce partial strings into a single html string, merging into a single html string.
	// temporarily marking callback functions with unique markers.
	const callbackMarkMap: Map<[string, string], EventListener> = new Map();
	const childMarkMap: Map<string, Node> = new Map();
	const [htmlString] = reducePartials(partials, callbackMarkMap, childMarkMap);

	// build node from string
	const [node, containerEl] = buildSingleNode(htmlString);

	// now re-bind marks to function callbacks
	bindMarks(containerEl, callbackMarkMap, childMarkMap);

	return [node as DeterminedNodeOnString<T>, containerEl] as const;
}

/**
 * Reduce partial strings into a single html, with following:
 *  - verify that attr values appear only on attribute value positions.
 *  - mark callback functions with temporal string.
 */
export function reducePartials<T extends string = string>(
	partials: [T, ...PartialChunk[]],
	callbackMarkMap?: Map<[string, string], EventListener>,
	childrenMarkMap?: Map<string, Node>,
) {
	const _callbackMarkMap = callbackMarkMap ?? new Map<[string, string], EventListener>();
	const _childrenMarkMap = childrenMarkMap ?? new Map<string, Node>();

	type Context = { htmlSoFar: string; insideTag: boolean; startAttr: '"' | "'" | null; lastAttrName: string | null };
	const context: Context = {
		insideTag: false,
		startAttr: null,
		lastAttrName: null,
		htmlSoFar: "",
	};

	const reducePartial = (currentContext: Context, partial: PartialChunk): Context => {
		let { htmlSoFar, insideTag, startAttr, lastAttrName } = currentContext;

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
			const markName = `f${crypto.randomUUID()}`;
			_callbackMarkMap.set([lastAttrName, markName], partial);

			htmlSoFar += markName;
		}
		// node is onyl available as a child node
		else if (partial instanceof Node) {
			assert(!insideTag, "nodes are allowed only as a child");

			// temporarily generate random function mark.
			// this will be replaced by actual functions later.
			const markId = `n${crypto.randomUUID()}`;
			_childrenMarkMap.set(markId, partial);

			htmlSoFar += `<span id="${markId}"></span>`;
		}
		// iteratively apply with current context.
		// NOTE other context values beside `htmlSoFar` does not change
		else if (Array.isArray(partial)) {
			const { htmlSoFar: finalHtml } = partial.reduce((partialContext, partialItem) => {
				return reducePartial(partialContext, partialItem);
			}, currentContext);

			htmlSoFar = finalHtml;
		}
		// othe primitives, keep on chunking as string
		else {
			assert(insideTag && startAttr && lastAttrName, `${partial} is only allowed as an attribute`);

			htmlSoFar += String(partial);
		}

		return { htmlSoFar, insideTag, startAttr, lastAttrName };
	};

	const reduceResult = partials.reduce(reducePartial, context);

	return [reduceResult.htmlSoFar as T, _callbackMarkMap, _childrenMarkMap, reduceResult] as const;
}

export function bindMarks(
	containerEl: ContainerElement,
	callbackMarkMap: Map<[string, string], EventListener>,
	childMarkMap: Map<string, Node>,
) {
	// callback marks
	for (const [[attrName, markName], callback] of callbackMarkMap.entries()) {
		// bind to first match
		const selector = `[${attrName}=${markName}]`;
		const targetNode = queryContainer(containerEl, selector);
		if (!targetNode) {
			console.warn("failed finding element with attr:", attrName);
			continue;
		}

		targetNode.removeAttribute(attrName);
		targetNode.addEventListener(attrName.replace(/^on/i, ""), callback);
	}

	// child marks
	for (const [markId, node] of childMarkMap.entries()) {
		const selector = `#${markId}`;
		const targetNode = queryContainer(containerEl, selector);
		if (!targetNode) {
			console.warn("failed finding element with id:", markId);
			continue;
		}

		targetNode.parentElement?.replaceChild(node, targetNode);
	}
}
