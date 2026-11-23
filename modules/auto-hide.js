import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import {
	defaultSettings,
	extensionFolderPath,
	extensionName,
} from "../constants.js";
import { emitPromeEvent } from "../core/bus.js";
import { getRecentTalkingCharacters, isGroupChat } from "../utils.js";

export function filterActiveGroupCharacters(characters) {
	const settings = extension_settings[extensionName];
	if (!isGroupChat() || !settings.autoHideSprites) {
		return characters;
	}

	const maxVisible = Number(settings.maxViewableCharacters) || 5;
	if (characters.length <= maxVisible) {
		return characters;
	}

	// Get the most recent speaking avatar filenames from chat history
	const recentAvatars = getRecentTalkingCharacters(maxVisible);
	const recentSet = new Set(recentAvatars);

	// Keep the recent speakers
	const visibleCharacters = characters.filter((c) => recentSet.has(c.avatar));

	// If chat history has fewer speakers than maxVisible (e.g. early in chat),
	// fill the remaining slots with other group members so the stage isn't empty
	if (visibleCharacters.length < maxVisible) {
		for (const char of characters) {
			if (!visibleCharacters.includes(char)) {
				visibleCharacters.push(char);
				if (visibleCharacters.length >= maxVisible) break;
			}
		}
	}
	return visibleCharacters;
}

// --- Module Lifecycle ---
export async function initAutoHideModule() {
	try {
		const html = await $.get(
			`${extensionFolderPath}/html/modules/auto-hide.html`,
		);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load auto-hide module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-auto-hide-sprites").prop("checked", settings.autoHideSprites);
	$("#prome-sprite-max-visible").val(settings.maxViewableCharacters);

	// Bind event handlers
	$("#prome-auto-hide-sprites").on("click", (e) => {
		settings.autoHideSprites = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");
	});

	$("#prome-sprite-max-visible").on("input", (e) => {
		const val = Number(e.target.value);
		if (val >= 1 && val <= 8) {
			settings.maxViewableCharacters = val;
			saveSettingsDebounced();
			emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");
		}
	});

	$("#prome-sprite-max-visible-restore").on("click", () => {
		const def = defaultSettings.maxViewableCharacters;
		settings.maxViewableCharacters = def;
		$("#prome-sprite-max-visible").val(def);
		saveSettingsDebounced();
		emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");
	});
}
