import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { callGenericPopup, POPUP_TYPE } from "../../../../popup.js";
import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import { extensionFolderPath, extensionName } from "../constants.js";

const FILTER_PROPS = [
	"blur",
	"brightness",
	"contrast",
	"grayscale",
	"hue",
	"invert",
	"saturate",
	"sepia",
];

// --- CSS Class / Helpers ---
export function applyTint() {
	const settings = extension_settings[extensionName];
	const current = settings.currentTintValues;
	$("body").toggleClass("worldTint", Boolean(settings.worldTint));
	$("body").toggleClass("tintWorld", Boolean(current?.world?.enabled));
	$("body").toggleClass("tintCharacter", Boolean(current?.character?.enabled));
	$("body").toggleClass("tintShared", Boolean(current?.shared));
	addTint();
}

function addTint() {
	const current = extension_settings[extensionName].currentTintValues;
	if (!current) return;

	const buildFilter = (cfg) =>
		`blur(${cfg.blur}px) brightness(${cfg.brightness}%) contrast(${cfg.contrast}%) ` +
		`grayscale(${cfg.grayscale}%) hue-rotate(${cfg.hue}deg) invert(${cfg.invert}%) ` +
		`saturate(${cfg.saturate}%) sepia(${cfg.sepia}%)`;

	document.documentElement.style.setProperty(
		"--prome-background-tint-filter",
		buildFilter(current.world),
	);
	document.documentElement.style.setProperty(
		"--prome-character-tint-filter",
		buildFilter(current.character),
	);
}

// --- Module Lifecycle ---
export async function initTintModule() {
	try {
		const html = await $.get(`${extensionFolderPath}/html/modules/tint.html`);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load tint module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];
	const preset = settings.currentTintValues;

	// Sync UI state with settings
	$("#prome-tint-enable").prop("checked", settings.worldTint);
	$("#prome-tint-preset").val(preset.name);
	$("#prome-tint-share").prop("checked", preset.shared);
	$("#prome-world-tint").prop("checked", preset.world.enabled);
	$("#prome-character-tint").prop("checked", preset.character.enabled);

	for (const target of ["world", "character"]) {
		for (const prop of FILTER_PROPS) {
			$(`#prome-${target}-${prop}`).val(preset[target][prop]);
		}
	}

	// Populate preset dropdown
	$("#prome-tint-preset").empty();
	for (const tint of settings.tintPresets) {
		const option = document.createElement("option");
		option.value = tint.name;
		option.text = tint.name;
		option.selected = tint.name === settings.selectedTint;
		$("#prome-tint-preset").append(option);
	}

	// Bind event handlers
	$("#prome-tint-enable").on("click", (e) => {
		settings.worldTint = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applyTint();
	});
	$("#prome-tint-share").on("click", (e) => {
		settings.currentTintValues.shared = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applyTint();
	});
	$("#prome-world-tint").on("click", (e) => {
		settings.currentTintValues.world.enabled = Boolean(
			$(e.target).prop("checked"),
		);
		saveSettingsDebounced();
		applyTint();
	});
	$("#prome-character-tint").on("click", (e) => {
		settings.currentTintValues.character.enabled = Boolean(
			$(e.target).prop("checked"),
		);
		saveSettingsDebounced();
		applyTint();
	});

	for (const target of ["world", "character"]) {
		for (const prop of FILTER_PROPS) {
			$(`#prome-${target}-${prop}`).on("input", function () {
				const val = Number(this.value);
				if (val >= 0) {
					settings.currentTintValues[target][prop] = val;
					saveSettingsDebounced();
					addTint();
				}
			});
		}
	}

	// Bind preset buttons
	$("#prome-tint-preset").on("change", onTintPreset_Select);
	$("#prome-tint-save").on("click", onTintPreset_Save);
	$("#prome-tint-delete").on("click", onTintPreset_Delete);

	registerTintCommands();
	applyTint();
}

