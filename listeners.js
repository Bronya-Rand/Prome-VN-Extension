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
	spritePackExists,
} from "./utils.js";
import { textgenerationwebui_settings as textgen_settings } from "../../../textgen-settings.js";
import { applyScale } from "./modules/scale.js";
import { isDisabledMember } from "./utils.js";
import { visualNovelUpdateLayers } from "../../expressions/index.js";

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
 * Check if the preconditions are met for the shake listener
 * @returns {boolean} - Whether the preconditions are met
 */
function shakeListenerPreconditions() {
	if (!textgen_settings.streaming) return false;

	const context = getContext();
	const streamingProcessor = context.streamingProcessor;
	return streamingProcessor && !streamingProcessor.isStopped;
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

			const { sprites, err } = await getSpriteList(character.name);
			if (err) {
				console.error(
					`[${extensionName}] Error fetching sprite pack for character: ${character.name}: ${err}`,
				);
				return Promise.resolve();
			}
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
					} else {
						expressionImage.src = "";
					}
				}
			});
		}),
	);
}

async function emulateSoloSprites() {
	const context = getContext();
	if (context.characterId === undefined || context.characterId === "prome-user") return;

	const character = context.characters[context.characterId];
	const exists = await spritePackExists(character.name);

	if (!exists) {
		// Solo chats don't need card emulation as clicking the char
		// icon will show the character card image. Only proceed
		// with emulation if User Sprite is enabled.
		if (!isUserSpriteEnabled()) {
			$("#expression-holder").children("img").attr("src", "");
			$("#expression-holder").css("display", "none");
			return;
		}

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
}

async function emulateSprites() {
	const groupChat = isGroupChat();

	if (groupChat) {
		const vnWrapper = $("#visual-novel-wrapper");

		await emulateGroupSprites();

		// Execute VN Sprite Update only if User Sprite is not enabled
		// If enabled, let the User Sprite VN Update handle it
		if (!isUserSpriteEnabled()) {
			await visualNovelUpdateLayers(vnWrapper);
		}
	} else {
		await emulateSoloSprites();
	}

	return Promise.resolve();
}

function getShakeTargets(group, characterAvatar = null) {
	const allSprites = $("#visual-novel-wrapper > div");

	if (group) {
		if (characterAvatar) {
			const sprite = `#visual-novel-wrapper [id='expression-${characterAvatar}']`;
			return { target: sprite, allSprites };
		}
		return { target: null, allSprites };
	}

	return { target: "#expression-holder" };
}

// Apply shake class to the speaking sprite
async function applyShake() {
	if (!shakeListenerPreconditions()) return Promise.resolve();

	const context = getContext();
	const group = context.groups.find((x) => x.id === context.groupId);

	// Get selectors
	const { target: targetSelector, allSprites } = getShakeTargets(
		group,
		context.characterId,
	);

	// Group Chat Logic
	if (group) {
		const filteredMembers = group.members.filter(
			(x) => !group.disabled_members.includes(x),
		);
		if (filteredMembers.length < 1) return Promise.resolve();

		if (!context.characterId) return Promise.resolve(); // ST bug or something else

		const speakingCharacter = context.characters[context.characterId];
		if (!speakingCharacter || isDisabledMember(speakingCharacter.avatar))
			return Promise.resolve();

		return new Promise((resolve) => {
			waitForElement(targetSelector, (sprite) => {
				sprite.addClass("prome-sprite-shake");
				allSprites.not(sprite).removeClass("prome-sprite-shake");
				resolve();
			});
		});
	}

	// Solo Chat Logic
	return new Promise((resolve) => {
		waitForElement(targetSelector, (sprite) => {
			sprite.addClass("prome-sprite-shake");
			resolve();
		});
	});
}

export function stopShake() {
	const context = getContext();
	const groupChat = isGroupChat();
	const streamingProcessor = context.streamingProcessor;

	// Get selectors
	const { target: targetSelector, allSprites } = getShakeTargets(
		groupChat,
		context.characterId,
	);

	const applyStopShake = () => {
		if (groupChat) {
			// Group Chat Logic
			allSprites.removeClass("prome-sprite-shake");

			if (targetSelector) {
				waitForElement(targetSelector, (sprite) => {
					sprite.removeClass("prome-sprite-shake");
				});
			}
		} else {
			// Solo Chat Logic
			waitForElement(targetSelector, (sprite) => {
				sprite.removeClass("prome-sprite-shake");
			});
		}
	};

	const isStreamingDone =
		streamingProcessor &&
		!streamingProcessor.isStopped &&
		streamingProcessor.isFinished;

	if (isStreamingDone) {
		applyStopShake();
		return;
	}

	const checkInterval = setInterval(() => {
		const nowDone =
			streamingProcessor &&
			!streamingProcessor.isStopped &&
			streamingProcessor.isFinished;

		if (nowDone) {
			clearInterval(checkInterval);
			applyStopShake();
		}
	}, 100);

	// cleanup JIC
	setTimeout(() => {
		clearInterval(checkInterval);
		applyStopShake();
	}, 10000);
}
