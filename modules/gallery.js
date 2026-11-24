import { saveSettingsDebounced } from "../../../../../script.js";
import { extension_settings, getContext } from "../../../../extensions.js";
import { user_avatar } from "../../../../personas.js";
import {
	callGenericPopup,
	POPUP_RESULT,
	POPUP_TYPE,
	Popup,
} from "../../../../popup.js";
import { power_user } from "../../../../power-user.js";
import {
	defaultSettings,
	DEFAULT_EXPRESSIONS,
	extensionFolderPath,
	extensionName,
} from "../constants.js";
import {
	emitPromeEvent,
	PROME_CUSTOM_EXPRESSIONS_CHANGED,
	PROME_SET_EXPRESSION,
	PROME_SPEAKER_CHANGED,
	PROME_SPRITE_FOLDER_CHANGED,
	PROME_STAGE_REFRESH_REQUESTED,
	promeBus,
} from "../core/bus.js";
import { getSpriteFilename, getSpriteStem } from "../core/sprite-variants.js";
import {
	deleteSprite,
	normalizeSpriteFolderOverride,
	resolveSpriteFolder,
	setSpriteFolderOverride,
	uploadSprite,
	uploadSpritePack,
} from "../core/sprites.js";
import { getSpriteList } from "../utils.js";

// SillyTavern's six-label Cohee/bert-base-uncased-emotion-onnx model.
const coreLabels = new Set([
	"anger",
	"fear",
	"joy",
	"love",
	"sadness",
	"surprise",
]);
export async function openSpriteGallery() {
	const templateHtml = await $.get(`${extensionFolderPath}/html/gallery.html`);
	const modal = $(templateHtml);
	populateTargetDropdown(modal.find("#prome-gallery-character"));

	const popup = new Popup(modal, POPUP_TYPE.TEXT, "", {
		large: true,
		allowVerticalScrolling: true,
		okButton: "Close",
	});
	const unbind = bindGalleryEvents(modal);

	try {
		const closed = popup.show();
		modal.find("#prome-gallery-character").trigger("change");
		await closed;
	} finally {
		unbind();
	}
}

function populateTargetDropdown(dropdown) {
	const context = getContext();
	const settings = extension_settings[extensionName];
	const listed = new Set();

	function appendTarget(group, actorId, name, folder) {
		if (listed.has(actorId)) return;
		const option = new Option(name, actorId);
		option.dataset.folder = folder;
		group.append(option);
		listed.add(actorId);
	}

	function appendCharacter(group, character) {
		appendTarget(
			group,
			`character:${character.avatar}`,
			character.name,
			character.name,
		);
	}

	if (context.groupId != null) {
		const group = context.groups.find((group) => group.id === context.groupId);
		const members = $("<optgroup label='Group Members'></optgroup>");
		for (const avatar of group?.members ?? []) {
			const character = context.characters.find(
				(character) => character.avatar === avatar,
			);
			if (character) appendCharacter(members, character);
		}
		if (members.children().length) dropdown.append(members);
	} else {
		const character = context.characters[context.characterId];
		if (character) {
			const current = $("<optgroup label='Current Character'></optgroup>");
			appendCharacter(current, character);
			dropdown.append(current);
		}
	}

	const personaFolder = settings.userSprite?.trim() ?? "";
	if (user_avatar) {
		const personas = $("<optgroup label='Current Persona'></optgroup>");
		appendTarget(
			personas,
			`persona:${user_avatar}`,
			context.name1 || "User Persona",
			personaFolder,
		);
		dropdown.append(personas);
	}

	const library = $("<optgroup label='Character Library'></optgroup>");
	for (const character of context.characters) {
		appendCharacter(library, character);
	}
	if (library.children().length) dropdown.append(library);

	const otherPersonas = $("<optgroup label='Other Personas'></optgroup>");
	for (const [avatar, name] of Object.entries(power_user.personas ?? {})) {
		if (name)
			appendTarget(otherPersonas, `persona:${avatar}`, name, personaFolder);
	}
	if (otherPersonas.children().length) dropdown.append(otherPersonas);
}

