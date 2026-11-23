import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import {
	ARGUMENT_TYPE,
	SlashCommandNamedArgument,
} from "../../../../slash-commands/SlashCommandArgument.js";
import {
	enumTypes,
	SlashCommandEnumValue,
} from "../../../../slash-commands/SlashCommandEnumValue.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import {
	defaultSettings,
	extensionFolderPath,
	extensionName,
	VN_MODES,
} from "../constants.js";

// --- CSS Class / Variables Helpers ---

export function applyLetterboxSettings() {
	const settings = extension_settings[extensionName];
	const mode = Number(settings.letterboxMode);

	$("body").toggleClass("hLetterBox", mode === VN_MODES.HORIZONTAL);
	$("body").toggleClass("vLetterBox", mode === VN_MODES.VERTICAL);

	const unit = mode === VN_MODES.HORIZONTAL ? "vh" : "vw";
	document.documentElement.style.setProperty(
		"--prome-letterbox-size",
		`${settings.letterboxSize}${unit}`,
	);
	document.documentElement.style.setProperty(
		"--prome-letterbox-color",
		settings.letterboxColor,
	);
}

// Ensure the wrapper element exists on body
function ensureLetterboxDOM() {
	if ($("#prome-letterbox-wrapper").length === 0) {
		const html = `
            <div id="prome-letterbox-wrapper">
                <div class="prome-letterbox-bar prome-letterbox-bar-1"></div>
                <div class="prome-letterbox-bar prome-letterbox-bar-2"></div>
            </div>
        `;
		$("body").append(html);
	}
}

// --- Module Lifecycle ---

export async function initLetterboxModule() {
	try {
		const html = await $.get(
			`${extensionFolderPath}/html/modules/letterbox.html`,
		);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load letterbox module settings:`,
			error,
		);
		return;
	}

	ensureLetterboxDOM();
	const settings = extension_settings[extensionName];

	// 1. Sync UI state with settings
	$("#prome-letterbox-mode").val(settings.letterboxMode);
	$("#prome-letterbox-color-picker").attr("color", settings.letterboxColor);
	$("#prome-letterbox-size").val(settings.letterboxSize);
	$("#prome-letterbox-size-counter").val(settings.letterboxSize);

	// 2. Mode Select
	$("#prome-letterbox-mode").on("change", function () {
		settings.letterboxMode = Number(this.value);
		saveSettingsDebounced();
		applyLetterboxSettings();
	});

	// 3. Color Picker
	$("#prome-letterbox-color-picker").on("change", (evt) => {
		const color = evt.detail.rgba;
		settings.letterboxColor = color;
		saveSettingsDebounced();
		applyLetterboxSettings();
	});

	// 4. Color Restore
	$("#prome-letterbox-color-restore").on("click", () => {
		const defColor = defaultSettings.letterboxColor;
		settings.letterboxColor = defColor;
		$("#prome-letterbox-color-picker").attr("color", defColor);
		saveSettingsDebounced();
		applyLetterboxSettings();
	});

	// 5. Size Slider & Counter (updating only the opposite field)
	$("#prome-letterbox-size, #prome-letterbox-size-counter").on(
		"input",
		(event) => {
			const value = Number(event.target.value);
			if (value >= 1 && value <= 50) {
				settings.letterboxSize = value;

				if (event.target.id === "prome-letterbox-size") {
					$("#prome-letterbox-size-counter").val(value);
				} else {
					$("#prome-letterbox-size").val(value);
				}

				saveSettingsDebounced();
				applyLetterboxSettings();
			}
		},
	);

	// 6. Size Restore
	$("#prome-letterbox-size-restore").on("click", () => {
		const defSize = defaultSettings.letterboxSize;
		settings.letterboxSize = defSize;
		$("#prome-letterbox-size").val(defSize);
		$("#prome-letterbox-size-counter").val(defSize);
		saveSettingsDebounced();
		applyLetterboxSettings();
	});

	registerLetterboxCommands();
	applyLetterboxSettings();
}

// --- Slash Commands ---

function registerLetterboxCommands() {
	const settings = extension_settings[extensionName];

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "letterbox",
			callback: async (args) => {
				if (args.mode === "horizontal") {
					settings.letterboxMode = VN_MODES.HORIZONTAL;
				} else if (args.mode === "vertical") {
					settings.letterboxMode = VN_MODES.VERTICAL;
				} else if (args.mode === "off") {
					settings.letterboxMode = VN_MODES.NONE;
				}

				saveSettingsDebounced();
				$("#prome-letterbox-mode").val(settings.letterboxMode);
				applyLetterboxSettings();

				toastr.success(
					args.mode !== "off"
						? `Letterbox mode set to ${args.mode}.`
						: "Letterbox mode turned off.",
					"Letterbox Status",
				);
				return settings.letterboxMode;
			},
			namedArgumentList: [
				SlashCommandNamedArgument.fromProps({
					name: "mode",
					description: "Letterbox mode to switch to.",
					isRequired: true,
					typeList: [ARGUMENT_TYPE.STRING],
					enumList: [
						new SlashCommandEnumValue(
							"off",
							"Turn off letterbox mode.",
							enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"horizontal",
							"Enable horizontal letterboxes.",
							enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"vertical",
							"Enable vertical letterboxes.",
							enumTypes.namedArgument,
						),
					],
				}),
			],
			helpString:
				"(Prome Visual Novel Extension) Switches the letterbox mode in the VN UI.",
		}),
	);
}
