import { debounce_timeout } from "../../../constants.js";
import { debounce } from "../../../utils.js";
import { getContext, extension_settings } from "../../../extensions.js";
import { extensionName } from "./constants.js";
import { applyUserSpriteAttributes } from "./modules/user.js";
import {
	getLastChatMessage,
	getSpriteList,
	isUserSpriteEnabled,
	isGroupChat,
} from "./utils.js";
import { textgenerationwebui_settings as textgen_settings } from "../../../textgen-settings.js";
import { applyScale } from "./modules/scale.js";
import { isDisabledMember } from "./utils.js";
// import { visualNovelUpdateLayers } from "../../expressions/index.js";

/* Debouncers */
export const applyZoomDebounce = debounce(() => {
	applyZoom();
}, debounce_timeout.short);
export const applyScaleDebounce = debounce(() => {
	applyScale();
}, debounce_timeout.relaxed);
export const applyDefocusDebounce = debounce(() => {
	applyDefocus();
}, debounce_timeout.short);
export const emulateSpritesDebounce = debounce(async () => {
	await emulateSprites();
}, debounce_timeout.short);
export const applyShakeDebounce = debounce(async () => {
	await applyShake();
}, debounce_timeout.short);
export const applyUserAttributesDebounce = debounce(async () => {
	await applyUserSpriteAttributes();
}, debounce_timeout.relaxed);

//
// Helper Functions
//

/**
 * Check if the preconditions are met for the zoom listener
 * @param {boolean} allowSolo - Allow zoom listener to work in a 1:1 chat
 * @returns {boolean} - Whether the preconditions are met
 */
function zoomListenerPreconditions(allowSolo = false) {
	const context = getContext();
	const group = context.groups.find((x) => x.id === context.groupId);
	if (allowSolo && group === undefined) {
		if (!isUserSpriteEnabled()) return false;
	} else {
		if (!group) return false;
		const filteredMembers = group.members.filter(
			(x) => !group.disabled_members.includes(x),
		);
		if (filteredMembers.length < 1) return false;
	}
	return true;
}

/**
 * Wait for an element to exist before running a callback
 * @param {string} selector - The element selector
 * @param {function} callback - The callback function
 * @param {number} maxAttempts - The maximum number of attempts to wait for the element
 * @returns {void}
 */
function waitForElement(selector, callback, maxAttempts = 50) {
	let element = $(selector);
	let attempts = 0;

	if (element.length) {
		callback(element);
		return;
	}

	const interval = setInterval(() => {
		element = $(selector);
		attempts++;

		if (element.length > 0 || attempts >= maxAttempts) {
			clearInterval(interval);
			if (element.length > 0) callback(element);
		}
	}, 100);
}

// Apply focus class to the sprite
function applyZoom() {
	if (!zoomListenerPreconditions(true)) return;

	// Cache selectors
	const visualNovelWrapperSprites = $("#visual-novel-wrapper > div");
	const promeUserSprite = $("#expression-prome-user");
	const expressionHolder = $("#expression-holder");

	// Check if there are any messages
	const lastMessagesWithoutSystem = getLastChatMessage();
	if (lastMessagesWithoutSystem.length === 0) {
		visualNovelWrapperSprites.removeClass("prome-sprite-focus");
		return;
	}

	const lastMessage = lastMessagesWithoutSystem[0];
	const isUserMessage = lastMessage.is_user;
	const groupChat = isGroupChat();
	const userSpriteEnabled = isUserSpriteEnabled();

	// Handle User Messages
	if (isUserMessage) {
		visualNovelWrapperSprites.removeClass("prome-sprite-focus");

		if (userSpriteEnabled) {
			promeUserSprite.addClass("prome-sprite-focus");
			if (!groupChat) expressionHolder.removeClass("prome-sprite-focus");
		}
		return;
	}

	if (groupChat) {
		if (isDisabledMember(lastMessage.original_avatar)) {
			visualNovelWrapperSprites.removeClass("prome-sprite-focus");
			return;
		}

		const spriteDivSelector = `#visual-novel-wrapper [id='expression-${lastMessage.original_avatar}']`;

		return waitForElement(spriteDivSelector, (sprite) => {
			// Focus the sprite and defocus the rest
			sprite.addClass("prome-sprite-focus");
			visualNovelWrapperSprites.not(sprite).removeClass("prome-sprite-focus");
		});
	}

	return waitForElement("#expression-holder", (sprite) => {
		sprite.addClass("prome-sprite-focus");
		promeUserSprite.removeClass("prome-sprite-focus");
	});
}

