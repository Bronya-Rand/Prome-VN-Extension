import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { getContext } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { getGroupIndex, getSpriteList } from "../utils.js";
import { loadMovingUIState } from "../../../../power-user.js";
import { dragElement } from "../../../../RossAscends-mods.js";
import { sendExpressionCall } from "../../../expressions/index.js";

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
			if (group.disabled_members.includes("prome-user"))
				group.disabled_members = group.disabled_members.filter(
					(x) => x !== "prome-user",
				);
		} else {
			if (!group.disabled_members.includes("prome-user"))
				group.disabled_members.push("prome-user");
			if (group.members.includes("prome-user"))
				group.members = group.members.filter((x) => x !== "prome-user");
		}
	} else {
		// One-on-One Chat
		if (context.characterId === undefined) return;

		// Check if Prome's Expression Image IMG is in the Expression Holder Div
		const expressionHolder = $("#expression-wrapper");
		let promeExpression = $("#expression-wrapper").children(
			"#expression-prome-user",
		);
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
	await applyUserSpriteAttributes();
}

async function applyUserSpriteAttributes(newSpritePack = false) {
	const groupIndex = getGroupIndex();

	if (extension_settings[extensionName].enableUserSprite) {
		if (extension_settings[extensionName].userSprite.length === 0) return;
		const spritePackExists = await getSpriteList(
			`${extension_settings[extensionName].userSprite}`,
		);
		if (spritePackExists.length === 0) return;

		// Update the User Sprite Pack
		if (newSpritePack) {
			const existingOverrideIndex =
				extension_settings.expressionOverrides.findIndex(
					(e) => e.name === "prome-user",
				);
			if (existingOverrideIndex === -1) {
				extension_settings.expressionOverrides.push({
					name: "prome-user",
					path: extension_settings[extensionName].userSprite,
				});
			} else {
				extension_settings.expressionOverrides[existingOverrideIndex].path =
					extension_settings[extensionName].userSprite;
			}
			saveSettingsDebounced();
		}

		// Update the User Sprite
		const originalSrc = $("#expression-prome-user").children("img").attr("src");
		let originalExpression = "neutral";
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

		if (groupIndex !== -1) {
			// Group Chat
			await sendExpressionCall(
				extension_settings[extensionName].userSprite,
				originalExpression,
			);
		}
	}
}

export function onUserSprite_Click(event) {
	const value = Boolean($(event.target).prop("checked"));
	extension_settings[extensionName].enableUserSprite = value;
	saveSettingsDebounced();
	applyUserSprite();
	handleUserSprite();
}

export function onUserSprite_Input() {
	const value = this.value;
	console.debug(`[${extensionName}] User Sprite: ${value}`);
	extension_settings[extensionName].userSprite = value;
	saveSettingsDebounced();
	applyUserSpriteAttributes(true);
}
