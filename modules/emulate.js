import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { emulateSpritesDebounce } from "../listeners.js";

export async function applySpriteEmulation() {
	if (
		extension_settings[extensionName].emulateSprites === (null || undefined)
	) {
		console.debug(
			`[${extensionName}] emulateSprites returned null or undefined.`,
		);
	}

	console.debug(
		`[${extensionName}] Sprite Emulation?: ${extension_settings[extensionName].emulateSprites}`,
	);

	$("body").toggleClass(
		"emulateSprites",
		extension_settings[extensionName].emulateSprites,
	);

	emulateSpritesDebounce();
}

export function onSpriteEmulation_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].emulateSprites = value;
	saveSettingsDebounced();
	applySpriteEmulation();
}