function onTintPreset_Select() {
	const selectedTint = String($("#prome-tint-preset").find(":selected").val());
	const presetObject = extension_settings[extensionName].tintPresets.find(
		(preset) => preset.name === selectedTint,
	);

	if (!presetObject) {
		toastr.warning(`Could not find the selected tint preset: ${selectedTint}`);
		return;
	}

	extension_settings[extensionName].currentTintValues = JSON.parse(
		JSON.stringify(presetObject),
	);
	extension_settings[extensionName].selectedTint = presetObject.name;

	$("#prome-tint-share").prop("checked", presetObject.shared);

	// Apply World Tint Values
	$("#prome-world-tint").prop("checked", presetObject.world.enabled);
	$("#prome-world-blur").val(presetObject.world.blur);
	$("#prome-world-brightness").val(presetObject.world.brightness);
	$("#prome-world-contrast").val(presetObject.world.contrast);
	$("#prome-world-grayscale").val(presetObject.world.grayscale);
	$("#prome-world-hue").val(presetObject.world.hue);
	$("#prome-world-invert").val(presetObject.world.invert);
	$("#prome-world-saturate").val(presetObject.world.saturate);
	$("#prome-world-sepia").val(presetObject.world.sepia);

	// Apply Character Tint Values
	$("#prome-character-tint").prop("checked", presetObject.character.enabled);
	$("#prome-character-blur").val(presetObject.character.blur);
	$("#prome-character-brightness").val(presetObject.character.brightness);
	$("#prome-character-contrast").val(presetObject.character.contrast);
	$("#prome-character-grayscale").val(presetObject.character.grayscale);
	$("#prome-character-hue").val(presetObject.character.hue);
	$("#prome-character-invert").val(presetObject.character.invert);
	$("#prome-character-saturate").val(presetObject.character.saturate);
	$("#prome-character-sepia").val(presetObject.character.sepia);
	saveSettingsDebounced();
	applyTint();
}

async function onTintPreset_Delete() {
	const selectedStyle = String($("#prome-tint-preset").find(":selected").val());
	const presetObject = extension_settings[extensionName].tintPresets.find(
		(preset) => preset.name === selectedStyle,
	);

	if (!presetObject) return;

	const confirm = await callGenericPopup(
		$("<p>").text(`Delete tint preset "${selectedStyle}"?`),
		POPUP_TYPE.CONFIRM,
		"",
		{ okButton: "Delete", cancelButton: "Cancel" },
	);
	if (!confirm) return;

	const index =
		extension_settings[extensionName].tintPresets.indexOf(presetObject);
	if (index === -1) return;

	extension_settings[extensionName].tintPresets.splice(index, 1);
	$("#prome-tint-preset option")
		.filter((_, option) => option.value === selectedStyle)
		.remove();

	if (extension_settings[extensionName].tintPresets.length > 0) {
		extension_settings[extensionName].selectedTint =
			extension_settings[extensionName].tintPresets[0].name;
		$("#prome-tint-preset")
			.val(extension_settings[extensionName].selectedTint)
			.trigger("change");
	} else {
		extension_settings[extensionName].selectedTint = "";
		extension_settings[extensionName].currentTintValues.name = "";
		extension_settings[extensionName].currentTintValues.shared = false;
		extension_settings[extensionName].currentTintValues.world.enabled = false;
		extension_settings[extensionName].currentTintValues.world.blur = 0;
		extension_settings[extensionName].currentTintValues.world.brightness = 100;
		extension_settings[extensionName].currentTintValues.world.contrast = 100;
		extension_settings[extensionName].currentTintValues.world.grayscale = 0;
		extension_settings[extensionName].currentTintValues.world.hue = 0;
		extension_settings[extensionName].currentTintValues.world.invert = 0;
		extension_settings[extensionName].currentTintValues.world.saturate = 100;
		extension_settings[extensionName].currentTintValues.world.sepia = 0;
		extension_settings[extensionName].currentTintValues.character.enabled =
			false;
		extension_settings[extensionName].currentTintValues.character.blur = 0;
		extension_settings[extensionName].currentTintValues.character.brightness =
			100;
		extension_settings[extensionName].currentTintValues.character.contrast =
			100;
		extension_settings[extensionName].currentTintValues.character.grayscale = 0;
		extension_settings[extensionName].currentTintValues.character.hue = 0;
		extension_settings[extensionName].currentTintValues.character.invert = 0;
		extension_settings[extensionName].currentTintValues.character.saturate =
			100;
		extension_settings[extensionName].currentTintValues.character.sepia = 0;

		$("#prome-tint-preset").val("");
		$("#prome-tint-share").prop("checked", false);
		$("#prome-world-tint").prop("checked", false);
		$("#prome-world-blur").val(0);
		$("#prome-world-brightness").val(100);
		$("#prome-world-contrast").val(100);
		$("#prome-world-grayscale").val(0);
		$("#prome-world-hue").val(0);
		$("#prome-world-invert").val(0);
		$("#prome-world-saturate").val(100);
		$("#prome-world-sepia").val(0);
		$("#prome-character-tint").prop("checked", false);
		$("#prome-character-blur").val(0);
		$("#prome-character-brightness").val(100);
		$("#prome-character-contrast").val(100);
		$("#prome-character-grayscale").val(0);
		$("#prome-character-hue").val(0);
		$("#prome-character-invert").val(0);
		$("#prome-character-saturate").val(100);
		$("#prome-character-sepia").val(0);
	}

	saveSettingsDebounced();
	applyTint();
}

