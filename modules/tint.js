import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { extensionName } from "../constants.js";
import { POPUP_TYPE, callGenericPopup } from "../../../../popup.js";

export function applyTint() {
	if (extension_settings[extensionName].worldTint === (null || undefined)) {
		console.debug(`[${extensionName}] worldTint returned null or undefined.`);
	}
	if (
		extension_settings[extensionName].currentTintValues.shared ===
		(null || undefined)
	) {
		console.debug(`[${extensionName}] tintShared returned null or undefined.`);
	}

	console.debug(
		`[${extensionName}] World Tint?: ${extension_settings[extensionName].worldTint}`,
	);
	console.debug(
		`[${extensionName}] Shared Tint?: ${extension_settings[extensionName].currentTintValues.shared}`,
	);

	$("body").toggleClass(
		"worldTint",
		extension_settings[extensionName].worldTint,
	);

	$("body").toggleClass(
		"tintWorld",
		extension_settings[extensionName].currentTintValues.world.enabled,
	);

	$("body").toggleClass(
		"tintCharacter",
		extension_settings[extensionName].currentTintValues.character.enabled,
	);

	$("body").toggleClass(
		"tintShared",
		extension_settings[extensionName].currentTintValues.shared,
	);

	addTint();
}

function addTint() {
	const worldTintFilter = `blur(${extension_settings[extensionName].currentTintValues.world.blur}px) brightness(${extension_settings[extensionName].currentTintValues.world.brightness}%) contrast(${extension_settings[extensionName].currentTintValues.world.contrast}%) grayscale(${extension_settings[extensionName].currentTintValues.world.grayscale}%) hue-rotate(${extension_settings[extensionName].currentTintValues.world.hue}deg) invert(${extension_settings[extensionName].currentTintValues.world.invert}%) saturate(${extension_settings[extensionName].currentTintValues.world.saturate}%) sepia(${extension_settings[extensionName].currentTintValues.world.sepia}%)`;
	const characterTintFilter = `blur(${extension_settings[extensionName].currentTintValues.character.blur}px) brightness(${extension_settings[extensionName].currentTintValues.character.brightness}%) contrast(${extension_settings[extensionName].currentTintValues.character.contrast}%) grayscale(${extension_settings[extensionName].currentTintValues.character.grayscale}%) hue-rotate(${extension_settings[extensionName].currentTintValues.character.hue}deg) invert(${extension_settings[extensionName].currentTintValues.character.invert}%) saturate(${extension_settings[extensionName].currentTintValues.character.saturate}%) sepia(${extension_settings[extensionName].currentTintValues.character.sepia}%)`;

	document.documentElement.style.setProperty(
		"--prome-background-tint-filter",
		worldTintFilter,
	);
	document.documentElement.style.setProperty(
		"--prome-character-tint-filter",
		characterTintFilter,
	);
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
		`Are you sure you want to delete the tint preset: ${selectedStyle}?`,
		POPUP_TYPE.CONFIRM,
		"",
		{ okButton: "Delete", cancelButton: "Cancel" },
	);
	if (!confirm) return;

	const index =
		extension_settings[extensionName].tintPresets.indexOf(presetObject);
	if (index === -1) return;

	extension_settings[extensionName].tintPresets.splice(index, 1);
	$("#prome-tint-preset").find(`option[value="${selectedStyle}"]`).remove();

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
	const shared = Boolean($("#prome-tint-share").val());
	const worldEnabled = Boolean($("#prome-world-tint").val());
	const worldBlur = Number($("#prome-world-blur").val());
	const worldBrightness = Number($("#prome-world-brightness").val());
	const worldContrast = Number($("#prome-world-contrast").val());
	const worldGrayscale = Number($("#prome-world-grayscale").val());
	const worldHue = Number($("#prome-world-hue").val());
	const worldInvert = Number($("#prome-world-invert").val());
	const worldSaturate = Number($("#prome-world-saturate").val());
	const worldSepia = Number($("#prome-world-sepia").val());
	const characterEnabled = Boolean($("#prome-character-tint").val());
	const characterBlur = Number($("#prome-character-blur").val());
	const characterBrightness = Number($("#prome-character-brightness").val());
	const characterContrast = Number($("#prome-character-contrast").val());
	const characterGrayscale = Number($("#prome-character-grayscale").val());
	const characterHue = Number($("#prome-character-hue").val());
	const characterInvert = Number($("#prome-character-invert").val());
	const characterSaturate = Number($("#prome-character-saturate").val());
	const characterSepia = Number($("#prome-character-sepia").val());

	const alreadyExists = extension_settings[extensionName].tintPresets.find(
		(preset) => preset.name === name,
	);

	if (alreadyExists) {
		alreadyExists.shared = shared;
		alreadyExists.world.enabled = worldEnabled;
		alreadyExists.world.blur = worldBlur;
		alreadyExists.world.brightness = worldBrightness;
		alreadyExists.world.contrast = worldContrast;
		alreadyExists.world.grayscale = worldGrayscale;
		alreadyExists.world.hue = worldHue;
		alreadyExists.world.invert = worldInvert;
		alreadyExists.world.saturate = worldSaturate;
		alreadyExists.world.sepia = worldSepia;
		alreadyExists.character.enabled = characterEnabled;
		alreadyExists.character.blur = characterBlur;
		alreadyExists.character.brightness = characterBrightness;
		alreadyExists.character.contrast = characterContrast;
		alreadyExists.character.grayscale = characterGrayscale;
		alreadyExists.character.hue = characterHue;
		alreadyExists.character.invert = characterInvert;
		alreadyExists.character.saturate = characterSaturate;
		alreadyExists.character.sepia = characterSepia;
		$("#prome-tint-preset").val(name);
		saveSettingsDebounced();
	}

	const tintObject = {
		name: name,
		shared: shared,
		world: {
			enabled: worldEnabled,
			blur: worldBlur,
			brightness: worldBrightness,
			contrast: worldContrast,
			grayscale: worldGrayscale,
			hue: worldHue,
			invert: worldInvert,
			saturate: worldSaturate,
			sepia: worldSepia,
		},
		character: {
			enabled: characterEnabled,
			blur: characterBlur,
			brightness: characterBrightness,
			contrast: characterContrast,
			grayscale: characterGrayscale,
			hue: characterHue,
			invert: characterInvert,
			saturate: characterSaturate,
			sepia: characterSepia,
		},
	};

	extension_settings[extensionName].tintPresets.push(tintObject);
	const option = document.createElement("option");
	option.value = name;
	option.text = name;
	option.selected = true;
	$("#prome-tint-preset").append(option);
	$("#prome-tint-preset").val(tintObject.name);
	extension_settings[extensionName].selectedTint = name;
	extension_settings[extensionName].currentTintValues = JSON.parse(
		JSON.stringify(tintObject),
	);
	saveSettingsDebounced();
}

