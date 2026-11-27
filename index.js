/* ST Core Imports */
import {
	doNavbarIconClick,
	event_types,
	eventSource,
	saveSettingsDebounced,
} from "../../../../script.js";
import {
	extension_settings,
	getContext,
	renderExtensionTemplateAsync,
} from "../../../extensions.js";
import { getUserAvatar, user_avatar } from "../../../personas.js";
import { callGenericPopup, POPUP_TYPE } from "../../../popup.js";
import { power_user } from "../../../power-user.js";

/* Prome Core Imports */
import {
	CLASSIFIER_MODES,
	defaultSettings,
	extensionFolderPath,
	extensionName,
} from "./constants.js";
import {
	emitPromeEvent,
	PROME_SPEAKER_CHANGED,
	PROME_SPRITE_FOLDER_CHANGED,
	PROME_STREAM_BYTE,
	promeBus,
} from "./core/bus.js";
import { classifyExpression } from "./core/classifier.js";
import { chooseExpressionSprite } from "./core/sprite-variants.js";
import { resolveSpriteFolder } from "./core/sprites.js";
import { mountStage, renderActors, unmountStage } from "./core/stage.js";
import {
	filterActiveGroupCharacters,
	initAutoHideModule,
} from "./modules/auto-hide.js";
import { initClassifierSettings } from "./modules/classifier-settings.js";
import { initEmulateModule } from "./modules/emulate.js";
import { registerExpressionCommands } from "./modules/expression-commands.js";
import { initFocusModule } from "./modules/focus.js";
import { initLetterboxModule } from "./modules/letterbox.js";
import { initScaleModule } from "./modules/scale.js";
import { initShadowModule } from "./modules/shadows.js";
import { initShakeModule, stopShakeAnimation } from "./modules/shake.js";
import { initSheldModule } from "./modules/sheld.js";
import { initTintModule } from "./modules/tint.js";
import { initUserModule } from "./modules/user.js";
import { getSpriteList, isGroupChat } from "./utils.js";

let stageRevision = 0;
const expressionsByActor = new Map();
const spriteSelectionsByActor = new Map();
const pendingByAvatar = new Map();

function loadSettings() {
	extension_settings[extensionName] ??= {};
	const settings = extension_settings[extensionName];
	if (Object.keys(settings).length === 0 && power_user.waifuMode) {
		settings.enableVN_UI = true;
	}
	for (const [key, value] of Object.entries(defaultSettings)) {
		if (settings[key] === undefined) settings[key] = structuredClone(value);
	}
	$("#prome-enable-vn").prop("checked", settings.enableVN_UI);
}

async function classifyActor(avatar, message, spritePackName) {
	if (
		extension_settings[extensionName].classifierMode === CLASSIFIER_MODES.NONE
	)
		return false;
	const request = Symbol();
	pendingByAvatar.set(avatar, request);

	const { sprites, err } = spritePackName?.trim()
		? await getSpriteList(spritePackName)
		: { sprites: [], err: null };
	if (pendingByAvatar.get(avatar) !== request) return false; // A newer request has been made for this avatar

	if (err || !sprites.length) {
		pendingByAvatar.delete(avatar);
		return false;
	}

	const label = await classifyExpression(
		message,
		sprites.map((sprite) => sprite.label),
		extension_settings[extensionName],
	);
	if (pendingByAvatar.get(avatar) !== request) return false; // A newer request has been made for this avatar

	pendingByAvatar.delete(avatar);
	expressionsByActor.set(avatar, { label });
	return true;
}

// ST locks named personas to a thumbnail URL. Older chats can store the avatar path
// directly, while unlocked user messages follow the currently selected persona.
function matchesCurrentPersona(message) {
	const avatar = message.force_avatar;
	if (!avatar) return true;
	if (avatar.startsWith("/thumbnail?")) {
		const params = new URLSearchParams(avatar.slice(avatar.indexOf("?") + 1));
		return (
			params.get("type") === "persona" && params.get("file") === user_avatar
		);
	}
	return avatar === getUserAvatar(user_avatar);
}

