import type {
	HtmlTagName,
	ExtractElementPrefix,
	CommentPrefixedString,
	NotStartWithLeftAngleBracket,
	CheckTextPrefix,
	CheckCommentPrefix,
} from "./utils.js";
import type { IfNotNeverThen } from "./utils/types_util.js";

export type NestedQuery = Record<string, string>;

export type ContainerElement = HTMLElement | HTMLTemplateElement;

// given a string generic type, determine which Node it would be,
// among one of: [HTMLElement, Comment, Text, Node]
export type DeterminedNode<S extends string> = IfNotNeverThen<
	ExtractElementPrefix<S>,
	HTMLElementTagNameMap[ExtractElementPrefix<S>],
	S extends CommentPrefixedString ? Comment : S extends NotStartWithLeftAngleBracket<S> ? Text : Node
>;
export type DeterminedNodeOnString<T extends Node | string> = T extends string ? DeterminedNode<T> : T;

export type AttrValue = number | boolean | EventListener;

export type SpecString<T extends Node | string> = T extends string ? T : string;
export type PartialChunk = string | AttrValue | Node | PartialChunk[];
export type SpecStringInputs<T extends Node | string> = [SpecString<T>, ...PartialChunk[]];

//type StringToNode<T extends string> = T extends HtmlTagName
//	? HTMLElementTagNameMap[T]
//	: T extends CheckCommentPrefix<T>
//		? Comment
//		: T extends CheckTextPrefix<T>
//			? Text
//			: Node;
//

export const DEFAULT_TRIM_OPTION = true;
export const DEFAULT_WHITESPACE_OPTION = true;

/**
 * Build a single element from an html string. Will reuse the container element if provided.
 */

//// overload: HTMLElement
//export function buildSingleNode<T extends HtmlTagName>( htmlString: ElementPrefixedString<T>,): [HTMLElementTagNameMap[T], ContainerElement];
//// overload: Comment
//export function buildSingleNode<T extends string>(htmlString: CheckCommentPrefix<T>): [Comment, ContainerElement];
//// overload: other - Text
//export function buildSingleNode<T extends string>(htmlString: CheckTextPrefix<T>): [Text, ContainerElement];
//// overload: default
//export function buildSingleNode<T extends Node>(htmlString: string): [T, ContainerElement];

// actual implementation
export function buildSingleNode<T extends Node | string>(
	htmlString: string,
	options?: Partial<{ trim: boolean; stripWhitespace: boolean }>,
): [DeterminedNodeOnString<T>, ContainerElement] {
	const { trim, stripWhitespace } = {
		trim: DEFAULT_TRIM_OPTION,
		stripWhitespace: DEFAULT_WHITESPACE_OPTION,
		...options,
	};

	// strip whitespace in-between nodes
	let _htmlString = htmlString;
	if (stripWhitespace) {
		_htmlString = htmlString.replace(/>\s+</g, "><");
	}

	const [resultNodes, _containerEl] = buildChildNodes(_htmlString);

	// trim empty text nodes
	if (trim) {
		if (resultNodes.length > 1) {
			if (isEmptyTextNode(resultNodes[0])) {
				resultNodes.shift();
			}
		}
		if (resultNodes.length > 1) {
			if (isEmptyTextNode(resultNodes.at(-1))) {
				resultNodes.pop();
			}
		}
	}

	if (resultNodes.length > 1) {
		console.error("has more than one node", resultNodes);
		throw new Error("has more than one node");
	}
	const [node] = resultNodes;

	return [node as DeterminedNodeOnString<T>, _containerEl];
}

/**
 * Perform `querySelector` on query element, whether it is HTMLElement or HTMLTemplateElement.
 * @see {@link queryAllContainer} function for `querySelectorAll` version.
 */
export function queryContainer<T extends HTMLElement = HTMLElement>(containerEl: ContainerElement, selector: string) {
	let queryEl: HTMLElement | DocumentFragment;
	if (containerEl instanceof HTMLTemplateElement) {
		queryEl = containerEl.content;
	} else {
		queryEl = containerEl;
	}

	return queryEl.querySelector<T>(selector);
}

/**
 * Perform `querySelectorAll` on query element, whether it is HTMLElement or HTMLTemplateElement.
 * @see {@link queryContainer} function for `querySelector`.
 */
export function queryAllContainer<T extends HTMLElement = HTMLElement>(
	containerEl: ContainerElement,
	selector: string,
) {
	let queryEl: HTMLElement | DocumentFragment;
	if (containerEl instanceof HTMLTemplateElement) {
		queryEl = containerEl.content;
	} else {
		queryEl = containerEl;
	}

	return queryEl.querySelectorAll<T>(selector);
}

///

function isEmptyTextNode(node: Node | undefined | null): node is Text {
	if (!node) return false;
	return node.nodeType === document.TEXT_NODE && node.nodeValue?.trim() === "";
}

export function buildChildNodes<T extends Node[]>(
	htmlString: string,
	container?: ContainerElement,
): [T, ContainerElement] {
	const containerEl = container ?? document.createElement("template");

	// assign innerHTML
	containerEl.innerHTML = htmlString;

	let resultNodes: NodeListOf<ChildNode>;
	if (containerEl instanceof HTMLTemplateElement) {
		resultNodes = containerEl.content.childNodes;
	} else {
		resultNodes = containerEl.childNodes;
	}

	return [[...resultNodes] as unknown as T, containerEl];
}
