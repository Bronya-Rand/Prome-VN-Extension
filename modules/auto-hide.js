import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { eventSource, event_types } from "../../../../../../script.js";
import {
	getGroupIndex,
	getRecentTalkingCharacters,
	isAutoHideSpritesEnabled,
	isUserSpriteEnabled,
} from "../utils.js";

export function applyAutoHideSprites() {
	if (
		extension_settings[extensionName].autoHideSprites === (null || undefined)
	) {
		console.debug(
			`[${extensionName}] autoHideSprites returned null or undefined.`,
		);
	}

	console.debug(
		`[${extensionName}] Auto Hide Sprites?: ${extension_settings[extensionName].autoHideSprites}`,
	);

	$("body").toggleClass(
		"autoHideSprites",
		extension_settings[extensionName].autoHideSprites,
	);
}

export function onAutoHideSprites_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].autoHideSprites = value;
	saveSettingsDebounced();
	applyAutoHideSprites();
}

export function onAutoHideMaxSprites_Change() {
	const value = Number(this.value);
	if (value < 0 || value > 8) {
		console.error(
			`[${extensionName}] Invalid max value for auto-hide sprites: ${value}`,
		);
		return;
	}
	extension_settings[extensionName].maxViewableCharacters = value;
	$("#prome-sprite-max-visible").val(value);
	saveSettingsDebounced();
	eventSource.emit(event_types.GROUP_UPDATED);
}

export function setupAutoHideHTML() {
	$("#prome-auto-hide-sprites").prop(
		"checked",
		extension_settings[extensionName].autoHideSprites,
	);
	$("#prome-sprite-max-visible").val(
		extension_settings[extensionName].maxViewableCharacters,
	);
}

export function setupAutoHideJQuery() {
	$("#prome-auto-hide-sprites").on("click", onAutoHideSprites_Click);
	$("#prome-sprite-max-visible").on("change", onAutoHideMaxSprites_Change);
}

export async function handleAutoHideSprites() {
	const groupIndex = getGroupIndex();

	// If the user is not in a group, return
	if (groupIndex === -1) return;

	// Get all characters within the '#visual-novel-wrapper' div
	let allSprites = $("#visual-novel-wrapper > div");

	// Remove user sprite from the list of sprites (if userSprite is enabled)
	if (isUserSpriteEnabled()) {
		allSprites = allSprites.not("#expression-prome-user");
	}

	// Remove displayNone class from all sprites
	allSprites.removeClass("displayNone");

	// Add displayNone class to all sprites after the Xth sprite
	if (isAutoHideSpritesEnabled()) {
		const maxVisibleCharacters =
			extension_settings[extensionName].maxViewableCharacters;

		if (allSprites.length > maxVisibleCharacters) {
			const recentTalkingCharacters =
				getRecentTalkingCharacters(maxVisibleCharacters);

			// Add displayNone to all sprites that are not in the recentTalkingCharacters list
			allSprites.each((_, sprite) => {
				const spriteId = $(sprite).attr("id");
				if (
					!recentTalkingCharacters.includes(spriteId.replace("expression-", ""))
				) {
					$(sprite).addClass("displayNone");
				}
			});
		}
	}
}