function updateVariantThumbnail(card, sprite) {
	const filename = getSpriteFilename(sprite);
	card.find(".prome-gallery-variant-select").attr("title", filename);
	card
		.find(".prome-gallery-card-body img")
		.attr({ src: sprite.path, alt: filename });
}

function nextVariantStem(label, sprites) {
	const stems = new Set(
		sprites.map((sprite) => getSpriteStem(sprite).toLowerCase()),
	);
	let number = 1;
	while (stems.has(`${label}-${number}`)) number++;
	return `${label}-${number}`;
}

function renderCards(
	sprites,
	coreGrid,
	extraGrid,
	settings,
	selectedFilenames,
) {
	coreGrid.empty();
	extraGrid.empty();
	const allLabels = [
		...new Set([
			...DEFAULT_EXPRESSIONS,
			...sprites.map((sprite) => sprite.label.toLowerCase()),
			...(settings.customExpressions ?? []),
		]),
	]
		.filter((label) => !settings.removedCustomExpressions?.includes(label))
		.sort();

	for (const label of allLabels) {
		const variants = sprites
			.filter((sprite) => sprite.label.toLowerCase() === label)
			.sort((a, b) => {
				const baseA = getSpriteStem(a).toLowerCase() === label;
				const baseB = getSpriteStem(b).toLowerCase() === label;
				return (
					Number(baseB) - Number(baseA) ||
					getSpriteFilename(a).localeCompare(getSpriteFilename(b), undefined, {
						numeric: true,
					})
				);
			});
		const hasSprite = variants.length > 0;
		const isCustom = !DEFAULT_EXPRESSIONS.includes(label);
		const card = $(`
			<div class="prome-gallery-card ${hasSprite ? "has-sprite" : "no-sprite"}">
				<div class="prome-gallery-card-header">
					<span class="label-name"></span>
				</div>
				<div class="prome-gallery-card-body"></div>
				<div class="prome-gallery-card-actions">
					${hasSprite ? `<button type="button" class="prome-btn-preview menu_button menu_button_icon" title="Test on Stage"><i class="fa-solid fa-eye"></i></button>` : ""}
					<button type="button" class="prome-btn-upload menu_button menu_button_icon" title="${hasSprite ? "Replace Selected Sprite" : "Upload Sprite"}"><i class="fa-solid fa-arrow-up-from-bracket"></i></button>
					${hasSprite ? `<button type="button" class="prome-btn-add-variant menu_button menu_button_icon" title="Add Variant" aria-label="Add Variant"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>` : ""}
					${hasSprite ? `<button type="button" class="prome-btn-delete menu_button menu_button_icon" title="Delete Sprite" aria-label="Delete Sprite"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>` : ""}
					${isCustom ? `<button type="button" class="prome-btn-remove-expression menu_button menu_button_icon" title="Remove Custom Expression" aria-label="Remove Custom Expression"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>` : ""}
				</div>
			</div>
		`).attr("data-label", label);
		card.find(".label-name").text(label).attr("title", label);
		if (variants.length > 1) {
			card
				.find(".prome-gallery-card-header")
				.append(
					$("<span class='variant-badge'></span>").text(`(${variants.length})`),
				);
		}
		const body = card.find(".prome-gallery-card-body");
		if (hasSprite) {
			const select = $(
				'<select class="text_pole prome-gallery-variant-select"></select>',
			)
				.attr("aria-label", `${label} sprite file`)
				.prop("disabled", variants.length === 1);
			for (const sprite of variants) {
				select.append(new Option(getSpriteFilename(sprite), sprite.path));
			}
			const selected =
				variants.find(
					(sprite) =>
						getSpriteFilename(sprite) === selectedFilenames.get(label),
				) ?? variants[0];
			select.val(selected.path).insertAfter(body);
			body.append($("<img>").attr("loading", "lazy"));
			updateVariantThumbnail(card, selected);
		} else {
			body.append($('<i class="fa-solid fa-plus placeholder-icon"></i>'));
		}

		(coreLabels.has(label) ? coreGrid : extraGrid).append(card);
	}
}