/* UI Functions */
function onTintEnable_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].worldTint = value;
	saveSettingsDebounced();
	applyTint();
}

/* Preset Functions */
function onTintShare_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].currentTintValues.shared = value;
	saveSettingsDebounced();
	applyTint();
}

function onWorldTint_Click() {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].currentTintValues.world.enabled = value;
	saveSettingsDebounced();
	applyTint();
}

function onCharacterTint_Click() {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].currentTintValues.character.enabled = value;
	saveSettingsDebounced();
	applyTint();
}

function onWorldTintBlur_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid world blur value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.blur = value;
	$("#prome-world-blur").val(value);
	saveSettingsDebounced();
	addTint();
}

function onWorldTintBrightness_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(
			`[${extensionName}] Invalid world brightness value: ${value}`,
		);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.brightness = value;
	$("#prome-world-brightness").val(value);
	saveSettingsDebounced();
	addTint();
}

function onWorldTintContrast_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid world contrast value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.contrast = value;
	$("#prome-world-contrast").val(value);
	saveSettingsDebounced();
	addTint();
}

function onWorldTintGrayscale_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid world grayscale value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.grayscale = value;
	$("#prome-world-grayscale").val(value);
	saveSettingsDebounced();
	addTint();
}

function onWorldTintHue_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid world hue value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.hue = value;
	$("#prome-world-hue").val(value);
	saveSettingsDebounced();
	addTint();
}

function onWorldTintInvert_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid world invert value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.invert = value;
	$("#prome-world-invert").val(value);
	saveSettingsDebounced();
	addTint();
}

function onWorldTintSaturate_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid world saturate value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.saturate = value;
	$("#prome-world-saturate").val(value);
	saveSettingsDebounced();
	addTint();
}

