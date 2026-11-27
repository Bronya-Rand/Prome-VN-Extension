import { extension_settings, getContext } from "../../../../extensions.js";
import { user_avatar } from "../../../../personas.js";
import { SlashCommand } from "../../../../slash-commands/SlashCommand.js";
import {
	ARGUMENT_TYPE,
	SlashCommandArgument,
	SlashCommandNamedArgument,
} from "../../../../slash-commands/SlashCommandArgument.js";
import { SlashCommandParser } from "../../../../slash-commands/SlashCommandParser.js";
import { extensionName } from "../constants.js";
import { emitPromeEvent, PROME_SET_EXPRESSION } from "../core/bus.js";
import { getSpriteFilename } from "../core/sprite-variants.js";
import {
	normalizeSpriteFolderOverride,
	resolveSpriteFolder,
	setSpriteFolderOverride,
} from "../core/sprites.js";
import { updateStageLayers } from "../core/stage.js";
import { getSpriteList, isGroupChat } from "../utils.js";

function resolveActor(context, target, settings) {
	const inGroup = context.groupId != null;
	const currentCharacter = context.characters[context.characterId];
	const group = context.groups.find((entry) => entry.id === context.groupId);
	const characters = inGroup
		? (group?.members ?? []).map((avatar) =>
				context.characters.find((character) => character.avatar === avatar),
			)
		: [currentCharacter];
	const actors = characters.filter(Boolean).map(({ name, avatar }) => ({
		id: `character:${avatar}`,
		avatar,
		name,
		defaultFolder: name,
	}));
	const persona = user_avatar
		? {
				id: `persona:${user_avatar}`,
				avatar: user_avatar,
				name: context.name1,
				defaultFolder: settings.userSprite,
			}
		: null;
	if (persona) actors.push(persona);

	const name = target?.trim();
	if (!name) {
		if (!inGroup && currentCharacter) return actors[0];
		toastr.warning(
			"Choose an actor by name or ID with actor= in a group chat.",
		);
		return null;
	}
	const exact = actors.find((actor) => actor.id === name);
	if (exact) return exact;
	if (name.toLowerCase() === "persona" && persona) return persona;
	const matches = actors.filter(
		(actor) =>
			actor.avatar === name || actor.name?.toLowerCase() === name.toLowerCase(),
	);
	if (matches.length === 1) return matches[0];
	toastr.warning(
		matches.length
			? "More than one actor matches. Use the full actor ID."
			: "Actor not found in the current chat.",
	);
	return null;
}

async function setExpression({ actor, type = "label" }, requested) {
	const context = getContext();
	const chatId = context.getCurrentChatId();
	if (!chatId) return "";
	const settings = extension_settings[extensionName];
	const target = resolveActor(context, actor, settings);
	if (!target) return "";
	const value = requested?.trim();
	if (!value || value === "#reset") {
		emitPromeEvent(PROME_SET_EXPRESSION, {
			actorId: target.id,
			expression: null,
		});
		return "";
	}
	if (type !== "label" && type !== "sprite") {
		toastr.warning("Use type=label or type=sprite.");
		return "";
	}

	const folder = resolveSpriteFolder(target.id, target.defaultFolder, settings);
	const { sprites, err } = await getSpriteList(folder);
	if (err) {
		toastr.error("Could not load the selected sprite folder.");
		return "";
	}
	if (
		getContext().getCurrentChatId() !== chatId ||
		resolveSpriteFolder(target.id, target.defaultFolder, settings) !== folder
	)
		return "";
	const sprite = sprites.find(
		(entry) =>
			!settings.removedCustomExpressions?.includes(entry.label.toLowerCase()) &&
			(type === "sprite"
				? getSpriteFilename(entry) === value
				: entry.label.toLowerCase() === value.toLowerCase()),
	);
	if (!sprite) {
		toastr.warning(
			`No matching sprite for "${value}" in ${target.name}'s active pack.`,
		);
		return "";
	}
	emitPromeEvent(PROME_SET_EXPRESSION, {
		actorId: target.id,
		expression: sprite.label,
		spritePath: type === "sprite" ? sprite.path : undefined,
	});
	return type === "sprite" ? getSpriteFilename(sprite) : sprite.label;
}

function setCostume({ actor }, requested) {
	const context = getContext();
	if (!context.getCurrentChatId()) return "";
	const settings = extension_settings[extensionName];
	const target = resolveActor(context, actor, settings);
	if (!target) return "";
	const folder = normalizeSpriteFolderOverride(
		requested ?? "",
		target.defaultFolder,
	);
	if (folder === null) {
		toastr.warning("Enter a folder or Folder/Subfolder under characters.");
		return "";
	}
	setSpriteFolderOverride(target.id, folder, settings);
	return resolveSpriteFolder(target.id, target.defaultFolder, settings);
}

export function registerExpressionCommands() {
	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "update-layers",
			callback: () => {
				if (
					!document.body.classList.contains("prome-vn-active") ||
					!isGroupChat()
				) {
					toastr.warning("Open a group chat with the Prome stage enabled.");
					return false;
				}
				updateStageLayers();
				return true;
			},
			helpString:
				"Recalculate sprite overlap and speaker layers on the Prome group stage.",
		}),
	);

	const actorArgument = () =>
		SlashCommandNamedArgument.fromProps({
			name: "actor",
			description:
				"Actor name, avatar, full ID (e.g. character:alice.png), or persona. Required in groups.",
			typeList: [ARGUMENT_TYPE.STRING],
		});
	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "prome-expression",
			callback: setExpression,
			namedArgumentList: [
				actorArgument(),
				SlashCommandNamedArgument.fromProps({
					name: "type",
					description:
						"Use label for an expression or sprite for an exact filename.",
					typeList: [ARGUMENT_TYPE.STRING],
					defaultValue: "label",
					enumList: ["label", "sprite"],
				}),
			],
			unnamedArgumentList: [
				new SlashCommandArgument("Expression, exact filename, or #reset", [
					ARGUMENT_TYPE.STRING,
				]),
			],
			helpString: `(Prome Visual Novel Extension) Sets a Prome actor's expression. Examples <code>/prome-expression joy</code>,
			<code>/prome-expression actor=Alice type=sprite joy-2.png</code>, and
			<code>/prome-expression actor=persona #reset</code>.`,
		}),
	);
	SlashCommandParser.addCommandObject(
		SlashCommand.fromProps({
			name: "prome-costume",
			callback: setCostume,
			namedArgumentList: [actorArgument()],
			unnamedArgumentList: [
				new SlashCommandArgument(
					"Folder, Folder/Subfolder, or /Subfolder. Omit to reset.",
					[ARGUMENT_TYPE.STRING],
				),
			],
			helpString: `(Prome Visual Novel Extension) Sets a Prome actor's sprite folder override. Examples
			<code>/prome-costume actor=Alice /Winter</code> and
			<code>/prome-costume actor=persona</code> to reset the persona's folder.`,
		}),
	);
}