// Apply defocus class to the sprites
function applyDefocus() {
	if (!zoomListenerPreconditions(true)) return;

	// Cache selectors
	const visualNovelWrapperSprites = $("#visual-novel-wrapper > div");
	const promeUserSprite = $("#expression-prome-user");
	const expressionHolder = $("#expression-holder");

	// Check if there are any messages
	const lastMessagesWithoutSystem = getLastChatMessage();
	if (lastMessagesWithoutSystem.length === 0) {
		visualNovelWrapperSprites.removeClass("prome-sprite-focus");
		return;
	}

	const lastMessage = lastMessagesWithoutSystem[0];
	const isUserMessage = lastMessage.is_user;
	const groupChat = isGroupChat();
	const userSpriteEnabled = isUserSpriteEnabled();

	if (isUserMessage) {
		visualNovelWrapperSprites.addClass("prome-sprite-defocus");

		if (userSpriteEnabled) {
			promeUserSprite.removeClass("prome-sprite-defocus");
			if (!groupChat) expressionHolder.removeClass("prome-sprite-defocus");
		}
		return;
	}

	if (groupChat) {
		// check if last message is from a disabled group member
		// if so, defocus all sprites
		if (isDisabledMember(lastMessage.original_avatar)) {
			visualNovelWrapperSprites.addClass("prome-sprite-defocus");
			return;
		}

		const spriteDivSelector = `#visual-novel-wrapper [id='expression-${lastMessage.original_avatar}']`;

		return waitForElement(spriteDivSelector, (sprite) => {
			// Defocus the sprite and focus the rest
			sprite.removeClass("prome-sprite-defocus");
			visualNovelWrapperSprites.not(sprite).addClass("prome-sprite-defocus");
		});
	}

	return waitForElement("#expression-holder", (sprite) => {
		sprite.removeClass("prome-sprite-defocus");
		promeUserSprite.addClass("prome-sprite-defocus");
	});
}

async function emulateGroupSprites() {
	const context = getContext();
	const group = context.groups.find((x) => x.id === context.groupId);
	const filteredMembers = group.members.filter(
		(x) => !group.disabled_members.includes(x) && x !== "prome-user",
	);

	await Promise.all(
		filteredMembers.map(async (member) => {
			const character = context.characters.find((x) => x.avatar === member);
			if (!character || isDisabledMember(character.avatar))
				return Promise.resolve();

			const sprites = await getSpriteList(character.name);
			if (sprites.length > 0) return Promise.resolve();

			console.debug(
				`[${extensionName}] Sprites not found for character: ${character.name}. Emulating via character card image.`,
			);

			const spriteSelector = `#visual-novel-wrapper [id='expression-${character.avatar}']`;

			waitForElement(spriteSelector, (sprite) => {
				const expressionImage = sprite.find("img")[0];
				if (expressionImage) {
					if (extension_settings[extensionName].emulateSprites) {
						expressionImage.src = `/characters/${character.avatar}`;
						sprite.removeClass("hidden");
						sprite.css("display", "inherit");
					} else {
						expressionImage.src = "";
						sprite.addClass("hidden");
						sprite.css("display", "none");
					}
				}
			});
		}),
	);
}

