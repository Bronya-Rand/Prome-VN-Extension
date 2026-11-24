import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { extensionFolderPath, extensionName } from "../constants.js";

function applySheldSettings() {
	const settings = extension_settings[extensionName];
	document.body.classList.toggle("prome-hide-sheld", settings.hideSheld);
}

// --- Module Lifecycle ---
export async function initSheldModule() {
	try {
		const html = await $.get(`${extensionFolderPath}/html/modules/sheld.html`);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load sheld module settings:`,
			error,
		);
	}

	const settings = extension_settings[extensionName];

	// Sync UI state with settings
	$("#prome-hide-sheld").prop("checked", settings.hideSheld);

	// Bind event handlers
	$("#prome-hide-sheld").on("click", (e) => {
		settings.hideSheld = Boolean($(e.target).prop("checked"));
		saveSettingsDebounced();
		applySheldSettings();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "F1" || !event.ctrlKey || event.repeat || event.defaultPrevented) return;
		event.preventDefault();
		document.getElementById("prome-hide-sheld")?.click();
	});

	applySheldSettings();

	if (settings.hideSheld) {
		toastr.info(
			"Head to Extensions > Prome (Visual Novel Extension) > Sheld Settings and uncheck 'Hide Sheld' to show it again.",
			"Sheld is currently hidden by the Prome Visual Novel Extension.",
		);
	}
}
