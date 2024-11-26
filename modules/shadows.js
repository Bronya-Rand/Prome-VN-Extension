import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

/* Sprite Shadow Functions */
export function applySpriteShadow() {
	if (extension_settings[extensionName].spriteShadow === (null || undefined)) {
		console.debug(
			`[${extensionName}] spriteShadow returned null or undefined.`,
		);
	}

	console.debug(
		`[${extensionName}] Sprite Shadow?: ${extension_settings[extensionName].spriteShadow}`,
	);

	$("body").toggleClass(
		"spriteShadow",
		extension_settings[extensionName].spriteShadow,
	);
}

export function onSpriteShadow_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].spriteShadow = value;
	saveSettingsDebounced();
	applySpriteShadow();
}
