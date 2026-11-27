import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import { extensionFolderPath, extensionName } from "../constants.js";
import { PROME_STREAM_BYTE, promeBus } from "../core/bus.js";
import { setShakingActor } from "../core/stage.js";

let shakeTimeout = null;

// --- CSS Class / Helpers ---
function applyShakeSettings() {
	const settings = extension_settings[extensionName];

	$("body").toggleClass("spriteShake", Boolean(settings.spriteShake));

	if (!settings.spriteShake) {
		stopShakeAnimation();
	}
}

/**
 * Starts the shake animation for the character sprite when the character is speaking.
 */
function startShakeAnimation(actorId) {
	const settings = extension_settings[extensionName];
	if (!settings.spriteShake) return;

	setShakingActor(actorId);

	// Auto-stop the shake animation if no new stream bytes arrive (smooth stream cutoff)
	clearTimeout(shakeTimeout);
	shakeTimeout = setTimeout(() => {
		stopShakeAnimation();
	}, 400);
}

export function stopShakeAnimation() {
	clearTimeout(shakeTimeout);
	setShakingActor(null);
}

// --- Module Lifecycle ---
export async function initShakeModule() {
	try {
		const html = await $.get(`${extensionFolderPath}/html/modules/shake.html`);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load shake module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-sprite-shake").prop("checked", settings.spriteShake);

	// Bind event handlers
	$("#prome-sprite-shake").on("click", (e) => {
		settings.spriteShake = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applyShakeSettings();
	});

	// Listen to stream events via PromeBus
	promeBus.addEventListener(PROME_STREAM_BYTE, (event) => {
		const { actorId } = event.detail || {};
		startShakeAnimation(actorId);
	});

	registerShakeCommands();
	applyShakeSettings();
}

// --- Module Commands ---
function registerShakeCommands() {
	const settings = extension_settings[extensionName];

	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "sprite-shake",
			callback: async () => {
				settings.spriteShake = !settings.spriteShake;
				$("#prome-sprite-shake").prop("checked", settings.spriteShake);
				saveSettingsDebounced();

				applyShakeSettings();
				toastr.success(
					`Sprite Shake is now ${settings.spriteShake ? "enabled" : "disabled"}.`,
					"Sprite Shake Status",
				);
				return settings.spriteShake;
			},
			helpString:
				"(Prome Visual Novel Extension) Toggles sprite shake animation when text streams.",
		}),
	);
}
