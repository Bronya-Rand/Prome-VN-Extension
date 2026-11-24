import {
	getRequestHeaders,
	saveSettingsDebounced,
} from "../../../../../script.js";
import { extensionName } from "../constants.js";
import { emitPromeEvent, PROME_SPRITE_FOLDER_CHANGED } from "./bus.js";

export function resolveSpriteFolder(actorId, defaultFolder, settings) {
	return settings.spriteFolderOverrides?.[actorId] || defaultFolder || "";
}

export function normalizeSpriteFolderOverride(value, defaultFolder) {
	const input = value.trim().replaceAll("\\", "/");
	if (!input) return "";
	const root = defaultFolder?.split("/")[0];
	const folder = input.startsWith("/") && root ? `${root}${input}` : input;
	const parts = folder.split("/");
	if (
		parts.length > 2 ||
		parts.some((part) => !part.trim() || part === "." || part === "..")
	) {
		return null;
	}
	return folder;
}

export function setSpriteFolderOverride(actorId, folder, settings) {
	const overrides = { ...settings.spriteFolderOverrides };
	if (folder === (overrides[actorId] ?? "")) return false;
	if (folder) overrides[actorId] = folder;
	else delete overrides[actorId];
	settings.spriteFolderOverrides = overrides;
	saveSettingsDebounced();
	emitPromeEvent(PROME_SPRITE_FOLDER_CHANGED, { actorId });
	return true;
}

/**
 * Fetches all sprites for a given folder name.
 * @param {string} folderName - The name of the folder to fetch sprites from.
 * @returns {Promise<Array>} - A promise that resolves to an array of sprite objects.
 */
export async function fetchSprites(folderName) {
	if (!folderName) return [];
	const res = await fetch(`/api/sprites/get?name=${encodeURIComponent(folderName)}`);
	if (!res.ok) throw new Error(`Could not load sprite folder "${folderName}" (HTTP ${res.status}).`);
	return res.json();
}

/**
 * Uploads a sprite for a given emotion.
 * @param {string} folderName The name of the folder to upload the sprite to.
 * @param {string} label The emotion label for the sprite.
 * @param {File} file The sprite file to upload.
 * @param {string|null} spriteName Optional name for the sprite.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the upload was successful.
 */
export async function uploadSprite(folderName, label, file, spriteName = null) {
	const formData = new FormData();
	formData.append("name", folderName);
	formData.append("label", label);
	formData.append("avatar", file);
	if (spriteName) formData.append("spriteName", spriteName);

	try {
		const res = await fetch("/api/sprites/upload", {
			method: "POST",
			headers: getRequestHeaders({ omitContentType: true }),
			body: formData,
		});
		return res.ok;
	} catch (error) {
		console.error(`[${extensionName}] Failed to upload sprite:`, error);
		return false;
	}
}

/**
 * Uploads a sprite pack for a given folder name.
 * @param {string} folderName The name of the folder to upload the sprite pack to.
 * @param {File} zipFile The zip file containing the sprite pack.
 * @returns {Promise<{ ok: boolean, count?: number }|null>} - Response from the server.
 */
export async function uploadSpritePack(folderName, zipFile) {
	const formData = new FormData();
	formData.append("name", folderName);
	formData.append("avatar", zipFile);

	try {
		const res = await fetch("/api/sprites/upload-zip", {
			method: "POST",
			headers: getRequestHeaders({ omitContentType: true }),
			body: formData,
		});
		return res.ok ? await res.json() : null;
	} catch (error) {
		console.error(`[${extensionName}] Failed to upload sprite pack:`, error);
		return null;
	}
}

/**
 * Deletes a sprite for a given folder name, label, and sprite name.
 * @param {string} folderName The name of the folder to delete the sprite from.
 * @param {string} label The emotion label for the sprite.
 * @param {string|null} spriteName The name of the sprite to delete.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the deletion was successful.
 */
export async function deleteSprite(folderName, label, spriteName = null) {
	try {
		const res = await fetch("/api/sprites/delete", {
			method: "POST",
			headers: getRequestHeaders(),
			body: JSON.stringify({
				name: folderName,
				label,
				spriteName: spriteName || label,
			}),
		});
		return res.ok;
	} catch (error) {
		console.error(`[${extensionName}] Failed to delete sprite:`, error);
		return false;
	}
}
