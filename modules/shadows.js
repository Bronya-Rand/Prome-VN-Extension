import { defaultSettings, extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

/* Sprite Shadow Functions */
/* Action Functions */
function onSpriteShadow_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].spriteShadow = value;
	saveSettingsDebounced();
	applySpriteShadow();
}

function onSpriteShadowOffsetX_Change() {
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

function onSpriteShadowOffsetY_Change() {
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

function onSpriteShadowBlur_Change() {
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
		"--prome-sprite-shadow-offsetx",
		`${extension_settings[extensionName].shadowOffsetX}px`,
	);
}

export function applySpriteShadowOffsetY() {
	document.documentElement.style.setProperty(
		"--prome-sprite-shadow-offsety",
		`${extension_settings[extensionName].shadowOffsetY}px`,
	);
}

export function applySpriteShadowBlur() {
	document.documentElement.style.setProperty(
		"--prome-sprite-shadow-blur",
		`${extension_settings[extensionName].shadowBlur}px`,
	);
}

/* Reset Functions */
function resetSpriteShadowOffsetX() {
	extension_settings[extensionName].shadowOffsetX =
		defaultSettings.shadowOffsetX;
	$("#prome-sprite-shadow-offsetx")
		.val(defaultSettings.shadowOffsetX)
		.trigger("input");
	$("#prome-sprite-shadow-offsetx-counter").val(defaultSettings.shadowOffsetX);
	saveSettingsDebounced();
}

function resetSpriteShadowOffsetY() {
	extension_settings[extensionName].shadowOffsetY =
		defaultSettings.shadowOffsetY;
	$("#prome-sprite-shadow-offsety")
		.val(defaultSettings.shadowOffsetY)
		.trigger("input");
	$("#prome-sprite-shadow-offsety-counter").val(defaultSettings.shadowOffsetY);
	saveSettingsDebounced();
}

function resetSpriteShadowBlur() {
	extension_settings[extensionName].shadowBlur = defaultSettings.shadowBlur;
	$("#prome-sprite-shadow-blur")
		.val(defaultSettings.shadowBlur)
		.trigger("input");
	$("#prome-sprite-shadow-blur-counter").val(defaultSettings.shadowBlur);
	saveSettingsDebounced();
}

export function setupSpriteShadowHTML() {
	$("#prome-sprite-shadow").prop(
		"checked",
		extension_settings[extensionName].spriteShadow,
	);
	$("#prome-sprite-shadow-offsetx").val(
		extension_settings[extensionName].shadowOffsetX,
	);
	$("#prome-sprite-shadow-offsetx-counter").val(
		extension_settings[extensionName].shadowOffsetX,
	);
	$("#prome-sprite-shadow-offsety").val(
		extension_settings[extensionName].shadowOffsetY,
	);
	$("#prome-sprite-shadow-offsety-counter").val(
		extension_settings[extensionName].shadowOffsetY,
	);
	$("#prome-sprite-shadow-blur").val(
		extension_settings[extensionName].shadowBlur,
	);
	$("#prome-sprite-shadow-blur-counter").val(
		extension_settings[extensionName].shadowBlur,
	);
}

export function setupSpriteShadowJQuery() {
	$("#prome-sprite-shadow").on("click", onSpriteShadow_Click);
	$("#prome-sprite-shadow-offsetx").on("input", onSpriteShadowOffsetX_Change);
	$("#prome-sprite-shadow-offsetx-counter").on(
		"input",
		onSpriteShadowOffsetX_Change,
	);
	$("#prome-sprite-shadow-offsety").on("input", onSpriteShadowOffsetY_Change);
	$("#prome-sprite-shadow-offsety-counter").on(
		"input",
		onSpriteShadowOffsetY_Change,
	);
	$("#prome-sprite-shadow-blur").on("input", onSpriteShadowBlur_Change);
	$("#prome-sprite-shadow-blur-counter").on("input", onSpriteShadowBlur_Change);
	$("#prome-sprite-shadow-offsetx-restore").on(
		"click",
		resetSpriteShadowOffsetX,
	);
	$("#prome-sprite-shadow-offsety-restore").on(
		"click",
		resetSpriteShadowOffsetY,
	);
	$("#prome-sprite-shadow-blur-restore").on("click", resetSpriteShadowBlur);
}
