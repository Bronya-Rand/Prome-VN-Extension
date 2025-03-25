import { getContext, extension_settings } from "../../../extensions.js";
import { extensionName, VN_MODES } from "./constants.js";

/**
 * Returns the last character chat message
 * @returns {object} - The last character chat message
 */
export function getLastChatMessage() {
	const context = getContext();
	const reversedChat = context.chat.slice().reverse();

	return reversedChat.filter((mes) => !mes.is_system && !mes.extra?.image);
}

/**
 * Lists out the characters that have spoken recently
 * @param {number?} limit - The number of characters to return
 * @returns {string[]} - An array of character original avatars
 */
export function getRecentTalkingCharacters(limit) {
	const context = getContext();
	const reversedChat = context.chat.slice().reverse();

	// Filter out system messages, images, and user messages
	const talkingCharacters = reversedChat
		.filter((mes) => !mes.is_system && !mes.extra?.image && !mes.is_user)
		.map((mes) => mes.original_avatar);

	if (limit) {
		// Limit the number of characters to return
		// If the number of characters is less than the limit, return all characters
		if (talkingCharacters.length < limit) {
			return talkingCharacters;
		}
		return talkingCharacters.slice(0, limit);
	}
	return talkingCharacters;
}

/**
 * Returns the current chat ID
 * @returns {string} - The current chat ID
 */
export function getChatId() {
	const context = getContext();
	return context.getCurrentChatId();
}

/**
 * Returns whether letterbox mode is enabled
 * @returns {boolean} - Whether letterbox mode is enabled
 */
export function isLetterboxModeEnabled() {
	return Boolean(
		extension_settings[extensionName].letterboxMode !== VN_MODES.NONE,
	);
}

/**
 * Returns whether the chat box (sheld) is visible
 * @returns {boolean} - Whether the chat box is visible
 */
export function isSheldVisible() {
	return Boolean(!extension_settings[extensionName].hideSheld);
}

/**
 * Returns whether user sprites are enabled
 * @returns {boolean} - Whether user sprites are enabled
 */
export function isUserSpriteEnabled() {
	return Boolean(extension_settings[extensionName].enableUserSprite);
}

/**
 * Returns whether auto-hide sprites are enabled
 * @returns {boolean} - Whether sprites should be auto-hidden
 */
export function isAutoHideSpritesEnabled() {
	return Boolean(extension_settings[extensionName].autoHideSprites);
}

export async function getSpriteList(name) {
	try {
		const result = await fetch(
			`/api/sprites/get?name=${encodeURIComponent(name)}`,
		);
		const sprites = result.ok ? await result.json() : [];
		return sprites;
	} catch (err) {
		console.log(err);
		return [];
	}
}

/**
 * Returns the index of the current group (or -1 if not found)
 * @returns {number} - The index of the current group
 */
export function getGroupIndex() {
	const context = getContext();
	const groupIndex = context.groups.findIndex((x) => {
		return x.id === context.groupId;
	});
	return groupIndex;
}

/**
 * Returns whether the current chat is a group chat
 * @returns {boolean} - Whether the current chat is a group chat
 */
export function isGroupChat() {
	const context = getContext();
	return context.groupId !== null;
}
