import {
	event_types,
	eventSource,
	saveSettingsDebounced,
} from "../../../../../script.js";
import { extension_settings } from "../../../../extensions.js";
import { ConnectionManagerRequestService } from "../../../shared.js";
import {
	CLASSIFIER_MODES,
	DEFAULT_CLASSIFIER_PROMPT,
	DEFAULT_EXPRESSIONS,
	extensionFolderPath,
	extensionName,
} from "../constants.js";
import { PROME_CUSTOM_EXPRESSIONS_CHANGED, promeBus } from "../core/bus.js";
import { openSpriteGallery } from "./gallery.js";

export async function initClassifierSettings({ onClassifierChange, onSpriteSettingsChange }) {
	try {
		const html = await $.get(
			`${extensionFolderPath}/html/modules/classifier.html`,
		);
		$("#prome-module-settings").append(html);
	} catch (error) {
		console.error(
			`[${extensionName}] Failed to load classifier settings:`,
			error,
		);
		return;
	}

	const settings = extension_settings[extensionName];
	const modeSelect = $("#prome-classifier-mode");
	const profileSelect = $("#prome-classifier-profile");
	const mainApiSettings = $("#prome-classifier-main-api-settings");
	const promptInput = $("#prome-classifier-prompt");
	const fallbackSelect = $("#prome-fallback-expression");

	function refreshProfiles() {
		const savedProfiles = extension_settings.disabledExtensions?.includes(
			"connection-manager",
		)
			? []
			: (extension_settings.connectionManager?.profiles ?? []);
		const profiles = savedProfiles.filter((profile) =>
			ConnectionManagerRequestService.isProfileSupported(profile),
		);
		profileSelect.empty().append(new Option("Current connection", ""));
		for (const profile of profiles) {
			profileSelect.append(new Option(profile.name, profile.id));
		}
		if (
			settings.classifierProfile &&
			!profiles.some((profile) => profile.id === settings.classifierProfile)
		) {
			const missing = new Option(
				"Saved profile unavailable",
				settings.classifierProfile,
			);
			missing.disabled = true;
			profileSelect.append(missing);
		}
		profileSelect.val(settings.classifierProfile);
	}

	function syncMode() {
		const mode = settings.classifierMode;
		const mainApi =
			mode === CLASSIFIER_MODES.RAW || mode === CLASSIFIER_MODES.STRUCTURED;
		const webLlm = mode === CLASSIFIER_MODES.WEBLLM;
		mainApiSettings.toggle(mainApi);
		$("#prome-classifier-prompt-settings").toggle(mainApi || webLlm);
		$("#prome-classifier-webllm-help").toggle(webLlm);
		$("#prome-filter-available-expressions-setting").toggle(mode !== CLASSIFIER_MODES.NONE);
	}

	modeSelect.val(settings.classifierMode).on("change", function () {
		settings.classifierMode = this.value;
		syncMode();
		saveSettingsDebounced();
		onClassifierChange();
	});
	profileSelect.on("change", function () {
		settings.classifierProfile = this.value;
		saveSettingsDebounced();
		onClassifierChange();
	});
	$("#prome-filter-available-expressions")
		.prop("checked", settings.filterAvailableExpressions)
		.on("change", function () {
			settings.filterAvailableExpressions = this.checked;
			saveSettingsDebounced();
			onClassifierChange();
		});
	function savePrompt(prompt) {
		if (settings.classifierPrompt === prompt) return;
		settings.classifierPrompt = prompt;
		saveSettingsDebounced();
		onClassifierChange();
	}
	promptInput.val(settings.classifierPrompt).on("change", function () {
		const prompt = this.value.trim() || DEFAULT_CLASSIFIER_PROMPT;
		$(this).val(prompt);
		savePrompt(prompt);
	});
	$("#prome-classifier-prompt-restore").on("click", () => {
		promptInput.val(DEFAULT_CLASSIFIER_PROMPT);
		savePrompt(DEFAULT_CLASSIFIER_PROMPT);
	});
	function refreshFallbackOptions() {
		fallbackSelect
			.find("option")
			.filter((_, option) => option.value !== "")
			.remove();
		const savedFallback = settings.fallbackExpression ?? "";
		const labels = new Set([
			...DEFAULT_EXPRESSIONS,
			...(settings.customExpressions ?? []),
		]);
		if (savedFallback) labels.add(savedFallback);
		for (const label of labels) {
			fallbackSelect.append(new Option(label, label));
		}
		fallbackSelect.val(savedFallback);
	}
	refreshFallbackOptions();
	fallbackSelect.on("change", function () {
		if (settings.fallbackExpression === this.value) return;
		settings.fallbackExpression = this.value;
		saveSettingsDebounced();
		onSpriteSettingsChange();
	});
	promeBus.addEventListener(PROME_CUSTOM_EXPRESSIONS_CHANGED, () => {
		refreshFallbackOptions();
		onClassifierChange();
		onSpriteSettingsChange();
	});
	const reroll = $("#prome-reroll-same-sprite");
	reroll.prop("checked", settings.rerollSameSprite)
		.prop("disabled", !settings.allowMultipleSprites)
		.on("change", function () {
			settings.rerollSameSprite = this.checked;
			saveSettingsDebounced();
		});
	$("#prome-allow-multiple-sprites")
		.prop("checked", settings.allowMultipleSprites)
		.on("change", function () {
			settings.allowMultipleSprites = this.checked;
			reroll.prop("disabled", !this.checked);
			saveSettingsDebounced();
			onSpriteSettingsChange();
		});

	$("#prome-open-gallery").on("click", () => {
		openSpriteGallery();
	});

	for (const type of [
		event_types.APP_READY,
		event_types.CONNECTION_PROFILE_CREATED,
		event_types.CONNECTION_PROFILE_UPDATED,
		event_types.CONNECTION_PROFILE_DELETED,
	]) {
		eventSource.on(type, refreshProfiles);
	}
	refreshProfiles();
	syncMode();
}
