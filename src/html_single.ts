import {
	isHTMLElement,
	queryContainer,
	buildSingleNode,
	type ContainerElement,
	type SpecString,
	type DeterminedNodeOnString,
	type PartialChunk,
	type SpecStringInputs,
	type HtmlSingleOptions,
} from "./base.js";

import { assert } from "./utils.js";
import { AttrValue } from "./utils/html-types.js";

const REMOVE_ATTR_VALUE = Symbol.for("remove-attr-value");
const REMOVE_ATTR = Symbol.for("remove-attribute");

/**
 * Create single html node from (multiples of) string.
 */

// overload - accept single string
//export function htmlSingleFn<T extends Node | string>(htmlString: T extends string ? T : string): DeterminedNodeOnString<T>;

// overload - accept array of strings
//export function htmlSingleFn<T extends Node | string>(partialStrings: [T extends string ? T : string, ...RestAttrOrString]): DeterminedNodeOnString<T>;

// actual implementation
export function htmlSingleFn<T extends Node | string>(
	partialInput: SpecString<T> | SpecStringInputs<T>,
	options?: Partial<HtmlSingleOptions>,
): DeterminedNodeOnString<T> {
	return _htmlSingleFn(partialInput, options)[0];
}

export function _htmlSingleFn<T extends Node | string>(
	partialInput: SpecString<T> | SpecStringInputs<T>,
	options?: Partial<HtmlSingleOptions>,
) {
	const partials: SpecStringInputs<T> = Array.isArray(partialInput) ? partialInput : [partialInput];

	// reduce partial strings into a single html string, merging into a single html string.
	// temporarily marking callback functions with unique markers.
	const [htmlString, attributeMarkMap, callbackMarkMap, childNodeMarkMap] = reducePartialChunks(partials);

	// build node from string
	const [node, containerEl] = buildSingleNode(htmlString, options);

	// now re-bind marks to function callbacks
	bindMarks(containerEl, attributeMarkMap, callbackMarkMap, childNodeMarkMap);

	return [node as DeterminedNodeOnString<T>, containerEl] as const;
}

// typical html element build function

//type Attributes = Record<string, string | number | boolean | EventListener>;
//type ElementAttributes = Record<string, string | number | boolean> & GlobalEventHandlers;

/**
 * Reduce partial strings into a single html, with following:
 *  - verify that attr values appear only on attribute value positions.
 *  - mark callback functions with temporal string.
 */
