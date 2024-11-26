import { defaultSettings, extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

/* Sprite Shadow Functions */
/* Action Functions */
export function onSpriteShadow_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].spriteShadow = value;
	saveSettingsDebounced();
	applySpriteShadow();
}

export function onSpriteShadowOffsetX_Change() {
	const value = this.value;
	if (value < 1 || value > 20) {
		console.error(`[${extensionName}] Invalid shadow offset x value: ${value}`);
		return;
	}
	extension_settings[extensionName].shadowOffsetX = value;
	$("#prome-sprite-shadow-offsetx").val(value);
	$("#prome-sprite-shadow-offsetx-counter").val(value);
	saveSettingsDebounced();
	applySpriteShadowOffsetX();
}

export function onSpriteShadowOffsetY_Change() {
	const value = this.value;
	if (value < 1 || value > 20) {
		console.error(`[${extensionName}] Invalid shadow offset y value: ${value}`);
		return;
	}
	extension_settings[extensionName].shadowOffsetY = value;
	$("#prome-sprite-shadow-offsety").val(value);
	$("#prome-sprite-shadow-offsety-counter").val(value);
	saveSettingsDebounced();
	applySpriteShadowOffsetY();
}

export function onSpriteShadowBlur_Change() {
	const value = this.value;
	if (value < 1 || value > 20) {
		console.error(`[${extensionName}] Invalid shadow blur value: ${value}`);
		return;
	}
	extension_settings[extensionName].shadowBlur = value;
	$("#prome-sprite-shadow-blur").val(value);
	$("#prome-sprite-shadow-blur-counter").val(value);
	saveSettingsDebounced();
	applySpriteShadowBlur();
}

/* Apply Functions */
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

export function applySpriteShadowOffsetX() {
	document.documentElement.style.setProperty(
		"--prom-sprite-shadow-offsetx",
		`${extension_settings[extensionName].shadowOffsetX}px`,
	);
}

export function applySpriteShadowOffsetY() {
	document.documentElement.style.setProperty(
		"--prom-sprite-shadow-offsety",
		`${extension_settings[extensionName].shadowOffsetY}px`,
	);
}

export function applySpriteShadowBlur() {
	document.documentElement.style.setProperty(
		"--prom-sprite-shadow-blur",
		`${extension_settings[extensionName].shadowBlur}px`,
	);
}

/* Reset Functions */
export function resetSpriteShadowOffsetX() {
	extension_settings[extensionName].shadowOffsetX =
		defaultSettings.shadowOffsetX;
	$("#prome-sprite-shadow-offsetx")
		.val(defaultSettings.shadowOffsetX)
		.trigger("input");
	$("#prome-sprite-shadow-offsetx-counter").val(defaultSettings.shadowOffsetX);
	saveSettingsDebounced();
}

export function resetSpriteShadowOffsetY() {
	extension_settings[extensionName].shadowOffsetY =
		defaultSettings.shadowOffsetY;
	$("#prome-sprite-shadow-offsety")
		.val(defaultSettings.shadowOffsetY)
		.trigger("input");
	$("#prome-sprite-shadow-offsety-counter").val(defaultSettings.shadowOffsetY);
	saveSettingsDebounced();
}

export function resetSpriteShadowBlur() {
	extension_settings[extensionName].shadowBlur = defaultSettings.shadowBlur;
	$("#prome-sprite-shadow-blur")
		.val(defaultSettings.shadowBlur)
		.trigger("input");
	$("#prome-sprite-shadow-blur-counter").val(defaultSettings.shadowBlur);
	saveSettingsDebounced();
}
