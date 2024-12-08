import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { getContext } from "../../../../extensions.js";
import {
	saveSettingsDebounced,
	eventSource,
	event_types,
} from "../../../../../script.js";
import { getSpriteList } from "../utils.js";

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

export async function handleUserSprite() {
	const context = getContext();
	const groupIndex = context.groups.findIndex((x) => {
		return x.id === context.groupId;
	});
	if (groupIndex === -1) return;
	const group = context.groups[groupIndex];

	if (!context.characters.find((x) => x.name === "prome-user")) {
		context.characters.push({
			name: `${extension_settings[extensionName].userSprite}`,
			avatar: "prome-user",
		});
	}

	if (extension_settings[extensionName].enableUserSprite) {
		group.members.push("prome-user");
		group.disabled_members = group.disabled_members.filter(
			(x) => x !== "prome-user",
		);
	} else {
		group.members = group.members.filter((x) => x !== "prome-user");
		group.disabled_members.push("prome-user");
	}

	await eventSource.emit(event_types.GROUP_UPDATED);
}

async function applyUserSpriteAttributes() {
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
