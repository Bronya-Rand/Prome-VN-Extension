import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { user_avatar } from "../../../../personas.js";
import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import {
	ARGUMENT_TYPE,
	SlashCommandNamedArgument,
} from "../../../../slash-commands/SlashCommandArgument.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import { extensionFolderPath, extensionName } from "../constants.js";
import { emitPromeEvent } from "../core/bus.js";
import { resolveSpriteFolder } from "../core/sprites.js";
import { spritePackExists } from "../utils.js";

// --- Module Lifecycle ---
export async function initUserModule() {
	try {
		const html = await $.get(`${extensionFolderPath}/html/modules/user.html`);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load user module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-user-sprite").prop("checked", Boolean(settings.enableUserSprite));
	$("#prome-user-sprite-input").val(settings.userSprite ?? "");

	// Bind event handlers
	$("#prome-user-sprite").on("change", async (event) => {
		const isEnabled = Boolean($(event.target).prop("checked"));
		if (isEnabled) {
			const pack = user_avatar
				? resolveSpriteFolder(
						`persona:${user_avatar}`,
						settings.userSprite,
						settings,
					)
				: settings.userSprite;
			if (pack) {
				const exists = await spritePackExists(pack);
				if (!exists) {
					toastr.warning(
						`Sprite pack "${pack}" could not be found in characters folder.`,
						"User Sprite",
					);
				}
			}
		}
		settings.enableUserSprite = isEnabled;
		saveSettingsDebounced();

		emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");
		emitPromeEvent("PROME_USER_SPRITE_TOGGLED");
	});

	$("#prome-user-sprite-input").on("change", async function () {
		const pack = this.value.trim();
		settings.userSprite = pack;
		saveSettingsDebounced();
		if (pack && settings.enableUserSprite) {
			const exists = await spritePackExists(pack);
			if (!exists) {
				toastr.warning(
					`Sprite pack "${pack}" could not be found in characters folder.`,
					"User Sprite",
				);
			}
		}
		emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");
	});

	registerUserCommands();
}

// --- Module Commands ---
function registerUserCommands() {
	const settings = extension_settings[extensionName];

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "user-sprite",
			callback: async () => {
				settings.enableUserSprite = !settings.enableUserSprite;
				saveSettingsDebounced();

				$("#prome-user-sprite").prop("checked", settings.enableUserSprite);
				emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");
				emitPromeEvent("PROME_USER_SPRITE_TOGGLED");

				toastr.success(
					`User sprite is now ${settings.enableUserSprite ? "enabled" : "disabled"}.`,
					"User Sprite Status",
				);
				return settings.enableUserSprite;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles the user persona sprite on the stage.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "set-user-set",
			callback: async (args) => {
				const pack = args.name?.trim();
				if (!pack) {
					toastr.error("Please provide a sprite pack name.", "User Sprite");
					return null;
				}

				const exists = await spritePackExists(pack);
				if (!exists) {
					toastr.warning(
						`Sprite pack "${pack}" not found in characters folder.`,
						"User Sprite",
					);
				}

				settings.userSprite = pack;
				saveSettingsDebounced();

				$("#prome-user-sprite-input").val(pack);
				emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");

				toastr.success(`Default user sprite pack set to "${pack}".`, "User Sprite");
				return pack;
			},
			namedArgumentList: [
				SlashCommandNamedArgument.fromProps({
					name: "name",
					description:
						"The default sprite folder name in characters/ for personas.",
					isRequired: true,
					typeList: [ARGUMENT_TYPE.STRING],
				}),
			],
			helpString:
				"(Prome Visual Novel Extension) Sets the default persona sprite pack folder.",
		}),
	);

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "express",
			callback: async (args) => {
				const expr = args.expression?.trim();
				if (!expr) {
					toastr.error(
						"Please provide an expression (e.g. /express joy).",
						"User Sprite",
					);
					return null;
				}

				if (!settings.enableUserSprite) {
					toastr.warning(
						"User sprite is disabled. Enable it in settings.",
						"User Sprite",
					);
					return null;
				}
				if (!user_avatar) {
					toastr.warning("No active persona avatar found.", "User Sprite");
					return null;
				}

				// Emit event to update stage expression
				emitPromeEvent("PROME_SET_EXPRESSION", {
					actorId: `persona:${user_avatar}`,
					expression: expr,
				});
				toastr.success(`User expression set to "${expr}".`, "User Expression");
				return expr;
			},
			namedArgumentList: [
				SlashCommandNamedArgument.fromProps({
					name: "expression",
					description: "The expression label (e.g. joy, neutral, sad).",
					isRequired: true,
					typeList: [ARGUMENT_TYPE.STRING],
				}),
			],
			helpString:
				"(Prome Visual Novel Extension) Manually sets the expression of the user persona sprite.",
		}),
	);
}
