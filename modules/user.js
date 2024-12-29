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
				name: `${extension_settings[extensionName].userSprite}`,
				avatar: "prome-user",
				data: {
					creator_notes:
						"This is a dummy bot made for Prome's user sprites. Do not interact with this entry.",
				},
			});
		}

		if (extension_settings[extensionName].enableUserSprite) {
			if (!group.members.includes("prome-user")) 
				group.members.push("prome-user");
			group.disabled_members = group.disabled_members.filter(
				(x) => x !== "prome-user",
			);
		} else {
			group.members = group.members.filter((x) => x !== "prome-user");
			if (!group.disabled_members.includes("prome-user"))
				group.disabled_members.push("prome-user");
		}
	} else {
		// One-on-One Chat
		if (context.characterId === undefined) return;

		// CHeck if Prome's Expression Image IMG is in the Expression Holder Div
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
			
			promeExpression = $('#expression-prome-user');
			loadMovingUIState();
			dragElement(promeExpression);
		}
		if (extension_settings[extensionName].enableUserSprite) {
			$("#expression-prome-user").removeClass("displayNone");
		} else {
			$("#expression-prome-user").addClass("displayNone");
		}
		applyUserSpriteAttributes();
	}
}

async function applyUserSpriteAttributes() {
	const context = getContext();

	if (extension_settings[extensionName].enableUserSprite) {
		if (extension_settings[extensionName].userSprite.length === 0) return;
		const spritePackExists = await getSpriteList(
			`${extension_settings[extensionName].userSprite}`,
		);
		if (spritePackExists.length === 0) return;

		const originalSrc = $("#expression-prome-user").children("img").attr("src");
		let originalExpression = originalSrc.split("/").pop();
		if (originalExpression.length === 0) originalExpression = "neutral.png";

		$("#expression-prome-user")
			.children("img")
			.attr(
				"src",
				`/characters/${extension_settings[extensionName].userSprite}/${originalExpression}`,
			);

		if (context.groupId !== null)
			await eventSource.emit(event_types.GROUP_UPDATED);
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
	applyUserSpriteAttributes();
}
