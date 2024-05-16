import type { CommentPrefixedString, ElementPrefixedString, HtmlTagName } from "./utils.js";

export type NestedQuery = Record<string, string>;

export type QueryOptions<Q extends NestedQuery> = {
	query: Q;
	queryAll: Q;
};

export type ContainerElement = HTMLElement | HTMLTemplateElement;

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
	//const _containerEl = containerEl ?? document.createElement("div");
	//_containerEl.innerHTML = htmlString;
	//
	//const childNodes = _containerEl.childNodes;
	//if (childNodes.length > 1) {
	//	throw new Error("has more than one node");
	//}
	//
	//return [childNodes[0] as unknown as T, _containerEl];

	const [resultNodes, _containerEl] = buildChildNodes(htmlString);
	if (resultNodes.length > 1) {
		throw new Error("has more than one node");
	}

	return [resultNodes[0] as unknown as T, _containerEl];
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
