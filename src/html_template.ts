import { htmlSingleFn } from "./html_single.js";
import type { SpecString } from "./base.js";

export function template<T extends Node | string>(templateString: SpecString<T>) {
	return (data: Record<string, unknown> = {}) => {
		const stuffedString = templateString.replace(/{[^}]*}/g, (matchString, index, entire) => {
			const name = matchString.slice(1, -1);
			const value = data[name] ?? "";
			return String(value);
		});
		return htmlSingleFn<T>(stuffedString as SpecString<T>);
	};
}