/**
 * Updates the expression of the speaker based on their message.
 * @param {*} messageId The ID of the message that was rendered.
 * @returns
 */
async function updateSpeakerExpression(messageId) {
	const settings = extension_settings[extensionName];
	if (!settings.enableVN_UI) return;

	const context = getContext();
	const message = context.chat[messageId];
	if (message?.is_system || !message?.mes?.trim()) return;

	let actorId;
	let spritePackName;

	if (message.is_user) {
		if (
			!settings.enableUserSprite ||
			!user_avatar ||
			!matchesCurrentPersona(message)
		)
			return;

		actorId = `persona:${user_avatar}`;
		spritePackName = resolveSpriteFolder(
			actorId,
			settings.userSprite,
			settings,
		);
		if (!spritePackName) return;
	} else {
		const char =
			context.groupId != null
				? context.characters.find((c) => c.avatar === message.original_avatar)
				: context.characters[context.characterId];
		if (!char?.avatar) return;

		actorId = `character:${char.avatar}`;
		spritePackName = resolveSpriteFolder(actorId, char.name, settings);
	}

	emitPromeEvent(PROME_SPEAKER_CHANGED, { actorId });

	// Classify and update expression for the actor
	if (
		settings.classifierMode === CLASSIFIER_MODES.NONE ||
		(await classifyActor(actorId, message.mes, spritePackName)) ||
		(settings.autoHideSprites && isGroupChat())
	) {
		await refreshStage();
	}
}

/**
 * Loads the sprite pack or emulated portrait for a character.
 * @param {*} character The character object containing name and avatar.
 */
async function loadCharacterActor(character) {
	const settings = extension_settings[extensionName];
	const id = `character:${character.avatar}`;
	const folder = resolveSpriteFolder(id, character.name, settings);
	const { sprites, err } = await getSpriteList(folder);
	if (!err && sprites?.length > 0) {
		return {
			id,
			name: character.name,
			sprites,
		};
	}

	// Fallback: If character has no sprite pack, emulate card as sprite
	if (settings.emulateSprites && character.avatar) {
		return {
			id,
			name: character.name,
			expression: "card",
			spriteUrl: `/characters/${encodeURIComponent(character.avatar)}`,
		};
	}
	return null;
}

/**
 * Refreshes the Prome VN stage by re-rendering the actors based on the current context and settings.
 * @returns A promise that resolves when the stage has been refreshed.
 */
async function refreshStage() {
	if (!document.body.classList.contains("prome-vn-active")) return;
	const revision = ++stageRevision;
	const context = getContext();
	const settings = extension_settings[extensionName];
	const userObj = {
		id: `persona:${user_avatar}`,
		name: context.name1,
	};
	const personaFolder =
		settings.enableUserSprite && user_avatar
			? resolveSpriteFolder(userObj.id, settings.userSprite, settings)
			: "";

	if (!context.getCurrentChatId()) {
		renderActors([]);
		return;
	}

	const group = context.groups.find((group) => group.id === context.groupId);
	const hiddenAvatars = new Set(
		group?.hideMutedSprites ? group.disabled_members : [],
	);
	const characters = isGroupChat()
		? (group?.members ?? [])
				.filter((avatar) => !hiddenAvatars.has(avatar))
				.map((avatar) =>
					context.characters.find((char) => char.avatar === avatar),
				)
				.filter(Boolean)
		: [context.characters[context.characterId]].filter(Boolean);

	const stageCharacters = filterActiveGroupCharacters(characters);
	const actors = await Promise.all(stageCharacters.map(loadCharacterActor));
	if (revision !== stageRevision) return;

	if (personaFolder) {
		const { sprites: userSprites, err } = await getSpriteList(personaFolder);

		if (err) {
			console.error(`[${extensionName}] Could not load persona sprites`, err);
		}

		if (userSprites.length) actors.push({ ...userObj, sprites: userSprites });
	}

	if (revision !== stageRevision) return;
	const actorsToRender = actors.filter(Boolean).map(({ sprites, ...actor }) => {
		if (!sprites) {
			spriteSelectionsByActor.delete(actor.id);
			return actor;
		}
		const expression = expressionsByActor.get(actor.id);
		const previous = spriteSelectionsByActor.get(actor.id);
		const sprite = chooseExpressionSprite(
			sprites,
			expression,
			previous,
			settings,
		);
		if (!sprite) {
			spriteSelectionsByActor.delete(actor.id);
			return null;
		}
		spriteSelectionsByActor.set(actor.id, {
			expression,
			spriteUrl: sprite.path,
			allowMultipleSprites: settings.allowMultipleSprites,
		});
		return { ...actor, expression: sprite.label, spriteUrl: sprite.path };
	});
	renderActors(actorsToRender);
}

