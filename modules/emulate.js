import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { extensionFolderPath, extensionName } from "../constants.js";
import { emitPromeEvent } from "../core/bus.js";

// --- Module Lifecycle ---
export async function initEmulateModule() {
	try {
		const html = await $.get(
			`${extensionFolderPath}/html/modules/emulate.html`,
		);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load sprite emulation module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-emulate-sprites").prop("checked", settings.emulateSprites);

	// Bind event handlers
	$("#prome-emulate-sprites").on("click", (e) => {
		settings.emulateSprites = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		emitPromeEvent("PROME_STAGE_REFRESH_REQUESTED");
	});
}
