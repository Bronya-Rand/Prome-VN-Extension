import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import {
	defaultSettings,
	extensionFolderPath,
	extensionName,
} from "../constants.js";

// --- CSS Class / Helpers ---
function applyScaleSettings() {
	const settings = extension_settings[extensionName];

	$("body").toggleClass("spriteScale", Boolean(settings.scaleSprites));

	document.documentElement.style.setProperty(
		"--prome-sprite-scale",
		settings.maxSpriteScale,
	);
}

// --- Module Lifecycle ---
export async function initScaleModule() {
	try {
		const html = await $.get(`${extensionFolderPath}/html/modules/scale.html`);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load scale module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-sprite-scale").prop("checked", settings.scaleSprites);
	$("#prome-sprite-scale-size").val(settings.maxSpriteScale);
	$("#prome-sprite-scale-size-counter").val(settings.maxSpriteScale);

	// Bind event handlers
	$("#prome-sprite-scale").on("click", (e) => {
		settings.scaleSprites = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applyScaleSettings();
	});

	$("#prome-sprite-scale-size").on("input", updateScale);
	$("#prome-sprite-scale-size-counter").on("input", updateScale);
	$("#prome-sprite-scale-size-restore").on("click", () => {
		settings.maxSpriteScale = defaultSettings.maxSpriteScale;
		$("#prome-sprite-scale-size").val(defaultSettings.maxSpriteScale);
		$("#prome-sprite-scale-size-counter").val(defaultSettings.maxSpriteScale);
		saveSettingsDebounced();
		applyScaleSettings();
	});

	applyScaleSettings();
}

function updateScale(event) {
	const value = Number(event.target.value);
	if (value >= 0.1 && value <= 2) {
		extension_settings[extensionName].maxSpriteScale = value;

		if (event.target.id === "prome-sprite-scale-size") {
			$("#prome-sprite-scale-size-counter").val(value);
		} else {
			$("#prome-sprite-scale-size").val(value);
		}

		saveSettingsDebounced();
		applyScaleSettings();
	}
}
