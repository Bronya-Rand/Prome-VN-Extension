import { debounce_timeout } from "../../../constants.js";
import { debounce } from "../../../utils.js";
import { getContext } from "../../../extensions.js";
import { extensionName } from "./constants.js";
import { handleUserSprite } from "./modules/user.js";
import {
	getLastChatMessage,
	getSpriteList,
	isUserSpriteEnabled,
} from "./utils.js";
import { textgenerationwebui_settings as textgen_settings } from "../../../textgen-settings.js";

/* Debouncers */
export const applyZoomDebounce = debounce(async () => {
	await applyZoom();
}, debounce_timeout.short);
export const applyDefocusDebounce = debounce(async () => {
	await applyDefocus();
}, debounce_timeout.short);
export const emulateSpritesDebounce = debounce(async () => {
	await emulateSprites();
}, debounce_timeout.short);
export const applyShakeDebounce = debounce(async () => {
	await applyShake();
}, debounce_timeout.short);
export const handleUserSpriteDebounce = debounce(async () => {
	await handleUserSprite();
}, debounce_timeout.standard);

// Check if the current chat has more than one member
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

function isDisabledMember(name) {
	const context = getContext();
	const group = context.groups.find((x) => x.id === context.groupId);
	if (!group) return false;
	return group.disabled_members.includes(name);
}

function isGroupChat() {
	const context = getContext();
	return context.groupId !== null;
}

// Apply focus class to the sprite
async function applyZoom() {
	if (!zoomListenerPreconditions(true)) return;

	// check if there are any messages
	const lastMessagesWithoutSystem = getLastChatMessage();
	// if there are no messages, remove the focus class
	if (lastMessagesWithoutSystem.length === 0) {
		$("#visual-novel-wrapper > div").removeClass("prome-sprite-focus");
		return;
	}

	// check if the last message is from a user
	// if so, remove the focus class
	const lastMessage = lastMessagesWithoutSystem[0];
	if (lastMessage.is_user) {
		if (isGroupChat()) {
			$("#visual-novel-wrapper > div").removeClass("prome-sprite-focus");
			if (isUserSpriteEnabled())
				$("#expression-prome-user").addClass("prome-sprite-focus");
		} else {
			if (isUserSpriteEnabled()) {
				$("#expression-holder").removeClass("prome-sprite-focus");
				$("#expression-prome-user").addClass("prome-sprite-focus");
			}
		}
		return;
	}

	if (isGroupChat()) {
		// check if the last message is from a disabled group member
		// if so, remove the focus class
		if (isDisabledMember(lastMessage.original_avatar)) {
			$("#visual-novel-wrapper > div").removeClass("prome-sprite-focus");
			return;
		}

		const spriteDiv = `#visual-novel-wrapper [id='expression-${lastMessage.original_avatar}']`;
		let sprite = $(spriteDiv);

		// apply focus class to the sprite
		const applyFocusClass = () => {
			// apply focus class to the focused sprite
			sprite.addClass("prome-sprite-focus");

			// remove focus class from other sprites
			$("#visual-novel-wrapper > div")
				.not(sprite)
				.removeClass("prome-sprite-focus");
		};

		if (sprite.length === 0) {
			// give time for the sprite to load on the page
			const checkInterval = setInterval(() => {
				sprite = $(spriteDiv);
				if (sprite.length > 0) {
					applyFocusClass();
					clearInterval(checkInterval);
				}
			}, 100);
		} else {
			applyFocusClass();
		}
	} else {
		const spriteDiv = $("#expression-holder");

		const applyFocusClass = () => {
			spriteDiv.addClass("prome-sprite-focus");
			$("#expression-prome-user").removeClass("prome-sprite-focus");
		};

		if (spriteDiv.length === 0) {
			const checkInterval = setInterval(() => {
				if (spriteDiv.length > 0) {
					applyFocusClass();
					clearInterval(checkInterval);
				}
			}, 100);
		} else {
			applyFocusClass();
		}
	}
}