async function restoreStageExpressions({
	restoreSpeaker = true,
	onlyActorId,
} = {}) {
	const context = getContext();
	const chat = context.chat;
	const chatId = context.getCurrentChatId();
	if (!chatId || !Array.isArray(chat) || chat.length === 0) return;
	if (
		!restoreSpeaker &&
		extension_settings[extensionName].classifierMode === CLASSIFIER_MODES.NONE
	)
		return;

	const settings = extension_settings[extensionName];

	const packByActorId = new Map();
	const trackActor = (actorId, defaultFolder) => {
		if (onlyActorId && actorId !== onlyActorId) return;
		const folder = resolveSpriteFolder(actorId, defaultFolder, settings);
		if (folder) packByActorId.set(actorId, folder);
	};

	if (isGroupChat()) {
		const group = context.groups.find((group) => group.id === context.groupId);
		(group?.members ?? []).forEach((avatar) => {
			const character = context.characters.find(
				(char) => char.avatar === avatar,
			);
			if (character) trackActor(`character:${avatar}`, character.name);
		});
	} else {
		const character = context.characters[context.characterId];
		if (character?.avatar) {
			trackActor(`character:${character.avatar}`, character.name);
		}
	}

	// Add user avatar if user sprite is enabled
	const personaId = `persona:${user_avatar}`;
	if (settings.enableUserSprite && user_avatar) {
		trackActor(personaId, settings.userSprite);
	}

	if (packByActorId.size === 0) return;

	// Scan backwards to grab latest messages for each avatar
	const latestMessagesByAvatar = new Map();

	for (let i = chat.length - 1; i >= 0; i--) {
		const message = chat[i];
		if (message.is_system || !message.mes?.trim()) continue;

		let avatar = null;

		if (message.is_user) {
			if (!matchesCurrentPersona(message)) continue;
			avatar = personaId;
		} else {
			avatar = isGroupChat()
				? `character:${message.original_avatar}`
				: `character:${context.characters[context.characterId]?.avatar}`;
		}

		if (
			avatar &&
			packByActorId.has(avatar) &&
			!latestMessagesByAvatar.has(avatar)
		) {
			latestMessagesByAvatar.set(avatar, message.mes);
		}

		// Stop if we have found messages for all target avatars
		if (latestMessagesByAvatar.size === packByActorId.size) break;
	}

	if (latestMessagesByAvatar.size === 0) return;

	if (restoreSpeaker) {
		const latestSpeaker = latestMessagesByAvatar.keys().next().value;
		emitPromeEvent(PROME_SPEAKER_CHANGED, { actorId: latestSpeaker });
	}
	if (settings.classifierMode === CLASSIFIER_MODES.NONE) return;

	// Classify and update expressions for each avatar
	const updated = await Promise.all(
		Array.from(latestMessagesByAvatar, ([actorId, text]) =>
			classifyActor(actorId, text, packByActorId.get(actorId)),
		),
	);

	if (getContext().getCurrentChatId() === chatId && updated.some(Boolean)) {
		await refreshStage();
	}
}