function filterCards(query, grid, countDisplay) {
	const term = (query || "").trim().toLowerCase();
	const cards = grid.find(".prome-gallery-card");
	let visible = 0;

	grid.find(".prome-gallery-section").each(function () {
		const section = $(this);
		let matches = 0;
		section.find(".prome-gallery-card").each(function () {
			const match = this.dataset.label.includes(term);
			$(this).toggle(match);
			if (match) matches++;
		});
		this.hidden = matches === 0;
		visible += matches;
	});

	countDisplay.text(`${visible} / ${cards.length}`);
}

function bindGalleryEvents(modal) {
	const settings = extension_settings[extensionName];
	const targetSelect = modal.find("#prome-gallery-character");
	const overrideInput = modal.find("#prome-gallery-folder-override");
	const applyOverride = modal.find("#prome-gallery-apply-override");
	const resetOverride = modal.find("#prome-gallery-reset-override");
	const searchInput = modal.find("#prome-gallery-search");
	const countDisplay = modal.find("#prome-gallery-count");
	const grid = modal.find("#prome-gallery-grid");
	const coreGrid = modal.find("#prome-gallery-core-grid");
	const extraGrid = modal.find("#prome-gallery-extra-grid");
	const status = modal.find("#prome-gallery-status");
	const pinBtn = modal.find("#prome-gallery-pin-btn");
	const zipBtn = modal.find("#prome-gallery-zip-btn");
	const addExpressionBtn = modal.find("#prome-gallery-add-emotion-btn");
	const zipInput = modal.find("#prome-gallery-zip-input");
	const fileInput = modal.find("#prome-gallery-file-input");

	let isPinned = false;
	let isClosed = false;
	let loadRevision = 0;
	let sprites = [];
	let pendingUpload = null;
	let uploadInProgress = false;
	let loadedFolder;
	const selectedFilenames = new Map();

	const selectedTarget = () => targetSelect[0].selectedOptions[0];
	const selectedFolder = () => {
		const target = selectedTarget();
		return target
			? resolveSpriteFolder(target.value, target.dataset.folder, settings)
			: "";
	};
	const cardLabel = (button) =>
		button.closest(".prome-gallery-card").dataset.label;
	const selectedSprite = (control) => {
		const path = $(control.closest(".prome-gallery-card")).find(
			".prome-gallery-variant-select",
		)[0]?.value;
		return sprites?.find((sprite) => sprite.path === path);
	};
	const sharesSpriteStem = (sprite) =>
		sprites.some(
			(other) =>
				other !== sprite && getSpriteStem(other) === getSpriteStem(sprite),
		);

	function redrawCards() {
		renderCards(sprites, coreGrid, extraGrid, settings, selectedFilenames);
		filterCards(searchInput.val(), grid, countDisplay);
	}

	async function loadTargetSprites() {
		const folder = selectedFolder();
		const revision = ++loadRevision;
		if (folder !== loadedFolder) {
			selectedFilenames.clear();
			loadedFolder = folder;
		}
		coreGrid.empty();
		extraGrid.empty();
		sprites = null;
		zipBtn.add(addExpressionBtn).prop("disabled", true);
		filterCards(searchInput.val(), grid, countDisplay);
		status
			.prop("hidden", false)
			.text(
				folder
					? "Loading sprites…"
					: selectedTarget()
						? "Set a sprite folder override to manage this persona’s sprites."
						: "No sprite sets available.",
			);
		if (!folder) return;

		const { sprites: loaded, err } = await getSpriteList(folder);
		if (isClosed || revision !== loadRevision) return;
		if (err) {
			status.text("Could not load sprites. Reopen the gallery to retry.");
			return;
		}
		zipBtn.add(addExpressionBtn).prop("disabled", false);
		sprites = loaded;
		status.prop("hidden", true);
		redrawCards();
	}

	function refreshAfterEdit(folder) {
		emitPromeEvent(PROME_STAGE_REFRESH_REQUESTED);
		if (!isClosed && folder === selectedFolder()) void loadTargetSprites();
	}

	function syncOverrideControls() {
		const target = selectedTarget();
		const override = settings.spriteFolderOverrides?.[target?.value] ?? "";
		overrideInput
			.val(override)
			.attr(
				"placeholder",
				target?.dataset.folder || "Folder or Folder/Subfolder",
			)
			.prop("disabled", !target);
		applyOverride.prop("disabled", !target);
		resetOverride.prop("disabled", !override);
	}

	function setFolderOverride(folder) {
		const target = selectedTarget();
		if (!target) return;
		if (!setSpriteFolderOverride(target.value, folder, settings))
			syncOverrideControls();
	}

	const onFolderChanged = (event) => {
		if (event.detail.actorId !== selectedTarget()?.value) return;
		syncOverrideControls();
		void loadTargetSprites();
	};
	promeBus.addEventListener(PROME_SPRITE_FOLDER_CHANGED, onFolderChanged);

	targetSelect.on("change", () => {
		syncOverrideControls();
		void loadTargetSprites();
	});
	applyOverride.on("click", () => {
		const folder = normalizeSpriteFolderOverride(
			overrideInput.val(),
			selectedTarget()?.dataset.folder,
		);
		if (folder === null) {
			toastr.warning("Enter a folder or Folder/Subfolder under characters.");
			return;
		}
		setFolderOverride(folder);
	});
	resetOverride.on("click", () => setFolderOverride(""));
	overrideInput.on("keydown", (event) => {
		if (event.key !== "Enter") return;
		event.preventDefault();
		event.stopPropagation();
		applyOverride.trigger("click");
	});
	searchInput.on("input", function () {
		filterCards(this.value, grid, countDisplay);
	});

	pinBtn.on("click", () => {
		isPinned = !isPinned;
		pinBtn.attr({
			"aria-pressed": String(isPinned),
			title: isPinned
				? "Unpin and follow active speaker"
				: "Pin selected sprite set",
		});
	});

	const onSpeakerChanged = (event) => {
		const actorId = event.detail?.actorId;
		if (isPinned || !actorId || targetSelect.val() === actorId) return;
		if (
			Array.from(targetSelect[0].options).some(
				(option) => option.value === actorId,
			)
		) {
			targetSelect.val(actorId).trigger("change");
		}
	};
	promeBus.addEventListener(PROME_SPEAKER_CHANGED, onSpeakerChanged);

	function saveCustomExpressions() {
		saveSettingsDebounced();
		if (sprites) redrawCards();
		emitPromeEvent(PROME_CUSTOM_EXPRESSIONS_CHANGED);
	}

	addExpressionBtn.on("click", async () => {
		const name = await callGenericPopup(
			"Enter an expression name (e.g. smug or shy).",
			POPUP_TYPE.INPUT,
			"",
			{ okButton: "Add", cancelButton: "Cancel" },
		);
		if (isClosed || typeof name !== "string") return;
		const label = name.trim().toLowerCase();
		if (!label) return;
		const removed = settings.removedCustomExpressions ?? [];
		if (
			DEFAULT_EXPRESSIONS.includes(label) ||
			settings.customExpressions?.includes(label)
		) {
			toastr.warning("This expression already exists.");
			return;
		}
		settings.customExpressions = [...(settings.customExpressions ?? []), label];
		settings.removedCustomExpressions = removed.filter(
			(entry) => entry !== label,
		);
		saveCustomExpressions();
	});

	grid.on("click", ".prome-btn-remove-expression", async function () {
		const label = cardLabel(this);
		const result = await callGenericPopup(
			$("<p>").text(
				`Remove custom expression "${label}" from Prome? Sprite files will stay in their folders.`,
			),
			POPUP_TYPE.CONFIRM,
			"",
			{ okButton: "Remove", cancelButton: "Cancel" },
		);
		if (isClosed || result !== POPUP_RESULT.AFFIRMATIVE) return;
		settings.customExpressions = (settings.customExpressions ?? []).filter(
			(entry) => entry !== label,
		);
		settings.removedCustomExpressions = [
			...new Set([...(settings.removedCustomExpressions ?? []), label]),
		];
		if (settings.fallbackExpression?.trim().toLowerCase() === label) {
			settings.fallbackExpression = defaultSettings.fallbackExpression;
		}
		saveCustomExpressions();
	});

	grid.on("change", ".prome-gallery-variant-select", function () {
		const sprite = selectedSprite(this);
		if (!sprite) return;
		selectedFilenames.set(cardLabel(this), getSpriteFilename(sprite));
		updateVariantThumbnail($(this.closest(".prome-gallery-card")), sprite);
	});

	grid.on("click", ".prome-btn-preview", function () {
		const sprite = selectedSprite(this);
		if (!sprite) return;
		emitPromeEvent(PROME_SET_EXPRESSION, {
			actorId: targetSelect.val(),
			expression: cardLabel(this),
			spritePath: sprite.path,
		});
	});

	grid.on("click", ".prome-btn-delete", async function () {
		const folder = selectedFolder();
		const label = cardLabel(this);
		const sprite = selectedSprite(this);
		if (!folder || !sprite) return;
		const filename = getSpriteFilename(sprite);
		const stem = getSpriteStem(sprite);
		const target = sharesSpriteStem(sprite)
			? `all sprites named "${stem}"`
			: `"${filename}"`;
		const result = await callGenericPopup(
			$("<p>").text(`Delete ${target} from "${folder}"?`),
			POPUP_TYPE.CONFIRM,
			"",
			{ okButton: "Delete", cancelButton: "Cancel" },
		);
		if (isClosed || result !== POPUP_RESULT.AFFIRMATIVE) return;
		if (await deleteSprite(folder, label, stem)) {
			toastr.success(`Deleted ${target}.`);
			refreshAfterEdit(folder);
		} else {
			toastr.error(`Failed to delete sprite "${filename}".`);
		}
	});

	grid.on("click", ".prome-btn-upload, .prome-btn-add-variant", function () {
		const folder = selectedFolder();
		if (!folder || uploadInProgress) return;
		const label = cardLabel(this);
		const sprite = selectedSprite(this);
		const addingVariant = this.classList.contains("prome-btn-add-variant");
		const stem = addingVariant
			? nextVariantStem(label, sprites)
			: sprite
				? getSpriteStem(sprite)
				: label;
		pendingUpload = {
			folder,
			label,
			stem,
			sharedStem: !addingVariant && sprite && sharesSpriteStem(sprite),
		};
		fileInput[0].click();
	});

	fileInput.on("change", async function () {
		const file = this.files?.[0];
		const upload = pendingUpload;
		pendingUpload = null;
		this.value = "";
		if (!file || !upload || uploadInProgress) return;

		uploadInProgress = true;
		try {
			if (upload.sharedStem) {
				const result = await callGenericPopup(
					$("<p>").text(
						`Replace all sprites named "${upload.stem}" in "${upload.folder}" with this image?`,
					),
					POPUP_TYPE.CONFIRM,
					"",
					{ okButton: "Replace", cancelButton: "Cancel" },
				);
				if (isClosed || result !== POPUP_RESULT.AFFIRMATIVE) return;
			}
			if (await uploadSprite(upload.folder, upload.label, file, upload.stem)) {
				const filename = upload.stem + (file.name.match(/\.[^.]+$/)?.[0] ?? "");
				toastr.success(`Uploaded "${filename}".`);
				if (upload.folder === selectedFolder())
					selectedFilenames.set(upload.label, filename);
				refreshAfterEdit(upload.folder);
			} else {
				toastr.error(`Failed to upload sprite "${upload.stem}".`);
			}
		} finally {
			uploadInProgress = false;
		}
	});

	let zipFolder;
	zipBtn.on("click", () => {
		if (uploadInProgress) return;
		zipFolder = selectedFolder();
		if (zipFolder) zipInput[0].click();
	});
	zipInput.on("change", async function () {
		const file = this.files?.[0];
		const folder = zipFolder;
		this.value = "";
		if (!file || !folder || uploadInProgress) return;

		uploadInProgress = true;
		const toast = toastr.info("Uploading sprite pack...", "Please wait", {
			timeOut: 0,
			extendedTimeOut: 0,
		});
		try {
			const result = await uploadSpritePack(folder, file);
			if (result?.ok) {
				toastr.success(`Uploaded ${result.count ?? ""} sprites for ${folder}!`);
				refreshAfterEdit(folder);
			} else {
				toastr.error("Failed to upload sprite pack.");
			}
		} finally {
			uploadInProgress = false;
			toastr.clear(toast);
		}
	});

	return () => {
		isClosed = true;
		promeBus.removeEventListener(PROME_SPEAKER_CHANGED, onSpeakerChanged);
		promeBus.removeEventListener(PROME_SPRITE_FOLDER_CHANGED, onFolderChanged);
	};
}