function reducePartialChunks<T extends string = string>(partials: [T, ...PartialChunk[]]) {
	const attributeMarkMap = new Map<[string, string], string | number | boolean>();
	const callbackMarkMap = new Map<[string, string], EventListener>();
	const childNodeMarkMap = new Map<string, Node>();

	type Context = {
		htmlSoFar: string;
		_insideTag: boolean;
		insideTagIndex: [number, number, number] | null;
		attrStartIndex: [number, number, number] | null;
		lastAttrValue: string | AttrValue | null;
		_attrStartMark: '"' | "'" | null;
		_lastAttrName: string | null;
		endAttrAs: null | typeof REMOVE_ATTR_VALUE | typeof REMOVE_ATTR;
	};
	const initialContext: Context = {
		insideTagIndex: null,
		_insideTag: false,
		attrStartIndex: null,
		_attrStartMark: null,
		_lastAttrName: null,
		lastAttrValue: null,
		endAttrAs: null,
		htmlSoFar: "",
	};

	function reducer(currentContext: Context, chunk: PartialChunk, chunkIndex: number, entire: PartialChunk[]): Context {
		let {
			htmlSoFar,
			insideTagIndex,
			attrStartIndex,
			lastAttrValue,
			endAttrAs,
			// biome-ignore lint/complexity/noUselessRename: <explanation>
			_insideTag: _insideTag,
			// biome-ignore lint/complexity/noUselessRename: <explanation>
			_attrStartMark: _attrStartMark,
			// biome-ignore lint/complexity/noUselessRename: <explanation>
			_lastAttrName: _lastAttrName,
		} = currentContext;
		let insideTag = Boolean(insideTagIndex);
		//assert(insideTag === _insideTag, `validation error: ${insideTag} !== ${_insideTag}, ${JSON.stringify({ entire, insideTagIndex })}`,);
		//let attrStartMark = attrStartIndex ? (entire[attrStartIndex[0]] as string)[attrStartIndex[1]] : null;
		let attrStartMark = applyChunkIndex(entire, attrStartIndex);
		assert(attrStartMark === _attrStartMark, `validation error: ${attrStartMark} !== ${_attrStartMark}`, (err) => {
			console.error(err.message, { attrStartMark, _attrStartMark, entire, insideTagIndex });
		});

		let lastAttrName = applyHtmlIndex(htmlSoFar, attrStartIndex, /([-\w]+)=['"]?$/);
		assert(lastAttrName === _lastAttrName, `lastAttrName mismatch: ${lastAttrName} !== ${_lastAttrName}`, (err) => {
			console.error(err.message, { lastAttrName, _lastAttrName, attrStartIndex, entire, htmlSoFar });
		});

		// part of html chunk
		if (typeof chunk === "string") {
			for (let i = 0; i < chunk.length; i += 1) {
				const ch = chunk[i];
				htmlSoFar += ch;

				// manage node/attribute state
				switch (ch) {
					case "<":
						assert(!insideTag, `should be outside tag: '${chunk.slice(i - 5, i + 5)}'`);
						insideTagIndex = [chunkIndex, i, htmlSoFar.length];
						insideTag = Boolean(insideTagIndex); // true
						_insideTag = true;
						break;
					case ">":
						assert(insideTag, `should be inside tag: '${chunk.slice(i - 5, i + 5)}'`, (err) => {
							//console.error( err.message, JSON.stringify(chunk.slice(i - 5, i + 5)), JSON.stringify({ chunkIndex, i, entire, insideTag, insideTagIndex, _insideTag, }),);
						});
						insideTagIndex = null;
						insideTag = Boolean(insideTagIndex); // false
						_insideTag = false;
						break;
					case "=":
						// start attribute
						if (insideTag) {
							const next = chunk[i + 1];
							if (next === '"' || next === "'") {
								attrStartIndex = [chunkIndex, i + 1, htmlSoFar.length + 1];
								//attrStartMark = attrStartIndex ? (entire[attrStartIndex[0]] as string)[attrStartIndex[1]] : null;
								attrStartMark = applyChunkIndex(entire, attrStartIndex);
								_attrStartMark = chunk[i + 1] as typeof next;
								endAttrAs = null;
								lastAttrValue = null;

								const spaceIndex = htmlSoFar.lastIndexOf(" ");
								_lastAttrName = htmlSoFar.slice(spaceIndex + 1, -1);

								//const _lastAttrName = applyChunkIndex( entire, attrStartIndex, (_chunk, _chunkIndex, _chunkOffset, offset) => { const slice = htmlSoFar.slice(0, offset); const md = slice.match(/([-\w]+)=$/); return md?.[1]; },);
								lastAttrName = applyHtmlIndex(htmlSoFar, attrStartIndex, /([-\w]+)=$/);
								assert(
									lastAttrName === _lastAttrName,
									`lastAttrName mismatch: ${lastAttrName} !== ${_lastAttrName}`,
									(err) => {
										console.error(err.message, { lastAttrName, _lastAttrName, attrStartIndex, entire, htmlSoFar });
									},
								);

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
						if (insideTag && attrStartMark) {
							assert(attrStartMark === ch, `attr should end with ${ch}`);
							assert(lastAttrName, `should have valid attr name, but: ${lastAttrName}`);

							// TODO: rename "attr=value" to "data-attr=MARK"

							// figure out attr value
							if (lastAttrValue === null) {
								const attrValue = applyHtmlIndex(
									htmlSoFar,
									[null, null, htmlSoFar.length],
									new RegExp(`=${attrStartMark}([^${ch}]*)${ch}$`),
								);
								assert(attrValue, "cannot find attr value");
								lastAttrValue = attrValue;
								//console.log("🚀 ~ file: html_single.ts:198 ~ lastAttrValue for:", lastAttrName, lastAttrValue);
							}

							if (typeof lastAttrValue !== "function") {
								const markId = `A${crypto.randomUUID()}`;
								htmlSoFar = htmlSoFar.replace(
									new RegExp(`(${lastAttrName})=${attrStartMark}.*${ch}$`),
									`data-$1=${attrStartMark}${markId}${ch}`,
								);
								//console.log("🚀 ~ file: html_single.ts:181 ~ reducer ~ newHtml:", newHtml);
								attributeMarkMap.set([lastAttrName, markId], lastAttrValue);
							}

							//// value was true, so we only leave attribute name
							////if (endAttrAs === REMOVE_ATTR_VALUE) {
							//if (lastAttrValue === true) {
							//	// `checked=${true}` => "checked"
							//	htmlSoFar = htmlSoFar.replace(new RegExp(`=${attrStartMark.repeat(2)}$`), "");
							//}
							//// value was false, so we remove attribute completely
							////else if (endAttrAs === REMOVE_ATTR) {
							//else if (lastAttrValue === false) {
							//	// `checked=${false}` => ""
							//	htmlSoFar = htmlSoFar.replace(new RegExp(`${lastAttrName}=${attrStartMark.repeat(2)}$`), "");
							//}

							// update state

							attrStartIndex = null;
							attrStartMark = attrStartIndex ? (entire[attrStartIndex[0]] as string)[attrStartIndex[1]] : null;
							_attrStartMark = null;
							_lastAttrName = null;
							lastAttrName = applyHtmlIndex(htmlSoFar, attrStartIndex, /([-\w]+)=$/); // null
							assert(
								lastAttrName === _lastAttrName,
								`lastAttrName mismatch: ${lastAttrName} !== ${_lastAttrName}`,
								(err) => {
									console.error(err.message, { lastAttrName, _lastAttrName, attrStartIndex, entire, htmlSoFar });
								},
							);
						}
						break;
				}
			}
		}
		// attribute callback function
		else if (typeof chunk === "function") {
			assert(insideTag && attrStartMark && lastAttrName, "functions are allowed only as an attribute");

			lastAttrValue = chunk;

			// temporarily generate random function mark.
			// this will be replaced by actual functions later.
			const markId = `f${crypto.randomUUID()}`;
			callbackMarkMap.set([lastAttrName, markId], chunk);

			htmlSoFar += markId;
		}
		// boolean attribute
		else if (typeof chunk === "boolean") {
			assert(insideTag && attrStartMark && lastAttrName, "boolean values are allowed only as an attribute");

			// TODO: while some attributes like "checked" have boolean values,
			// some attributes have string "true", "false" values (aria-pressed)
			// it may be better if we could distinguish all the attributes, and apply them

			// leave only attribute, without any value (<input type="checkbox" checked />)
			if (chunk) {
				// mark special symbol so the value could be removed later
				//startAttr = startAttr === '"' ? REMOVE_ATTR_VALUE_DOUBLE : REMOVE_ATTR_VALUE_SINGLE;
				lastAttrValue = true;
				endAttrAs = REMOVE_ATTR_VALUE;
			}
			// remove attribute
			else {
				// mark special symbol so the value could be removed later
				//startAttr = startAttr === '"' ? REMOVE_ATTR_DOUBLE : REMOVE_ATTR_SINGLE;
				lastAttrValue = false;
				endAttrAs = REMOVE_ATTR;
			}
		}
		// node is only available as a child node
		else if (chunk instanceof Node) {
			assert(!insideTag, "nested nodes are allowed only as a child");

			if (isHTMLElement(chunk)) {
				const tagName = chunk.tagName;

				// temporarily generate random function mark.
				// this will be replaced by actual functions later.
				const markId = `n${crypto.randomUUID()}`;
				childNodeMarkMap.set(markId, chunk);

				htmlSoFar += `<${tagName} id="${markId}"></${tagName}>`;
			}
		}
		// iteratively apply with current context.
		// NOTE other context values beside `htmlSoFar` does not change
		else if (Array.isArray(chunk)) {
			const { htmlSoFar: finalHtml } = chunk.reduce((partialContext, partialItem) => {
				// FIXME:
				return reducer(partialContext, partialItem);
			}, currentContext);

			htmlSoFar = finalHtml;
		}
		// other primitives, keep on chunking as string
		else {
			assert(!insideTag || (attrStartMark && lastAttrName), `${chunk} is only allowed as an attribute`);

			lastAttrName = String(chunk);
			htmlSoFar += String(chunk);
		}

		return {
			htmlSoFar,
			insideTagIndex,
			attrStartIndex,
			lastAttrValue,
			endAttrAs,
			_insideTag: _insideTag,
			_attrStartMark: _attrStartMark,
			_lastAttrName: _lastAttrName,
		};
	}

	const resultContext = partials.reduce(reducer, initialContext);
	const { htmlSoFar: html } = resultContext;

	return [html as T, attributeMarkMap, callbackMarkMap, childNodeMarkMap, resultContext] as const;
}

export function bindMarks(
	containerEl: ContainerElement,
	attributeMarkMap: Map<[string, string], string | number | boolean>,
	callbackMarkMap: Map<[string, string], EventListener>,
	childNodeMarkMap: Map<string, Node>,
) {
	//console.log("🚀 ~ file: html_single.ts:331 ~ :", { attributeMarkMap, callbackMarkMap, childNodeMarkMap, html: containerEl.innerHTML });

	// apply callback marks
	for (const [[attrName, markId], callback] of callbackMarkMap.entries()) {
		// bind to first match
		const selector = `[${attrName}=${markId}]`;
		const targetNode = queryContainer(containerEl, selector);
		if (!targetNode) {
			console.warn("failed finding element with attr:", attrName);
			continue;
		}

		targetNode.removeAttribute(attrName);
		targetNode.addEventListener(attrName.replace(/^on/i, ""), callback);
	}

	// apply attribute marks
	for (const [[attrName, markId], attrValue] of attributeMarkMap.entries()) {
		// bind to first match
		const selector = `[data-${attrName}=${markId}]`;
		const targetNode = queryContainer(containerEl, selector);
		if (!targetNode) {
			console.warn("failed finding element with attr:", attrName);
			continue;
		}

		targetNode.removeAttribute(`data-${attrName}`);
		if (attrValue === true) {
			targetNode.setAttribute(attrName, "");
		} else if (attrValue === false) {
			targetNode.removeAttribute(attrName);
		} else {
			targetNode.setAttribute(attrName, String(attrValue));
		}
	}

	// apply child marks
	for (const [markId, node] of childNodeMarkMap.entries()) {
		const selector = `#${markId}`;
		const targetNode = queryContainer(containerEl, selector);
		if (!targetNode) {
			console.warn("failed finding element with id in element:", markId);
			continue;
		}

		targetNode.parentElement?.replaceChild(node, targetNode);
	}
}

function applyChunkIndex(entire: PartialChunk[], indexTuple: [number, number, number] | null): string | null;
function applyChunkIndex<T>(
	entire: PartialChunk[],
	indexTuple: [number, number, number] | null,
	callback: (chunk: string, chunkIndex: number, chunkOffset: number, offset: number) => T,
): T | null;
function applyChunkIndex<T>(
	entire: PartialChunk[],
	indexTuple: [number, number, number] | null,
	callback?: (chunk: string, chunkIndex: number, chunkOffset: number, offset: number) => T,
): string | T | null {
	if (!indexTuple) return null;

	const [chunkIndex, chunkOffset, offset] = indexTuple;

	const chunk = entire[chunkIndex];
	if (typeof chunk !== "string") {
		throw Error("chunk is not a string");
	}

	if (callback) {
		return callback(chunk, chunkIndex, chunkOffset, offset);
	}

	return chunk[chunkOffset];
}

function applyHtmlIndex(
	htmlSoFar: string,
	indexTuple: [any, any, number] | null,
	pattern?: RegExp,
): string | null | undefined {
	if (!indexTuple) return null;

	const [offset] = indexTuple.slice(-1);

	const pat = pattern ?? /([-\w]+)$/;

	//const slice = chunk.slice(0, chunkOffset);
	const slice = htmlSoFar.slice(0, offset);
	const md = slice.match(pat);

	return md?.[1];
}
