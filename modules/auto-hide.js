import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import {
	getGroupIndex,
	getRecentTalkingCharacters,
	isAutoHideSpritesEnabled,
	isUserSpriteEnabled,
} from "../utils.js";
import { visualNovelUpdateLayers } from "../../../expressions/index.js";

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

	handleAutoHideSprites();
}

export function onAutoHideSprites_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].autoHideSprites = value;
	saveSettingsDebounced();
	applyAutoHideSprites();
}

export async function onAutoHideMaxSprites_Change() {
	const vnWrapper = $("#visual-novel-wrapper");
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
	handleAutoHideSprites();
	await visualNovelUpdateLayers(vnWrapper);
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
	// Get all characters within the '#visual-novel-wrapper' div
	const vnWrapper = $("#visual-novel-wrapper");
	const allSprites = vnWrapper.find("div");

	// If the user is not in a group or auto-hide is disabled, exit
	if (groupIndex === -1 || !isAutoHideSpritesEnabled()) {
		allSprites.removeClass("displayNone").css("display", "inherit");
		if (groupIndex !== -1) await visualNovelUpdateLayers(vnWrapper);
		return;
	}

	const maxVisibleCharacters =
		extension_settings[extensionName].maxViewableCharacters;

	// Exit if not enough characters to hide
	if (allSprites.length <= maxVisibleCharacters) {
		allSprites.removeClass("displayNone");
		allSprites.css("display", "inherit");
	} else {
		const recentTalkingCharacters =
			getRecentTalkingCharacters(maxVisibleCharacters);
		const visibleCharacterIds = new Set(recentTalkingCharacters);

		const spritesToShow = [];
		const spritesToHide = [];

		allSprites.each((_, sprite) => {
			const $sprite = $(sprite);

			// Skip if User Sprite
			if (
				isUserSpriteEnabled() &&
				$sprite.attr("id") === "expression-prome-user"
			) {
				spritesToShow.push($sprite);
				return;
			}

			const characterId = $sprite.data().avatar;

			if (visibleCharacterIds.has(characterId)) {
				spritesToShow.push($sprite);
			} else {
				spritesToHide.push($sprite);
			}
		});

		if (spritesToShow.length > 0) {
			for (const sprite of spritesToShow) {
				sprite.removeClass("displayNone");
				sprite.css("display", "inherit");
			}
		}

		if (spritesToHide.length > 0) {
			for (const sprite of spritesToHide) {
				sprite.addClass("displayNone");
			}
		}
	}

	await visualNovelUpdateLayers(vnWrapper);
	return;
}
