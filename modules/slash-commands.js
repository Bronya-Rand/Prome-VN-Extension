import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import {
	ARGUMENT_TYPE,
	SlashCommandNamedArgument,
} from "../../../../slash-commands/SlashCommandArgument.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import {
	SlashCommandEnumValue,
	enumTypes,
} from "../../../../slash-commands/SlashCommandEnumValue.js";

import { VN_MODES, extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

import { applyLetterboxMode } from "./letterbox.js";
import {
	applySpriteZoomAnimation,
	applySpriteDefocusTint,
	applySpriteZoom,
} from "./focus.js";
import { applySpriteShake } from "./shake.js";
import { applySpriteShadow } from "./shadows.js";

export function prepareSlashCommands() {
	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "letterbox",
			/** @type {(args: { mode: string | undefined }) => void} */
			callback: async (args, _) => {
				if (args.mode === "horizontal") {
					switchLetterboxMode(VN_MODES.HORIZONTAL);
				} else if (args.mode === "vertical") {
					switchLetterboxMode(VN_MODES.VERTICAL);
				} else if (args.mode === "off") {
					switchLetterboxMode(VN_MODES.NONE);
				}
				if (args.mode !== "off") {
					toastr.success(
						`Letterbox mode is now set to ${args.mode} mode.`,
						"Letterbox Mode Status",
					);
				} else {
					toastr.success(
						"Letterbox mode is now turned off.",
						"Letterbox Mode Status",
					);
				}
				return extension_settings[extensionName].letterboxMode;
			},
			namedArgumentList: [
				SlashCommandNamedArgument.fromProps({
					name: "mode",
					description: "The mode to switch to.",
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
			helpString: "Switches the letterbox mode in the Prome VN UI.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "focus-mode",
			callback: async () => {
				switchFocusMode(!extension_settings[extensionName].spriteZoom);
				toastr.success(
					`Focus Mode is now ${
						extension_settings[extensionName].spriteZoom
							? "enabled"
							: "disabled"
					}.`,
					"Focus Mode Status",
				);
				return extension_settings[extensionName].spriteZoom;
			},
			helpString: "Toggles focus mode for the Prome VN UI.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "focus-mode-animation",
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
					return extension_settings[extensionName].zoomAnimation;
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
				'Switches the focus mode animation when "Focus Mode" is enabled.',
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "sprite-defocus",
			callback: async () => {
				switchUnfocusMode();
				toastr.success(
					`Defocus tint is now ${
						extension_settings[extensionName].spriteDefocusTint
							? "enabled"
							: "disabled"
					}.`,
					"Defocus Tint Status",
				);
				return extension_settings[extensionName].spriteDefocusTint;
			},
			helpString: "Toggles the defocus tint for character sprites.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "sprite-shake",
			callback: async () => {
				switchSpriteShake();
				toastr.success(
					`Sprite shake is now ${
						extension_settings[extensionName].spriteShake
							? "enabled"
							: "disabled"
					}.`,
					"Sprite Shake Status",
				);
				return extension_settings[extensionName].spriteShake;
			},
			helpString: "Toggles sprite shaking when a character is speaking.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "sprite-shadow",
			callback: async () => {
				switchSpriteShadow();
				toastr.success(
					`Sprite shadow is now ${
						extension_settings[extensionName].spriteShadow
							? "enabled"
							: "disabled"
					}.`,
					"Sprite Shadow Status",
				);
				return extension_settings[extensionName].spriteShadow;
			},
			helpString: "Toggles sprite shadows for character sprites.",
		}),
	);
}

function switchLetterboxMode(mode) {
	extension_settings[extensionName].letterboxMode = mode;
	saveSettingsDebounced();
	$("#prome-letterbox-mode").val(mode).trigger("change");
	applyLetterboxMode();
}

function switchFocusModeAnimation(animation) {
	extension_settings[extensionName].zoomAnimation = animation;
	saveSettingsDebounced();
	$("#prome-sprite-zoom-animation").val(animation).trigger("change");
	applySpriteZoomAnimation();
}

function switchFocusMode(mode) {
	extension_settings[extensionName].spriteZoom = mode;
	saveSettingsDebounced();
	$("#prome-sprite-zoom").prop("checked", mode).trigger("input");
	applySpriteZoom();
}

function switchUnfocusMode() {
	extension_settings[extensionName].spriteDefocusTint =
		!extension_settings[extensionName].spriteDefocusTint;
	saveSettingsDebounced();
	$("#prome-sprite-defocus-tint")
		.prop("checked", extension_settings[extensionName].spriteDefocusTint)
		.trigger("input");
	applySpriteDefocusTint();
}

function switchSpriteShake() {
	extension_settings[extensionName].spriteShake =
		!extension_settings[extensionName].spriteShake;
	saveSettingsDebounced();
	$("#prome-sprite-shake")
		.prop("checked", extension_settings[extensionName].spriteShake)
		.trigger("input");
	applySpriteShake();
}

function switchSpriteShadow() {
	extension_settings[extensionName].spriteShadow =
		!extension_settings[extensionName].spriteShadow;
	saveSettingsDebounced();
	$("#prome-sprite-shadow")
		.prop("checked", extension_settings[extensionName].spriteShadow)
		.trigger("input");
	applySpriteShadow();
}
