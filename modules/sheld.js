import { extension_settings } from "../../../../extensions.js";
import { extensionName } from "../constants.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { getChatId } from "../utils.js";

/* Sheld Functions */
export function applySheldVisibility() {
	if (extension_settings[extensionName].hideSheld === (null || undefined)) {
		console.debug(`[${extensionName}] hideSheld returned null or undefined.`);
	}

	console.debug(
		`[${extensionName}] Hide Sheld?: ${extension_settings[extensionName].hideSheld}`,
	);

	$("#sheld").toggleClass(
		"displayNone",
		extension_settings[extensionName].hideSheld,
	);
}

export function applySheldMode() {
	if (
		extension_settings[extensionName].showOnlyLastMessage ===
		(null || undefined)
	) {
		console.debug(
			`[${extensionName}] showOnlyLastMessage returned null or undefined`,
		);
	}

	console.debug(
		`[${extensionName}] Show Only Last Message?: ${extension_settings[extensionName].showOnlyLastMessage}`,
	);

	const currentChatId = getChatId();
	if (!currentChatId) return;

	// hide "Show more messages" as it's obsolete for single message mode
	// show it if the mode is disabled
	$("#chat [id='show_more_messages']").toggleClass(
		"displayNone",
		extension_settings[extensionName].showOnlyLastMessage,
	);

	// remove previous messages that were hidden in the chat div
	$("#chat .mes").removeClass("displayNone");

	// now hide all messages except the last one ("mes last_mes")
	if (extension_settings[extensionName].showOnlyLastMessage) {
		$("#chat .mes:not(.last_mes)").addClass("displayNone"); // hide all messages except the last one
	}
}

/* Event Handlers */
export function onSheld_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].hideSheld = value;
	saveSettingsDebounced();
	applySheldVisibility();
}

export function onSheldMode_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].showOnlyLastMessage = value;
	saveSettingsDebounced();
	applySheldMode();
}