function onWorldTintSepia_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid world sepia value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.world.sepia = value;
	$("#prome-world-sepia").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintBlur_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid character blur value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.blur = value;
	$("#prome-character-blur").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintBrightness_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(
			`[${extensionName}] Invalid character brightness value: ${value}`,
		);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.brightness =
		value;
	$("#prome-character-brightness").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintContrast_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(
			`[${extensionName}] Invalid character contrast value: ${value}`,
		);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.contrast =
		value;
	$("#prome-character-contrast").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintGrayscale_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(
			`[${extensionName}] Invalid character grayscale value: ${value}`,
		);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.grayscale =
		value;
	$("#prome-character-grayscale").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintHue_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid character hue value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.hue = value;
	$("#prome-character-hue").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintInvert_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(
			`[${extensionName}] Invalid character invert value: ${value}`,
		);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.invert = value;
	$("#prome-character-invert").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintSaturate_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(
			`[${extensionName}] Invalid character saturate value: ${value}`,
		);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.saturate =
		value;
	$("#prome-character-saturate").val(value);
	saveSettingsDebounced();
	addTint();
}

function onCharacterTintSepia_Change() {
	const value = this.value;
	if (value < 0) {
		console.error(`[${extensionName}] Invalid character sepia value: ${value}`);
		return;
	}
	extension_settings[extensionName].currentTintValues.character.sepia = value;
	$("#prome-character-sepia").val(value);
	saveSettingsDebounced();
	addTint();
}

export function setupTintHTML() {
	const preset = extension_settings[extensionName].currentTintValues;
	$("#prome-tint-enable").prop(
		"checked",
		extension_settings[extensionName].worldTint,
	);
	$("#prome-tint-preset").val(preset.name);
	$("#prome-tint-share").prop("checked", preset.shared);
	$("#prome-world-tint").prop("checked", preset.world.enabled);
	$("#prome-world-blur").val(preset.world.blur);
	$("#prome-world-brightness").val(preset.world.brightness);
	$("#prome-world-contrast").val(preset.world.contrast);
	$("#prome-world-grayscale").val(preset.world.grayscale);
	$("#prome-world-hue").val(preset.world.hue);
	$("#prome-world-invert").val(preset.world.invert);
	$("#prome-world-saturate").val(preset.world.saturate);
	$("#prome-world-sepia").val(preset.world.sepia);
	$("#prome-character-tint").prop("checked", preset.character.enabled);
	$("#prome-character-blur").val(preset.character.blur);
	$("#prome-character-brightness").val(preset.character.brightness);
	$("#prome-character-contrast").val(preset.character.contrast);
	$("#prome-character-grayscale").val(preset.character.grayscale);
	$("#prome-character-hue").val(preset.character.hue);
	$("#prome-character-invert").val(preset.character.invert);
	$("#prome-character-saturate").val(preset.character.saturate);
	$("#prome-character-sepia").val(preset.character.sepia);

	for (const tint of extension_settings[extensionName].tintPresets) {
		const option = document.createElement("option");
		option.value = tint.name;
		option.text = tint.name;
		option.selected =
			tint.name === extension_settings[extensionName].selectedTint;
		$("#prome-tint-preset").append(option);
	}

	applyTint();
}

export function setupTintJQuery() {
	$("#prome-tint-enable").on("click", onTintEnable_Click);
	$("#prome-tint-preset").on("change", onTintPreset_Select);
	$("#prome-tint-share").on("click", onTintShare_Click);
	$("#prome-tint-save").on("click", onTintPreset_Save);
	$("#prome-tint-delete").on("click", onTintPreset_Delete);
	$("#prome-world-tint").on("click", onWorldTint_Click);
	$("#prome-character-tint").on("click", onCharacterTint_Click);
	$("#prome-world-blur").on("input", onWorldTintBlur_Change);
	$("#prome-world-brightness").on("input", onWorldTintBrightness_Change);
	$("#prome-world-contrast").on("input", onWorldTintContrast_Change);
	$("#prome-world-grayscale").on("input", onWorldTintGrayscale_Change);
	$("#prome-world-hue").on("input", onWorldTintHue_Change);
	$("#prome-world-invert").on("input", onWorldTintInvert_Change);
	$("#prome-world-saturate").on("input", onWorldTintSaturate_Change);
	$("#prome-world-sepia").on("input", onWorldTintSepia_Change);
	$("#prome-character-blur").on("input", onCharacterTintBlur_Change);
	$("#prome-character-brightness").on(
		"input",
		onCharacterTintBrightness_Change,
	);
	$("#prome-character-contrast").on("input", onCharacterTintContrast_Change);
	$("#prome-character-grayscale").on("input", onCharacterTintGrayscale_Change);
	$("#prome-character-hue").on("input", onCharacterTintHue_Change);
	$("#prome-character-invert").on("input", onCharacterTintInvert_Change);
	$("#prome-character-saturate").on("input", onCharacterTintSaturate_Change);
	$("#prome-character-sepia").on("input", onCharacterTintSepia_Change);
}
