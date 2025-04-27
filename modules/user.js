import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { getContext } from "../../../../extensions.js";
import {
	saveSettingsDebounced,
	eventSource,
	event_types,
} from "../../../../../script.js";
import { getGroupIndex, getSpriteList } from "../utils.js";
import { loadMovingUIState } from "../../../../power-user.js";
import { dragElement } from "../../../../RossAscends-mods.js";
import { sendExpressionCall } from "../../../expressions/index.js";
import { emulateSpritesDebounce } from "../listeners.js";

async function spritePackExists(spritePack) {
	if (spritePack.length === 0) return false;
	const spritePackExists = await getSpriteList(`${spritePack}`).then(
		(data) => data.length > 0,
	);
	return spritePackExists;
}

function setSpritePack(spritePack) {
	if (spritePack.length === 0) return;

	const existingOverrideIndex =
		extension_settings.expressionOverrides.findIndex(
			(e) => e.name === "prome-user",
		);
	if (existingOverrideIndex === -1) {
		extension_settings.expressionOverrides.push({
			name: "prome-user",
			path: spritePack,
		});
	} else {
		extension_settings.expressionOverrides[existingOverrideIndex].path =
			spritePack;
	}
}

export function applyUserSprite() {
	if (
		extension_settings[extensionName].enableUserSprite === (null || undefined)
	) {
		console.debug(
			`[${extensionName}] enableUserSprite returned null or undefined.`,
		);
	}

	console.debug(
		`[${extensionName}] Enable User Sprite?: ${extension_settings[extensionName].enableUserSprite}`,
	);

	$("body").toggleClass(
		"userSprite",
		extension_settings[extensionName].enableUserSprite,
	);
}

/*
 *
 */
export async function handleUserSprite() {
	const context = getContext();
	const groupIndex = getGroupIndex();

	if (groupIndex !== -1) {
		// Group Chat
		const group = context.groups[groupIndex];
		if (group.disabled_members.includes("prome-user")) {
			group.disabled_members = group.disabled_members.filter(
				(x) => x !== "prome-user",
			);
		}

		if (!context.characters.find((x) => x.avatar === "prome-user")) {
			context.characters.push({
				name: "Prome User Sprite (Do Not Click)",
				avatar: "prome-user",
				data: {
					creator_notes:
						"This is a dummy card made for Prome. Don't click this entry.",
				},
			});
		}

		if (extension_settings[extensionName].enableUserSprite) {
			if (!group.members.includes("prome-user"))
				group.members.push("prome-user");
		} else {
			if (group.members.includes("prome-user"))
				group.members = group.members.filter((x) => x !== "prome-user");
		}
	} else {
		// One-on-One Chat
		if (context.characterId === undefined) return;

		// Check if Prome's Expression Image IMG is in the Expression Holder Div
		const expressionHolder = $("#expression-wrapper");
		let promeExpression = expressionHolder.children("#expression-prome-user");
		if (promeExpression.length === 0) {
			const html = `<div id="expression-prome-user" class="expression-holder displayNone">
					<div id="expression-prome-userheader" class="fa-solid fa-grip drag-grabber"></div>
					<img id="expression-image" class="" src=""/>
				</div>`;

			expressionHolder.append(html);

			promeExpression = $("#expression-prome-user");
			loadMovingUIState();
			dragElement(promeExpression);
		}
		if (extension_settings[extensionName].enableUserSprite) {
			$("#expression-prome-user").removeClass("displayNone");
		} else {
			$("#expression-prome-user").addClass("displayNone");
		}
	}
}

export async function applyUserSpriteAttributes() {
	if (!spritePackExists(extension_settings[extensionName].userSprite)) {
		return;
	}

	const groupIndex = getGroupIndex();
	let originalExpression = "";

	if (extension_settings[extensionName].enableUserSprite) {
		// Update the User Sprite
		const originalSrc = $("#expression-prome-user").children("img").attr("src");

		originalExpression = "neutral";
		if (originalSrc !== undefined) {
			const srcData = originalSrc.split("/").pop();
			if (srcData.length > 0) originalExpression = srcData.split(".")[0];
		}

		$("#expression-prome-user")
			.children("img")
			.attr(
				"src",
				`/characters/${extension_settings[extensionName].userSprite}/${originalExpression}.png`,
			);
	}

	console.log(originalExpression);
	if (groupIndex !== -1) {
		// Group Chat
		await sendExpressionCall(
			extension_settings[extensionName].userSprite,
			originalExpression,
		);
	}
}

export function onUserSprite_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].enableUserSprite = value;
	saveSettingsDebounced();
	applyUserSprite();
	handleUserSprite();
	applyUserSpriteAttributes();

	if (extension_settings[extensionName].emulateSprites) {
		emulateSpritesDebounce();
	}
}

export async function onUserSprite_Input() {
	const packExists = await spritePackExists(this.value);
	if (!packExists) return false;
	const value = this.value;
	console.debug(`[${extensionName}] User Sprite: ${value}`);
	extension_settings[extensionName].userSprite = value;
	setSpritePack(value);
	saveSettingsDebounced();
	eventSource.emit(event_types.GROUP_UPDATED);
}