async function onTintPreset_Save() {
	const userInput = await callGenericPopup(
		"Enter the name of the tint preset:",
		POPUP_TYPE.INPUT,
	);

	if (!userInput) return;
	const name = String(userInput).trim();
	if (!name) return;

	const settings = extension_settings[extensionName];

	// Deep copy the current tint values
	const newPreset = JSON.parse(JSON.stringify(settings.currentTintValues));
	newPreset.name = name;

	// Check if a preset with the same name already exists
	const existingPresetIndex = settings.tintPresets.findIndex(
		(preset) => preset.name === name,
	);

	if (existingPresetIndex !== -1) {
		// Update the existing preset
		settings.tintPresets[existingPresetIndex] = newPreset;
	} else {
		// Add the new preset
		settings.tintPresets.push(newPreset);
		const option = document.createElement("option");
		option.value = name;
		option.text = name;
		$("#prome-tint-preset").append(option);
	}

	// Mark the new preset as selected
	settings.selectedTint = name;
	settings.currentTintValues = structuredClone(newPreset);
	$("#prome-tint-preset").val(name);

	saveSettingsDebounced();
	toastr.success(`Tint preset "${name}" has been saved.`, "Tint Preset Saved");
}

// --- Tint Preset Commands ---
function registerTintCommands() {
	const settings = extension_settings[extensionName];

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "tint",
			callback: async () => {
				switchTintMode();
				toastr.success(
					`World tint is now ${settings.worldTint ? "enabled" : "disabled"}.`,
					"World Tint Status",
				);
				return settings.worldTint;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles world/character tint on the VN UI.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "tint-world",
			callback: async () => {
				switchTintWorldMode();
				toastr.success(
					`World tint is now ${
						settings.currentTintValues.world.enabled ? "enabled" : "disabled"
					}.`,
					"World Tint Status",
				);
				return settings.currentTintValues.world.enabled;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles the world tint on the VN UI.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "tint-characters",
			callback: async () => {
				switchTintCharacterMode();
				toastr.success(
					`Character tint is now ${
						settings.currentTintValues.character.enabled
							? "enabled"
							: "disabled"
					}.`,
					"Character Tint Status",
				);
				return settings.currentTintValues.character.enabled;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles the character tint on the VN UI.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "tint-share",
			callback: async () => {
				switchTintSharedMode();
				toastr.success(
					`Shared tint is now ${
						settings.currentTintValues.shared ? "enabled" : "disabled"
					}.`,
					"Shared Tint Status",
				);
				return settings.currentTintValues.shared;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles sharing world tint with character sprites (This will override Character Tint).",
		}),
	);
}

function switchTintMode() {
	extension_settings[extensionName].worldTint =
		!extension_settings[extensionName].worldTint;
	saveSettingsDebounced();
	$("#prome-tint-enable")
		.prop("checked", extension_settings[extensionName].worldTint)
		.trigger("input");
	applyTint();
}

function switchTintWorldMode() {
	extension_settings[extensionName].currentTintValues.world.enabled =
		!extension_settings[extensionName].currentTintValues.world.enabled;
	saveSettingsDebounced();
	$("#prome-world-tint")
		.prop(
			"checked",
			extension_settings[extensionName].currentTintValues.world.enabled,
		)
		.trigger("input");
	applyTint();
}

function switchTintCharacterMode() {
	extension_settings[extensionName].currentTintValues.character.enabled =
		!extension_settings[extensionName].currentTintValues.character.enabled;
	saveSettingsDebounced();
	$("#prome-character-tint")
		.prop(
			"checked",
			extension_settings[extensionName].currentTintValues.character.enabled,
		)
		.trigger("input");
	applyTint();
}

function switchTintSharedMode() {
	extension_settings[extensionName].currentTintValues.shared =
		!extension_settings[extensionName].currentTintValues.shared;
	saveSettingsDebounced();
	$("#prome-tint-share")
		.prop("checked", extension_settings[extensionName].currentTintValues.shared)
		.trigger("input");
	applyTint();
}
