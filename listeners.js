import { debounce_timeout } from "../../../constants.js";
import { extension_settings, getContext } from "../../../extensions.js";
import { debounce } from "../../../utils.js";
import { visualNovelUpdateLayers } from "../../expressions/index.js";
import { extensionName } from "./constants.js";
import { applyUserSpriteAttributes } from "./modules/user.js";
import {
	getSpriteList,
	isDisabledMember,
	isGroupChat,
	isUserSpriteEnabled,
	spritePackExists,
} from "./utils.js";

/* Debouncers */
export const emulateSpritesDebounce = debounce(async () => {
	await emulateSprites();
}, debounce_timeout.short);
export const applyUserAttributesDebounce = debounce(async () => {
	await applyUserSpriteAttributes();
}, debounce_timeout.relaxed);

//
// Helper Functions
//

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
	if (context.characterId === undefined || context.characterId === "prome-user")
		return;

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
