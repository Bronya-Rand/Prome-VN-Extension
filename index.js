/* ST Core Imports */
import {
	event_types,
	eventSource,
	saveSettingsDebounced,
} from "../../../../script.js";
import { extension_settings, getContext } from "../../../extensions.js";
import { user_avatar } from "../../../personas.js";
import { power_user } from "../../../power-user.js";

/* Prome Core Imports */
import {
	defaultSettings,
	extensionFolderPath,
	extensionName,
} from "./constants.js";
import {
	emitPromeEvent,
	PROME_SPEAKER_CHANGED,
	PROME_STREAM_BYTE,
	promeBus,
} from "./core/bus.js";
import { classifyLocal } from "./core/classifier.js";
import { mountStage, renderActors, unmountStage } from "./core/stage.js";
import {
	filterActiveGroupCharacters,
	initAutoHideModule,
} from "./modules/auto-hide.js";
import { initEmulateModule } from "./modules/emulate.js";
import { initFocusModule } from "./modules/focus.js";
import { initLetterboxModule } from "./modules/letterbox.js";
import { initScaleModule } from "./modules/scale.js";
import { initShadowModule } from "./modules/shadows.js";
import { initShakeModule, stopShakeAnimation } from "./modules/shake.js";
import { initTintModule } from "./modules/tint.js";
import { initUserModule } from "./modules/user.js";
import { getSpriteList, isGroupChat, spritePackExists } from "./utils.js";

let stageRevision = 0;
const labelsByAvatar = new Map();
const pendingByAvatar = new Map();

function loadSettings() {
	extension_settings[extensionName] = extension_settings[extensionName] || {};
	if (Object.keys(extension_settings[extensionName]).length === 0) {
		Object.assign(extension_settings[extensionName], defaultSettings);
		if (power_user.waifuMode) {
			extension_settings[extensionName].enableVN_UI = power_user.waifuMode;
		}
	}

	// Check if new settings are added to extension_settings
	for (const key in defaultSettings) {
		if (extension_settings[extensionName][key] === undefined) {
			console.debug(`[${extensionName}] New setting added: ${key}`);
			extension_settings[extensionName][key] = defaultSettings[key];
		}
	}

	$("#prome-enable-vn").prop(
		"checked",
		extension_settings[extensionName].enableVN_UI,
	);
}

async function classifyActor(avatar, message, spritePackName) {
	const request = Symbol();
	pendingByAvatar.set(avatar, request);

	const packExists = await spritePackExists(spritePackName);
	if (pendingByAvatar.get(avatar) !== request) return false; // A newer request has been made for this avatar

	if (!packExists) {
		pendingByAvatar.delete(avatar);
		return false;
	}

	const label = await classifyLocal(message);
	if (pendingByAvatar.get(avatar) !== request) return false; // A newer request has been made for this avatar

	pendingByAvatar.delete(avatar);
	if (!label) return false;

	labelsByAvatar.set(avatar, label);
	return true;
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
		if (!settings.enableUserSprite || !settings.userSprite || !user_avatar)
			return;

		actorId = `persona:${user_avatar}`;
		spritePackName = settings.userSprite;
	} else {
		const char =
			context.groupId != null
				? context.characters.find((c) => c.avatar === message.original_avatar)
				: context.characters[context.characterId];
		if (!char?.avatar) return;

		actorId = `character:${char.avatar}`;
		spritePackName = char.name;
	}

	emitPromeEvent(PROME_SPEAKER_CHANGED, { actorId });

	// Classify and update expression for the actor
	if (await classifyActor(actorId, message.mes, spritePackName)) {
		await refreshStage();
	}
}

/**
 * Loads a character actor with the specified character and preferred label.
 * @param {*} character The character object containing name and avatar.
 * @param {*} preferredLabel The preferred label for the sprite to load (default is "neutral").
 * @returns
 */
