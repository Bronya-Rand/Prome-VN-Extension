import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import {
	defaultSettings,
	extensionFolderPath,
	extensionName,
} from "../constants.js";

const SHADOW_PARAMS = [
	{ key: "shadowOffsetX", id: "offsetx" },
	{ key: "shadowOffsetY", id: "offsety" },
	{ key: "shadowBlur", id: "blur" },
];

function applyShadowSettings() {
	const settings = extension_settings[extensionName];

	$("body").toggleClass("spriteShadow", settings.spriteShadow);

	document.documentElement.style.setProperty(
		"--prome-sprite-shadow-offsetx",
		`${settings.shadowOffsetX}px`,
	);
	document.documentElement.style.setProperty(
		"--prome-sprite-shadow-offsety",
		`${settings.shadowOffsetY}px`,
	);
	document.documentElement.style.setProperty(
		"--prome-sprite-shadow-blur",
		`${settings.shadowBlur}px`,
	);
}

// --- Module Lifecycle ---
export async function initShadowModule() {
	try {
		const html = await $.get(
			`${extensionFolderPath}/html/modules/shadows.html`,
		);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load shadow module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-sprite-shadow").prop("checked", settings.spriteShadow);

	for (const { key, id } of SHADOW_PARAMS) {
		$(`#prome-sprite-shadow-${id}`).val(settings[key]);
		$(`#prome-sprite-shadow-${id}-counter`).val(settings[key]);

		// Bind Slider & Counter (updating only the opposite field)
		$(`#prome-sprite-shadow-${id}, #prome-sprite-shadow-${id}-counter`).on(
			"input",
			(event) => {
				const value = Number(event.target.value);
				if (value >= 1 && value <= 20) {
					settings[key] = value;
					if (event.target.id === `prome-sprite-shadow-${id}`) {
						$(`#prome-sprite-shadow-${id}-counter`).val(value);
					} else {
						$(`#prome-sprite-shadow-${id}`).val(value);
					}
					saveSettingsDebounced();
					applyShadowSettings();
				}
			},
		);

		$(`#prome-sprite-shadow-${id}-restore`).on("click", () => {
			const defVal = defaultSettings[key];
			settings[key] = defVal;
			$(`#prome-sprite-shadow-${id}`).val(defVal);
			$(`#prome-sprite-shadow-${id}-counter`).val(defVal);
			saveSettingsDebounced();
			applyShadowSettings();
		});
	}

	// Bind event handlers
	$("#prome-sprite-shadow").on("click", (e) => {
		settings.spriteShadow = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applyShadowSettings();
	});

	registerShadowCommands();
	applyShadowSettings();
}

// --- Module Commands
function registerShadowCommands() {
	const settings = extension_settings[extensionName];

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "sprite-shadow",
			callback: async () => {
				switchSpriteShadow();
				toastr.success(
					`Sprite shadow is now ${
						settings.spriteShadow ? "enabled" : "disabled"
					}.`,
					"Sprite Shadow Status",
				);
				return settings.spriteShadow;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles sprite shadows on character sprites.",
		}),
	);
}

function switchSpriteShadow() {
	extension_settings[extensionName].spriteShadow =
		!extension_settings[extensionName].spriteShadow;
	saveSettingsDebounced();
	$("#prome-sprite-shadow")
		.prop("checked", extension_settings[extensionName].spriteShadow)
		.trigger("input");
	applyShadowSettings();
}
