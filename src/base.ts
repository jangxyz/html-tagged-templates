import type {
	ExtractElementPrefix,
	CommentPrefixedString,
	ElementPrefixedString,
	HtmlTagName,
	NotStartWithLeftAngleBracket,
} from "./utils.js";
import type { IfNotNeverThen } from "./utils/types_util.js";

export type NestedQuery = Record<string, string>;

export type ContainerElement = HTMLElement | HTMLTemplateElement;

export type DeterminedNode<S extends string> = IfNotNeverThen<
	ExtractElementPrefix<S>,
	HTMLElementTagNameMap[ExtractElementPrefix<S>],
	S extends CommentPrefixedString ? Comment : S extends NotStartWithLeftAngleBracket<S> ? Text : Node
>;

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

/**
 * Build a single element from an html string. Will reuse the container element if provided.
 */
// overload: HTMLElement
export function buildSingleNode<T extends HtmlTagName>(
	htmlString: ElementPrefixedString<T>,
): [HTMLElementTagNameMap[T], ContainerElement];
// overload: Comment
export function buildSingleNode(htmlString: CommentPrefixedString): [Comment, ContainerElement];
// overload: other - Text
export function buildSingleNode(htmlString: string): [Text, ContainerElement];
// overload: default
export function buildSingleNode<T extends Node>(htmlString: string): [T, ContainerElement];
// actual implementation
export function buildSingleNode<T extends Node>(htmlString: string): [T, ContainerElement] {
	const [resultNodes, _containerEl] = buildChildNodes(htmlString);

	// trim empty text nodes
	if (resultNodes.length > 1) {
		if (isEmptyTextNode(resultNodes[0])) {
			resultNodes.shift();
		}
		if (isEmptyTextNode(resultNodes.at(-1))) {
			resultNodes.pop();
		}
	}

	if (resultNodes.length > 1) {
		console.error("has more than one node", resultNodes);
		throw new Error("has more than one node");
	}

	return [resultNodes[0] as unknown as T, _containerEl];
}

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
