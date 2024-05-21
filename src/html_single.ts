import {
	buildSingleNode,
	queryContainer,
	type ContainerElement,
	type SpecString,
	type DeterminedNodeOnString,
	type PartialChunk,
	type SpecStringInputs,
	DEFAULT_WHITESPACE_OPTION,
} from "./base.js";
import { assert } from "./utils.js";

const REMOVE_ATTR_VALUE = Symbol.for("remove-attr-value");
const REMOVE_ATTR = Symbol.for("remove-attribute");

type Options = {
	trim: boolean;
	stripWhitespace: boolean;
};

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
	partialInput: SpecString<T> | SpecStringInputs<T>,
	options?: Partial<Options>,
): DeterminedNodeOnString<T> {
	return _htmlSingleFn(partialInput, options)[0];
}

export function _htmlSingleFn<T extends Node | string>(
	partialInput: SpecString<T> | SpecStringInputs<T>,
	options?: Partial<Options>,
) {
	const partials: SpecStringInputs<T> = Array.isArray(partialInput) ? partialInput : [partialInput];

	// reduce partial strings into a single html string, merging into a single html string.
	// temporarily marking callback functions with unique markers.
	const [htmlString, callbackMarkMap, childMarkMap] = reducePartialChunks(partials, options);

	// build node from string
	const [node, containerEl] = buildSingleNode(htmlString, options);

	// now re-bind marks to function callbacks
	bindMarks(containerEl, callbackMarkMap, childMarkMap);

	return [node as DeterminedNodeOnString<T>, containerEl] as const;
}

/**
 * Reduce partial strings into a single html, with following:
 *  - verify that attr values appear only on attribute value positions.
 *  - mark callback functions with temporal string.
 */
export function reducePartialChunks<T extends string = string>(partials: [T, ...PartialChunk[]]) {
	const callbackMarkMap = new Map<[string, string], EventListener>();
	const childrenMarkMap = new Map<string, Node>();

	type Context = {
		htmlSoFar: string;
		insideTag: boolean;
		startAttr: '"' | "'" | null;
		lastAttrName: string | null;
		endAttr: null | typeof REMOVE_ATTR_VALUE | typeof REMOVE_ATTR;
	};
	const initialContext: Context = {
		insideTag: false,
		startAttr: null,
		lastAttrName: null,
		endAttr: null,
		htmlSoFar: "",
	};

	const reducePartial = (
		currentContext: Context,
		partial: PartialChunk,
		_index?: number,
		_entire?: PartialChunk[],
	): Context => {
		let { htmlSoFar, insideTag, startAttr, lastAttrName, endAttr } = currentContext;

		// part of html chunk
		if (typeof partial === "string") {
			const strChunk = partial;
			for (let i = 0; i < strChunk.length; i += 1) {
				const ch = strChunk[i];
				htmlSoFar += ch;

				// reducer
				switch (ch) {
					case "<":
						assert(!insideTag, `should be outside tag: '${strChunk.slice(i - 5, i + 5)}'`);
						insideTag = true;

						break;
					case ">":
						assert(insideTag, `should be inside tag: '${strChunk.slice(i - 5, i + 5)}'`);
						insideTag = false;
						break;
					case "=":
						// start attribute
						if (insideTag) {
							const next = strChunk[i + 1];
							if (next === '"' || next === "'") {
								startAttr = strChunk[i + 1] as typeof next;
								endAttr = null;

								const spaceIndex = htmlSoFar.lastIndexOf(" ");
								lastAttrName = htmlSoFar.slice(spaceIndex + 1, -1);

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

							// value was true, so we only leave attribute name
							if (endAttr === REMOVE_ATTR_VALUE) {
								htmlSoFar = htmlSoFar.replace(new RegExp(`=${startAttr.repeat(2)}$`), "");
							}
							// value was false, so we remove attribute completely
							else if (endAttr === REMOVE_ATTR) {
								htmlSoFar = htmlSoFar.replace(new RegExp(`${lastAttrName}=${startAttr.repeat(2)}$`), "");
							}

							startAttr = null;
							lastAttrName = null;
						}
						break;
				}
			}
		}
		// attribute callback function
		else if (typeof partial === "function") {
			assert(insideTag && startAttr && lastAttrName, "functions are allowed only as an attribute");

			// temporarily generate random function mark.
			// this will be replaced by actual functions later.
			const markName = `f${crypto.randomUUID()}`;
			callbackMarkMap.set([lastAttrName, markName], partial);

			htmlSoFar += markName;
		}
		// boolean attribute
		else if (typeof partial === "boolean") {
			assert(insideTag && startAttr && lastAttrName, "boolean values are allowed only as an attribute");

			// TODO: while some attributes like "checked" have boolean values,
			// some attributes have string "true", "false" values (aria-pressed)
			// it may be better if we could distinguish all the attributes, and apply them

			// leave only attribute without any value
			if (partial) {
				// mark special symbol so the value could be removed later
				//startAttr = startAttr === '"' ? REMOVE_ATTR_VALUE_DOUBLE : REMOVE_ATTR_VALUE_SINGLE;
				endAttr = REMOVE_ATTR_VALUE;
			}
			// remove attribute
			else {
				// mark special symbol so the value could be removed later
				//startAttr = startAttr === '"' ? REMOVE_ATTR_DOUBLE : REMOVE_ATTR_SINGLE;
				endAttr = REMOVE_ATTR;
			}
		}
		// node is onyl available as a child node
		else if (partial instanceof Node) {
			assert(!insideTag, "nodes are allowed only as a child");

			// temporarily generate random function mark.
			// this will be replaced by actual functions later.
			const markId = `n${crypto.randomUUID()}`;
			childrenMarkMap.set(markId, partial);

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

		return { htmlSoFar, insideTag, startAttr, lastAttrName, endAttr };
	};

	const resultContext = partials.reduce(reducePartial, initialContext);

	return [resultContext.htmlSoFar as T, callbackMarkMap, childrenMarkMap, resultContext] as const;
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
