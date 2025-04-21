import { extensionName, defaultSettings } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { isGroupChat } from "../utils.js";

/* Sprite Scale Functions */
export function applySpriteScale() {
	if (extension_settings[extensionName].scaleSprites === (null || undefined)) {
		console.debug(
			`[${extensionName}] scaleSprites returned null or undefined.`,
		);
	}

	console.debug(
		`[${extensionName}] Sprite Scale?: ${extension_settings[extensionName].scaleSprites}`,
	);

	$("body").toggleClass(
		"spriteScale",
		extension_settings[extensionName].scaleSprites,
	);

	applyScale();
}

function resetSpriteScale() {
	extension_settings[extensionName].maxSpriteScale =
		defaultSettings.maxSpriteScale;
	$("#prome-sprite-scale-size").val(defaultSettings.maxSpriteScale);
	$("#prome-sprite-scale-size-counter").val(defaultSettings.maxSpriteScale);
	saveSettingsDebounced();
	applyScale();
}

export function onSpriteScale_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].scaleSprites = value;
	saveSettingsDebounced();
	applySpriteScale();
}

export function onSpriteScale_Change() {
	const value = Number(this.value);
	if (value < 0.1 || value > 2) {
		console.error(`[${extensionName}] Invalid scale value: ${value}`);
		return;
	}
	extension_settings[extensionName].maxSpriteScale = value;
	$("#prome-sprite-scale-size").val(value);
	$("#prome-sprite-scale-size-counter").val(value);
	saveSettingsDebounced();
	applyScale();
}

export function applyScale() {
	// apply sprite scale to all sprites
	document.documentElement.style.setProperty(
		"--prome-sprite-scale",
		extension_settings[extensionName].maxSpriteScale,
	);

	let sprites;
	if (isGroupChat()) {
		sprites = $("#visual-novel-wrapper").find("div");
	} else {
		sprites = $("#expression-wrapper").find("div");
	}

	// loop through all divs
	for (const d of sprites) {
		if (extension_settings[extensionName].scaleSprites) {
			// apply scale
			$(d).addClass("prome-sprite-scale");
		} else {
			// remove scale
			$(d).removeClass("prome-sprite-scale");
		}
	}
}

export function setupScaleHTML() {
	$("#prome-sprite-scale").prop(
		"checked",
		extension_settings[extensionName].scaleSprites,
	);
	$("#prome-sprite-scale-size").val(
		extension_settings[extensionName].maxSpriteScale,
	);
	$("#prome-sprite-scale-size-counter").val(
		extension_settings[extensionName].maxSpriteScale,
	);
}

export function setupScaleJQuery() {
	$("#prome-sprite-scale").on("click", onSpriteScale_Click);
	$("#prome-sprite-scale-size").on("input", onSpriteScale_Change);
	$("#prome-sprite-scale-size-counter").on("input", onSpriteScale_Change);
	$("#prome-sprite-scale-size-restore").on("click", resetSpriteScale);
}
