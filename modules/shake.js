import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

/* Sprite Shake Functions */
export function applySpriteShake() {
	if (extension_settings[extensionName].spriteShake === (null || undefined)) {
		console.debug(`[${extensionName}] spriteShake returned null or undefined.`);
	}

	console.debug(
		`[${extensionName}] Sprite Shake?: ${extension_settings[extensionName].spriteShake}`,
	);

	$("body").toggleClass(
		"spriteShake",
		extension_settings[extensionName].spriteShake,
	);
}

export function onSpriteShake_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].spriteShake = value;
	saveSettingsDebounced();
	applySpriteShake();
}
