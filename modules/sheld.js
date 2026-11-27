import {
	event_types,
	eventSource,
	saveSettingsDebounced,
} from "../../../../../script.js";
import {
	extension_settings,
	renderExtensionTemplateAsync,
} from "../../../../extensions.js";
import { t } from "../../../../i18n.js";
import { extensionFolderPath, extensionName } from "../constants.js";

function setSheldHidden(hidden) {
	const settings = extension_settings[extensionName];
	settings.hideSheld = hidden;
	$("#prome-hide-sheld").prop("checked", hidden);
	document.body.classList.toggle("prome-hide-sheld", hidden);
	saveSettingsDebounced();
}

async function initTraditionalVN(settings) {
	const chat = document.getElementById("chat");
	const wand = document.getElementById("extensionsMenu");
	if (!chat || !wand) return;

	const html = await renderExtensionTemplateAsync(
		`third-party/${extensionName}/html`,
		"wand_buttons",
	);
	const menuItem = $(html).appendTo(wand);
	const historyButton = menuItem.find("#prome-wand-chat-history");
	const historyLabel = historyButton.find("span");

	function showHistory(show) {
		document.body.classList.toggle("prome-chat-history-open", show);
		historyLabel.text(show ? t`Show latest message` : t`Show chat history`);
	}

	function applyMode() {
		document.body.classList.toggle(
			"prome-traditional-vn",
			settings.showOnlyLastMessage,
		);
		showHistory(false);
	}

	historyButton.on("click", () => {
		const distanceFromBottom =
			chat.scrollHeight - chat.clientHeight - chat.scrollTop;
		const show = !document.body.classList.contains("prome-chat-history-open");
		showHistory(show);
		chat.scrollTop = chat.scrollHeight - chat.clientHeight - distanceFromBottom;
	});

	$("#prome-sheld-last_mes")
		.prop("checked", settings.showOnlyLastMessage)
		.on("change", (event) => {
			settings.showOnlyLastMessage = event.target.checked;
			applyMode();
			saveSettingsDebounced();
		});
	eventSource.on(event_types.CHAT_CHANGED, () => showHistory(false));
	$("#prome-enable-vn").on("click", () => showHistory(false));
	applyMode();
}

// --- Module Lifecycle ---
export async function initSheldModule() {
	try {
		const html = await $.get(`${extensionFolderPath}/html/modules/sheld.html`);
		$("#prome-module-settings").append(html);
		await initTraditionalVN(extension_settings[extensionName]);
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
	$("#prome-hide-sheld").on("change", (event) => {
		setSheldHidden(event.target.checked);
	});

	window.addEventListener(
		"keydown",
		(event) => {
			if (event.defaultPrevented || event.isComposing || event.metaKey) return;
			const controlF1 =
				event.key === "F1" && event.ctrlKey && !event.altKey && !event.shiftKey;
			const altShiftH =
				event.code === "KeyH" &&
				event.altKey &&
				event.shiftKey &&
				!event.ctrlKey;
			if (!controlF1 && !altShiftH) return;
			event.preventDefault();
			if (!event.repeat) setSheldHidden(!settings.hideSheld);
		},
		{ capture: true },
	);

	document.body.classList.toggle("prome-hide-sheld", settings.hideSheld);

	if (settings.hideSheld) {
		toastr.info(
			"Head to Extensions > Prome (Visual Novel Extension) > Sheld Settings and uncheck 'Hide Sheld' to show it again.",
			"Sheld is currently hidden by the Prome Visual Novel Extension.",
		);
	}
}