async function emulateSoloSprites() {
	const context = getContext();
	if (context.characterId === undefined || context.characterId === "prome-user")
		return Promise.resolve();

	const character = context.characters[context.characterId];
	const sprites = await getSpriteList(character.name);
	if (sprites.length > 0) return Promise.resolve();

	console.debug(
		`[${extensionName}] Sprites not found for character: ${character.name}. Emulating via character card image.`,
	);

	waitForElement("#expression-holder", (sprite) => {
		if (!extension_settings[extensionName].emulateSprites) {
			sprite.children("img").attr("src", "");
			sprite.css("display", "none");
		} else {
			sprite.children("img").attr("src", `/characters/${character.avatar}`);
			sprite.css("display", "inherit");
		}
	});
}

async function emulateSprites() {
	if (!zoomListenerPreconditions(true)) return Promise.resolve();

	const groupChat = isGroupChat();

	if (groupChat) {
		// const vnWrapper = $("#visual-novel-wrapper");
		await emulateGroupSprites();
		// Execute VN Sprite Update only if User Sprite is not enabled
		// If enabled, let the User Sprite VN Update handle it
		// (To be enabled when ST PR is merged)
		// if (!isUserSpriteEnabled()) {
		// 	await visualNovelUpdateLayers(vnWrapper);
		// }
	} else {
		await emulateSoloSprites();
	}
}

// Apply shake class to the speaking sprite
async function applyShake() {
	if (!textgen_settings.streaming) return;

	const context = getContext();
	const group = context.groups.find((x) => x.id === context.groupId);
	const streamingProcessor = context.streamingProcessor;
	const isStreaming = streamingProcessor && !streamingProcessor.isStopped;
	if (!isStreaming) return;

	// If Group Chat, Apply Shake to Speaking Sprite
	if (group) {
		const filteredMembers = group.members.filter(
			(x) => !group.disabled_members.includes(x),
		);
		if (filteredMembers.length < 1) return;

		if (!context.characterId) return; // ST bug or something else
		const speakingCharacter = context.characters[context.characterId];
		if (!speakingCharacter) {
			console.debug(
				"Character not found in group members. Either error or something else happened.",
			);
			return;
		}
		if (isDisabledMember(speakingCharacter.avatar)) return;

		const spriteDiv = `#visual-novel-wrapper [id='expression-${speakingCharacter.avatar}']`;
		let sprite = $(spriteDiv);

		const applyShakeClass = () => {
			// apply shake class to the speaking sprite
			sprite.addClass("prome-sprite-shake");

			// remove shake class from other sprites
			$("#visual-novel-wrapper > div")
				.not(sprite)
				.removeClass("prome-sprite-shake");
		};

		if (sprite.length === 0) {
			// give time for the sprite to load on the page
			const checkInterval = setInterval(() => {
				sprite = $(spriteDiv);
				if (sprite.length > 0) {
					applyShakeClass();
					clearInterval(checkInterval);
				}
			}, 100);
		} else {
			applyShakeClass();
		}
	} else {
		// Apply Shake to Main Sprite in 1:1 Chat
		$("#expression-holder").addClass("prome-sprite-shake");
	}
}

export function stopShake() {
	const context = getContext();
	const group = context.groups.find((x) => x.id === context.groupId);
	const streamingProcessor = context.streamingProcessor;
	let isStreamingDone =
		streamingProcessor &&
		!streamingProcessor.isStopped &&
		streamingProcessor.isFinished;

	const stopShakeClass = (group) => {
		// If Group Chat, Apply Shake to Speaking Sprite
		if (group) {
			$("#visual-novel-wrapper > div").removeClass("prome-sprite-shake");
		} else {
			$("#expression-holder").removeClass("prome-sprite-shake");
		}
	};

	if (!isStreamingDone) {
		const checkInterval = setInterval(() => {
			isStreamingDone =
				streamingProcessor &&
				!streamingProcessor.isStopped &&
				streamingProcessor.isFinished;
			if (isStreamingDone) {
				stopShakeClass(group);
				clearInterval(checkInterval);
			}
		}, 100);
	} else {
		stopShakeClass(group);
	}
}