// Apply defocus class to the sprites
async function applyDefocus() {
	if (!zoomListenerPreconditions(true)) return;

	// check if there are any messages
	const lastMessagesWithoutSystem = getLastChatMessage();
	// if there are no messages, defocus all sprites
	if (lastMessagesWithoutSystem.length === 0) {
		$("#visual-novel-wrapper > div").addClass("prome-sprite-defocus");
		return;
	}

	// check if last message is from a user
	// if so, defocus all sprites
	const lastMessage = lastMessagesWithoutSystem[0];
	if (lastMessage.is_user) {
		if (isGroupChat()) {
			// if user sprite is enabled, defocus all sprites except the user sprite
			if (isUserSpriteEnabled()) {
				$("#visual-novel-wrapper > div")
					.not("#expression-prome-user")
					.addClass("prome-sprite-defocus");
				$("#expression-prome-user").removeClass("prome-sprite-defocus");
			} else {
				$("#visual-novel-wrapper > div").addClass("prome-sprite-defocus");
			}
		} else {
			if (isUserSpriteEnabled()) {
				$("#expression-holder").addClass("prome-sprite-defocus");
				$("#expression-prome-user").removeClass("prome-sprite-defocus");
			}
		}
		return;
	}

	if (isGroupChat()) {
		// check if last message is from a disabled group member
		// if so, defocus all sprites
		if (isDisabledMember(lastMessage.original_avatar)) {
			$("#visual-novel-wrapper > div").addClass("prome-sprite-defocus");
			return;
		}

		const focusedSpriteDiv = `#visual-novel-wrapper [id='expression-${lastMessage.original_avatar}']`;
		let focusedSprite = $(focusedSpriteDiv);

		const applyDefocusClass = () => {
			// remove defocus class from all sprites
			$("#visual-novel-wrapper > div").removeClass("prome-sprite-defocus");

			// apply defocus class to all sprites except the focused sprite
			$("#visual-novel-wrapper > div")
				.not(focusedSprite)
				.addClass("prome-sprite-defocus");
		};

		if (focusedSprite.length === 0) {
			const checkInterval = setInterval(() => {
				focusedSprite = $(focusedSpriteDiv);
				if (focusedSprite.length > 0) {
					applyDefocusClass();
					clearInterval(checkInterval);
				}
			}, 100);
		} else {
			applyDefocusClass();
		}
	} else {
		const spriteDiv = $("#expression-holder");

		const applyDefocusClass = () => {
			spriteDiv.removeClass("prome-sprite-defocus");
			$("#expression-prome-user").addClass("prome-sprite-defocus");
		};

		if (spriteDiv.length === 0) {
			const checkInterval = setInterval(() => {
				if (spriteDiv.length > 0) {
					applyDefocusClass();
					clearInterval(checkInterval);
				}
			}, 100);
		} else {
			applyDefocusClass();
		}
	}
}

async function emulateSprites() {
	if (!zoomListenerPreconditions(true)) return;

	const context = getContext();
	const group = context.groups.find((x) => x.id === context.groupId);

	if (group) {
		const filteredMembers = group.members.filter(
			(x) => !group.disabled_members.includes(x),
		);

		for (const member of filteredMembers) {
			const character = context.characters.find((x) => x.avatar === member);
			if (!character) {
				continue;
			}
			if (character.avatar === "prome-user") return;

			const sprites = await getSpriteList(character.name);
			if (sprites.length === 0) {
				if (!isDisabledMember(character.avatar)) {
					console.debug(
						`[${extensionName}] No sprites found for character: ${character.name}. Emulating via character card image.`,
					);

					// grab the sprite div
					const spriteDiv = `#visual-novel-wrapper [id='expression-${character.avatar}']`;
					let sprite = $(spriteDiv);

					// apply the sprite card image to <img id="expression-image"> in the spriteDiv
					const applySpriteCardImage = (div, member) => {
						// grab the sprite img element in the sprite div
						const expressionImage = $(`${div} > img`)[0];

						// apply the sprite card image to the img src
						expressionImage.src = `/characters/${member}`;
					};

					if (sprite.length === 0) {
						// give time for the sprite to load on the page
						const checkInterval = setInterval(() => {
							sprite = $(spriteDiv);
							if (sprite.length > 0) {
								applySpriteCardImage(spriteDiv, character.avatar);
								clearInterval(checkInterval);
							}
						}, 100);
					} else {
						applySpriteCardImage(spriteDiv, character.avatar);
					}
					// apply the prome-render-sprite class to the sprite div
					sprite.addClass("prome-render-sprite");
				}
			}
		}
	} else {
		if (context.characterId === null) return;

		const character = context.characters[context.characterId];
		const sprites = await getSpriteList(character.name);

		if (sprites.length === 0) {
			console.debug(
				`[${extensionName}] No sprites found for character: ${character.name}. Emulating via character card image.`,
			);

			const spriteDiv = $("#expression-holder");

			const applySpriteCardImage = () => {
				spriteDiv
					.children("img")
					.attr("src", `/characters/${character.avatar}`);
			};

			if (spriteDiv.length === 0) {
				const checkInterval = setInterval(() => {
					if (spriteDiv.length > 0) {
						applySpriteCardImage();
						clearInterval(checkInterval);
					}
				}, 100);
			} else {
				applySpriteCardImage();
			}
			spriteDiv.addClass("prome-render-sprite");
		}
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