async function loadCharacterActor(character, preferredLabel = "neutral") {
	const { sprites, err } = await getSpriteList(character.name);
	if (!err && sprites?.length > 0) {
		// Sprites found
		const target = preferredLabel.toLowerCase().trim();
		const sprite =
			sprites.find((s) => s.label.toLowerCase() === target) ??
			sprites.find((s) => s.label.toLowerCase() === "neutral");
		if (sprite) {
			return {
				id: `character:${character.avatar}`,
				name: character.name,
				expression: sprite.label,
				spriteUrl: sprite.path,
			};
		}
	}

	// Fallback: If character has no sprite pack, emulate card as sprite
	const settings = extension_settings[extensionName];
	if (settings.emulateSprites && character.avatar) {
		return {
			id: `character:${character.avatar}`,
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
	const revision = ++stageRevision;
	const context = getContext();
	const settings = extension_settings[extensionName];
	const userObj = {
		id: `persona:${user_avatar}`,
		name: context.name1,
	};

	if (!context.getCurrentChatId()) {
		renderActors([]);
		return;
	}

	const group = context.groups.find((group) => group.id === context.groupId);
	let characters = isGroupChat()
		? (group?.members ?? [])
				.map((avatar) =>
					context.characters.find((char) => char.avatar === avatar),
				)
				.filter(Boolean)
		: [context.characters[context.characterId]].filter(Boolean);

	// Filter down to the most recent talking characters if auto-hide is enabled:
	characters = filterActiveGroupCharacters(characters);
	const actorsToRender = await Promise.all(
		characters.map((character) =>
			loadCharacterActor(
				character,
				labelsByAvatar.get(`character:${character.avatar}`) ?? "neutral",
			),
		),
	);
	if (revision !== stageRevision) return;

	if (settings.enableUserSprite && settings.userSprite && user_avatar) {
		const { sprites: userSprites, err } = await getSpriteList(
			settings.userSprite,
		);

		if (err) {
			console.error(`[${extensionName}] Could not load persona sprites`, err);
		}

		const userLabel = labelsByAvatar.get(userObj.id) ?? "neutral";
		const userSprite =
			userSprites.find((sprite) => sprite.label === userLabel) ??
			userSprites.find((sprite) => sprite.label === "neutral");

		if (userSprite) {
			actorsToRender.push({
				...userObj,
				expression: userSprite.label,
				spriteUrl: userSprite.path,
			});
		}
	}

	if (revision !== stageRevision) return;
	renderActors(actorsToRender);
}

async function restoreStageExpressions() {
	const context = getContext();
	const chat = context.chat;
	const chatId = context.getCurrentChatId();
	if (!chatId || !Array.isArray(chat) || chat.length === 0) return;

	const settings = extension_settings[extensionName];

	const packByActorId = new Map();

	if (isGroupChat()) {
		const group = context.groups.find((group) => group.id === context.groupId);
		(group?.members ?? []).forEach((avatar) => {
			const character = context.characters.find(
				(char) => char.avatar === avatar,
			);
			packByActorId.set(`character:${avatar}`, character?.name ?? null);
		});
	} else {
		const character = context.characters[context.characterId];
		packByActorId.set(`character:${character.avatar}`, character?.name ?? null);
	}

	// Add user avatar if user sprite is enabled
	const trackUser =
		settings.enableUserSprite && settings.userSprite && user_avatar;
	if (trackUser) {
		packByActorId.set(`persona:${user_avatar}`, settings.userSprite);
	}

	if (packByActorId.size === 0) return;

	// Scan backwards to grab latest messages for each avatar
	const latestMessagesByAvatar = new Map();

	for (let i = chat.length - 1; i >= 0; i--) {
		const message = chat[i];
		if (message.is_system || !message.mes?.trim()) continue;

		let avatar = null;

		if (message.is_user) {
			if (trackUser) avatar = `persona:${user_avatar}`;
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

	const latestSpeaker = [...latestMessagesByAvatar.keys()][0];
	emitPromeEvent(PROME_SPEAKER_CHANGED, { actorId: latestSpeaker ?? null });

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
	labelsByAvatar.clear();
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

jQuery(async () => {
	const settingsHtml = await $.get(`${extensionFolderPath}/html/settings.html`);
	$("#extensions_settings").append(settingsHtml);

	loadSettings();

	// Init modules
	await initLetterboxModule();
	await initAutoHideModule();
	await initUserModule();
	await initEmulateModule();
	await initScaleModule();
	await initShadowModule();
	await initFocusModule();
	await initShakeModule();
	await initTintModule();

	$("#prome-enable-vn").on("click", onVNUI_Click);

	// Register ST event listeners
	eventSource.on(event_types.CHAT_CHANGED, () => {
		stopShakeAnimation();
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
	promeBus.addEventListener("PROME_USER_SPRITE_TOGGLED", async () => {
		const settings = extension_settings[extensionName];
		if (!syncVNMode() || !settings.enableUserSprite) return;
		if (!user_avatar || !settings.userSprite) return;

		const chat = getContext().chat;
		if (!Array.isArray(chat) || chat.length === 0) return;

		// Find the latest valid user message
		const lastUserMessage = chat.findLast(
			(message) => message.is_user && !message.is_system && message.mes?.trim(),
		);
		if (!lastUserMessage) return;

		const actorId = `persona:${user_avatar}`;
		if (
			await classifyActor(actorId, lastUserMessage.mes, settings.userSprite)
		) {
			await refreshStage();
		}
	});
	promeBus.addEventListener("PROME_SET_EXPRESSION", (event) => {
		const { actorId, expression } = event.detail || {};
		if (actorId && expression) {
			labelsByAvatar.set(actorId, expression);
			void refreshStage();
		}
	});

	// Initial load
	if (syncVNMode()) {
		void refreshStage();
		void restoreStageExpressions();
	}
});
