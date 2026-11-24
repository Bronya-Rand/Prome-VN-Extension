export const promeBus = new EventTarget();

/* Events */
export const PROME_SPEAKER_CHANGED = "PROME_SPEAKER_CHANGED";
export const PROME_STREAM_BYTE = "PROME_STREAM_BYTE";
export const PROME_STAGE_REFRESH_REQUESTED = "PROME_STAGE_REFRESH_REQUESTED";
export const PROME_SET_EXPRESSION = "PROME_SET_EXPRESSION";
export const PROME_USER_SPRITE_TOGGLED = "PROME_USER_SPRITE_TOGGLED";
export const PROME_SPRITE_FOLDER_CHANGED = "PROME_SPRITE_FOLDER_CHANGED";
export const PROME_CUSTOM_EXPRESSIONS_CHANGED = "PROME_CUSTOM_EXPRESSIONS_CHANGED";

/**
 * Dispatch an event on the promeBus with the given type and detail.
 * @param {string} type
 * @param {*} detail
 */
export function emitPromeEvent(type, detail) {
	promeBus.dispatchEvent(new CustomEvent(type, { detail }));
}