function syncVNMode() {
	const settings = extension_settings[extensionName];
	const active =
		settings.enableVN_UI && Boolean(getContext().getCurrentChatId());

	$("body").toggleClass("prome-vn-active", active);

	if (active) {
		mountStage(document.body);
	} else {
		++stageRevision;
		pendingByAvatar.clear();
		stopShakeAnimation();
		unmountStage();
	}

	return active;
}

function rebuildStageFromHistory() {
	if (
		extension_settings[extensionName].classifierMode !== CLASSIFIER_MODES.NONE
	) {
		expressionsByActor.clear();
	}
	pendingByAvatar.clear();

	emitPromeEvent(PROME_SPEAKER_CHANGED, { actorId: null });

	if (syncVNMode()) {
		void refreshStage();
		void restoreStageExpressions();
	}
}

function onVNUI_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].enableVN_UI = value;
	saveSettingsDebounced();

	if (syncVNMode()) {
		void refreshStage();
		void restoreStageExpressions();
	}
}

/**
 * Injects a direct shortcut button next to the native Visual Novel Mode
 * toggle to open Prome's extension settings drawer.
 */
function injectUserSettingsShortcut() {
	const waifuLabel = document.querySelector('label[for="waifuMode"]');
	if (!waifuLabel || document.getElementById("prome-open-settings-shortcut"))
		return;

	const row = document.createElement("div");
	row.className = "prome-vn-toggle-row";
	const shortcut = document.createElement("button");
	shortcut.id = "prome-open-settings-shortcut";
	shortcut.type = "button";
	shortcut.className = "menu_button menu_button_icon";
	shortcut.innerHTML =
		'<i class="fa-solid fa-gear" aria-hidden="true"></i><span data-i18n="Prome Settings">Prome Settings</span>';

	shortcut.addEventListener("click", async (event) => {
		event.stopPropagation();
		const extDrawer = document.getElementById("extensions-settings-button");
		const drawerToggle = extDrawer?.querySelector(".drawer-toggle");
		const drawerContent = extDrawer?.querySelector(".drawer-content");
		const promeSettings = drawerContent?.querySelector(".prome-vn-settings");
		if (!drawerToggle || !promeSettings) return;

		shortcut.disabled = true;
		try {
			if (!drawerContent.classList.contains("openDrawer")) {
				await doNavbarIconClick.call(drawerToggle);
			}

			const inlineContent = $(
				promeSettings.querySelector(".inline-drawer-content"),
			);
			if (inlineContent.css("display") === "none") {
				promeSettings.querySelector(".inline-drawer-toggle")?.click();
			}
			await inlineContent.promise();
			promeSettings.scrollIntoView({ block: "start" });
			promeSettings
				.querySelector("#prome-enable-vn")
				?.focus({ preventScroll: true });
		} finally {
			shortcut.disabled = false;
		}
	});

	waifuLabel.before(row);
	row.append(waifuLabel, shortcut);
}

