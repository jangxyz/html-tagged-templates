import type {
	HtmlElementTagName,
	AttributeName,
	BooleanAttributeName,
	ValuedAttributeName,
} from "./utils/html-types.ts";

type EventHandlerAttributes = {
	[K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void;
};

//export type ElementAttributes = EventAttributes & NonEventAttributes;
export type ElementAttributes = EventHandlerAttributes & {
	[K in ValuedAttributeName]?: string;
} & {
	[K in BooleanAttributeName]?: boolean;
};

export function htmlElement<T extends HtmlElementTagName, A extends ElementAttributes>(
	tagName: T,
	attributes: A,
	children: ArrayLike<Node | string> = [],
) {
	//
	const el = document.createElement<T>(tagName);

	// set attributes
	for (const key of Object.keys(attributes)) {
		const value = attributes[key as keyof A];
		el.setAttribute(key, String(value));
	}

	// set child nodes
	for (let i = 0; i < children?.length; i++) {
		const child = children[i];
		if (typeof child === "string") {
			el.appendChild(document.createTextNode(child));
		} else {
			el.appendChild(child);
		}
	}

	return el;
}
