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
import { extensionFolderPath, extensionName } from "../constants.js";
import { PROME_SPEAKER_CHANGED, promeBus } from "../core/bus.js";
import { setFocusedActor } from "../core/stage.js";

// --- CSS Class / Helpers ---
export function applyFocusSettings() {
	const settings = extension_settings[extensionName];

	$("body").toggleClass("spriteZoom", Boolean(settings.spriteZoom));
	$("body").toggleClass(
		"spriteDefocusTint",
		Boolean(settings.spriteDefocusTint),
	);

	document.documentElement.style.setProperty(
		"--prome-sprite-zoom-speed",
		`${settings.zoomSpeed}s`,
	);
	document.documentElement.style.setProperty(
		"--prome-sprite-zoom-animation",
		settings.zoomAnimation,
	);
}

// --- Module Lifecycle ---
export async function initFocusModule() {
	// Add module settings to the settings page
	try {
		const html = await $.get(`${extensionFolderPath}/html/modules/focus.html`);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load focus module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-sprite-zoom").prop("checked", settings.spriteZoom);
	$("#prome-sprite-defocus-tint").prop("checked", settings.spriteDefocusTint);
	$("#prome-sprite-zoom-animation").val(settings.zoomAnimation);
	$("#prome-sprite-zoom-speed").val(settings.zoomSpeed).trigger("input");
	$("#prome-sprite-zoom-speed-counter")
		.val(settings.zoomSpeed)
		.trigger("input");

	// Bind event handlers
	$("#prome-sprite-zoom").on("click", (e) => {
		settings.spriteZoom = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applyFocusSettings();
	});
	$("#prome-sprite-defocus-tint").on("click", (e) => {
		settings.spriteDefocusTint = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applyFocusSettings();
	});
	$("#prome-sprite-zoom-animation").on("change", function () {
		settings.zoomAnimation = this.value;
		saveSettingsDebounced();
		applyFocusSettings();
	});
	$("#prome-sprite-zoom-speed").on("input", updateZoomSpeed);
	$("#prome-sprite-zoom-speed-counter").on("input", updateZoomSpeed);

	// Subscribe to PromeBus events
	promeBus.addEventListener(PROME_SPEAKER_CHANGED, (event) => {
		const { actorId } = event.detail || {};
		setFocusedActor(actorId);
	});

	registerFocusCommands();
	applyFocusSettings();
}

function updateZoomSpeed(event) {
	const value = Number(event.target.value);
	if (value >= 0.1 && value <= 1) {
		extension_settings[extensionName].zoomSpeed = value;

		if (event.target.id === "prome-sprite-zoom-speed") {
			$("#prome-sprite-zoom-speed-counter").val(value);
		} else {
			$("#prome-sprite-zoom-speed").val(value);
		}

		saveSettingsDebounced();
		applyFocusSettings();
	}
}

// --- Focus Mode Commands ---
function registerFocusCommands() {
	const settings = extension_settings[extensionName];

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "sprite-focus",
			callback: async () => {
				switchFocusMode(!settings.spriteZoom);
				toastr.success(
					`Focus Mode is now ${settings.spriteZoom ? "enabled" : "disabled"}.`,
					"Focus Mode Status",
				);
				return settings.spriteZoom;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles focus mode on character sprites.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "sprite-defocus",
			callback: async () => {
				switchUnfocusMode();
				toastr.success(
					`Defocus tint is now ${
						settings.spriteDefocusTint ? "enabled" : "disabled"
					}.`,
					"Defocus Tint Status",
				);
				return settings.spriteDefocusTint;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles the defocus tint on non-speaking character sprites.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "set-focus-animation",
			/** @type {(args: { animation: string | undefined }) => void} */
			callback: async (args, _) => {
				if (
					args.animation === "ease" ||
					args.animation === "ease-in" ||
					args.animation === "ease-out" ||
					args.animation === "ease-in-out" ||
					args.animation === "linear"
				) {
					switchFocusModeAnimation(args.animation);
					toastr.success(
						`Now set to ${args.animation}.`,
						"Focus Mode Animation Set",
					);
					return settings.zoomAnimation;
				}
				toastr.error(
					'Please use "ease", "ease-in", "ease-out", "ease-in-out" or "linear".',
					"Invalid Animation",
				);
				return null;
			},
			namedArgumentList: [
				SlashCommandNamedArgument.fromProps({
					name: "animation",
					description: "The animation to use for sprite zoom.",
					isRequired: true,
					typeList: [ARGUMENT_TYPE.STRING],
					enumList: [
						new SlashCommandEnumValue(
							"ease",
							"Ease animation.",
							enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"ease-in",
							"Ease-in animation.",
							enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"ease-out",
							"Ease-out animation.",
							enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"ease-in-out",
							"Ease-in-out animation.",
							enumTypes.namedArgument,
						),
						new SlashCommandEnumValue(
							"linear",
							"Linear animation.",
							enumTypes.namedArgument,
						),
					],
				}),
			],
			helpString:
				'(Prome Visual Novel Extension) Switches the focus mode animation when "Focus Mode" is enabled.',
		}),
	);
}

function switchFocusMode(mode) {
	extension_settings[extensionName].spriteZoom = mode;
	saveSettingsDebounced();
	$("#prome-sprite-zoom").prop("checked", mode);
	applyFocusSettings();
}

function switchUnfocusMode() {
	extension_settings[extensionName].spriteDefocusTint =
		!extension_settings[extensionName].spriteDefocusTint;
	saveSettingsDebounced();
	$("#prome-sprite-defocus-tint").prop(
		"checked",
		extension_settings[extensionName].spriteDefocusTint,
	);
	applyFocusSettings();
}

function switchFocusModeAnimation(animation) {
	extension_settings[extensionName].zoomAnimation = animation;
	saveSettingsDebounced();
	$("#prome-sprite-zoom-animation").val(animation);
	applyFocusSettings();
}