jQuery(async () => {
	const settingsHtml = await $.get(`${extensionFolderPath}/html/settings.html`);
	$("#extensions_settings").append(settingsHtml);

	loadSettings();

	// Init modules
	await initClassifierSettings({
		onClassifierChange: () => {
			pendingByAvatar.clear();
			const manualMode =
				extension_settings[extensionName].classifierMode ===
				CLASSIFIER_MODES.NONE;
			if (manualMode) {
				for (const [actorId, expression] of expressionsByActor) {
					if (!expression.manual) expressionsByActor.delete(actorId);
				}
			}
			if (document.body.classList.contains("prome-vn-active")) {
				if (manualMode) void refreshStage();
				else void restoreStageExpressions({ restoreSpeaker: false });
			}
		},
		onSpriteSettingsChange: () => {
			if (document.body.classList.contains("prome-vn-active"))
				void refreshStage();
		},
	});
	await initLetterboxModule();
	await initAutoHideModule();
	await initUserModule();
	registerExpressionCommands();
	await initEmulateModule();
	await initScaleModule();
	await initShadowModule();
	await initFocusModule();
	await initShakeModule();
	await initTintModule();
	await initSheldModule();

	$("#prome-enable-vn").on("click", onVNUI_Click);

	for (const page of ["keybinds", "commands"]) {
		$(`#prome-${page}`).on("click", async () => {
			const html = await renderExtensionTemplateAsync(
				`third-party/${extensionName}/html`,
				page,
			);
			await callGenericPopup(html, POPUP_TYPE.TEXT);
		});
	}

	// Inject shortcut in ST User Settings
	injectUserSettingsShortcut();
	eventSource.on(event_types.APP_READY, injectUserSettingsShortcut);

	// Register ST event listeners
	eventSource.on(event_types.CHAT_CHANGED, () => {
		stopShakeAnimation();
		expressionsByActor.clear();
		spriteSelectionsByActor.clear();
		rebuildStageFromHistory();
	});
	eventSource.on(event_types.MESSAGE_DELETED, rebuildStageFromHistory);
	eventSource.on(event_types.MESSAGE_EDITED, rebuildStageFromHistory);
	eventSource.on(event_types.MESSAGE_SWIPED, (messageId) => {
		const message = getContext().chat[messageId];
		if (!message || message.swipes?.[message.swipe_id] == null) return;

		void updateSpeakerExpression(messageId);
	});

	eventSource.on(event_types.PERSONA_CHANGED, async () => {
		if (syncVNMode()) {
			void refreshStage();
			if (extension_settings[extensionName].enableUserSprite && user_avatar) {
				void restoreStageExpressions({
					restoreSpeaker: false,
					onlyActorId: `persona:${user_avatar}`,
				});
			}
		}
	});
	eventSource.on(event_types.GROUP_UPDATED, async () => {
		if (syncVNMode()) {
			void refreshStage();
		}
	});
	eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, async (messageId) => {
		void updateSpeakerExpression(messageId);
		stopShakeAnimation();
	});
	eventSource.on(event_types.USER_MESSAGE_RENDERED, async (messageId) => {
		void updateSpeakerExpression(messageId);
	});
	eventSource.on(event_types.STREAM_TOKEN_RECEIVED, () => {
		if (!document.body.classList.contains("prome-vn-active")) return;

		const context = getContext();
		if (context.streamingProcessor?.type === "impersonate") return;

		const avatar = context.characters[context.characterId]?.avatar;
		if (!avatar) return;

		emitPromeEvent(PROME_STREAM_BYTE, { actorId: `character:${avatar}` });
	});
	eventSource.on(event_types.GENERATION_STOPPED, () => {
		stopShakeAnimation();
	});
	eventSource.on(event_types.GENERATION_ENDED, () => {
		stopShakeAnimation();
	});

	// Register PromeBus event listeners
	promeBus.addEventListener("PROME_STAGE_REFRESH_REQUESTED", () => {
		if (syncVNMode()) {
			void refreshStage();
		}
	});
	promeBus.addEventListener(PROME_SPRITE_FOLDER_CHANGED, (event) => {
		const { actorId } = event.detail;
		pendingByAvatar.delete(actorId);
		if (syncVNMode()) {
			void refreshStage();
			void restoreStageExpressions({
				restoreSpeaker: false,
				onlyActorId: actorId,
			});
		}
	});
	promeBus.addEventListener("PROME_USER_SPRITE_TOGGLED", async () => {
		const settings = extension_settings[extensionName];
		if (!syncVNMode() || !settings.enableUserSprite) return;
		if (!user_avatar) return;
		await restoreStageExpressions({
			restoreSpeaker: false,
			onlyActorId: `persona:${user_avatar}`,
		});
	});
	promeBus.addEventListener("PROME_SET_EXPRESSION", (event) => {
		const { actorId, expression, spritePath } = event.detail || {};
		if (actorId && (expression || expression === null)) {
			pendingByAvatar.delete(actorId);
			if (expression === null) expressionsByActor.delete(actorId);
			else
				expressionsByActor.set(actorId, {
					label: expression,
					spritePath,
					manual: true,
				});
			void refreshStage();
		}
	});

	// Initial load
	if (syncVNMode()) {
		void refreshStage();
		void restoreStageExpressions();
	}
});
