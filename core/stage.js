let stage = null;
let previousSpeakerId = null;
let currentSpeakerId = null;
let shakingActorId = null;
const pendingSprites = new WeakMap();
let resizeTimeout = null;

function onStageResize() {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(updateStageOverlap, 100);
}

async function updateSprite(slot, image, spriteUrl) {
	const currentUrl = image.getAttribute("src");
	if (!spriteUrl || currentUrl === spriteUrl) {
		pendingSprites.delete(slot);
		slot.classList.add("prome-actor-ready");
		return;
	}
	if (!currentUrl) {
		image.src = spriteUrl;
		try {
			await image.decode();
		} catch {
			// Fallback if decode fails
		}
		if (!slot.isConnected) return;
		slot.classList.add("prome-actor-ready");
		updateStageOverlap();
		return;
	}
	if (pendingSprites.get(slot)?.getAttribute("src") === spriteUrl) return;

	const nextImage = image.cloneNode(false);
	nextImage.src = spriteUrl;
	pendingSprites.set(slot, nextImage);
	try {
		await nextImage.decode();
	} catch {
		if (pendingSprites.get(slot) === nextImage) pendingSprites.delete(slot);
		return;
	}
	if (pendingSprites.get(slot) !== nextImage) return;
	pendingSprites.delete(slot);
	if (!slot.isConnected) return;

	const wrapper = image.parentElement;
	wrapper.querySelector(".prome-sprite-outgoing")?.remove();
	const width = image.offsetWidth;
	const height = image.offsetHeight;
	nextImage.alt = image.alt;
	image.replaceWith(nextImage);
	slot.classList.add("prome-actor-ready");
	updateStageOverlap();

	if (
		!image.naturalWidth ||
		!width ||
		!height ||
		matchMedia("(prefers-reduced-motion: reduce)").matches
	)
		return;

	image.classList.add("prome-sprite-outgoing");
	image.setAttribute("aria-hidden", "true");
	image.style.width = `${width}px`;
	image.style.height = `${height}px`;
	wrapper.appendChild(image);

	const fade = { duration: 200, easing: "ease-in-out" };
	nextImage.animate([{ opacity: 0 }, { opacity: 1 }], fade);
	const outgoing = image.animate([{ opacity: 1 }, { opacity: 0 }], fade);
	const removeOutgoing = () => image.remove();
	void outgoing.finished.then(removeOutgoing, removeOutgoing);
}

/**
 * Mounts the Prome VN 'stage' to the specified parent element.
 * @param {*} parent The parent element to which the Prome stage will be appended.
 */
export function mountStage(parent) {
	if (stage) return; // Stage is already mounted

	// Create the Prome stage element
	stage = document.createElement("div");
	stage.id = "prome-stage";
	$(parent).append(stage);

	window.addEventListener("resize", onStageResize);
}

/**
 * Update the actor slots in the Prome VN 'stage' to reflect the current actors.
 * @param {Array<{id: string, name: string, expression: string, spriteUrl: string}>} actors The current actors to be rendered on the stage.
 */
export function renderActors(actors = []) {
	if (!stage) return; // Stage is not mounted

	const validActors = Array.isArray(actors)
		? actors.filter((actor) => Boolean(actor?.id))
		: [];
	const incomingIds = new Set(validActors.map((actor) => actor.id));

	// Remove any actor slots that are no longer present
	const existingSlots = stage.querySelectorAll(".prome-actor-slot");
	existingSlots.forEach((slot) => {
		if (!incomingIds.has(slot.dataset.actorId)) {
			slot.remove();
		}
	});

	// Add or update actors
	for (const actor of validActors) {
		// Find existing actor slot
		let slot = stage.querySelector(
			`.prome-actor-slot[data-actor-id="${CSS.escape(actor.id)}"]`,
		);
		let img;

		if (!slot) {
			// Add new actor slot
			slot = document.createElement("div");
			slot.className = "prome-actor-slot";
			slot.dataset.actorId = actor.id;

			// Add image wrapper
			const wrapper = document.createElement("div");
			wrapper.className = "prome-actor-motion";

			// Add sprite image element
			img = document.createElement("img");
			img.className = "prome-actor-sprite";

			slot.appendChild(wrapper);
			wrapper.appendChild(img);
			stage.appendChild(slot);
		} else {
			// Re-use existing actor slot
			img = slot.querySelector(
				".prome-actor-sprite:not(.prome-sprite-outgoing)",
			);
		}

		// Update actor sprite and attributes
		if (actor.name) {
			slot.dataset.actorName = actor.name;
			img.alt = actor.name;
		}

		// Track expression on the slot
		if (actor.expression) {
			slot.dataset.actorExpression = actor.expression;
		}

		void updateSprite(slot, img, actor.spriteUrl);

		if (!actor.spriteUrl) {
			slot.classList.add("prome-actor-ready");
		}

		// Ensure DOM order matches actors array order
		stage.appendChild(slot);
	}

	setShakingActor(shakingActorId);
	updateStageLayers();
}

export function updateStageLayers() {
	setFocusedActor(currentSpeakerId);
	updateStageOverlap();
}

/**
 * Calculates and applies horizontal overlap when total actor width exceeds stage width.
 */
export function updateStageOverlap() {
	if (!stage) return;
	const slots = [...stage.querySelectorAll(".prome-actor-slot")];
	if (slots.length <= 1) {
		stage.style.removeProperty("--prome-slot-overlap");
		return;
	}

	const stageWidth = stage.clientWidth;
	if (!stageWidth) return;

	// Use 90vh * 0.45 as standard VN sprite aspect ratio fallback
	const fallbackHeight = (stage.clientHeight || window.innerHeight) * 0.9;
	const fallbackWidth = fallbackHeight * 0.45;
	const totalWidth = slots.reduce((sum, slot) => {
		const img = slot.querySelector(
			".prome-actor-sprite:not(.prome-sprite-outgoing)",
		);
		let w = 0;
		if (img?.complete && img?.naturalWidth > 0 && img?.naturalHeight > 0) {
			w =
				img.offsetWidth ||
				fallbackHeight * (img.naturalWidth / img.naturalHeight);
		}
		if (!w) {
			w = slot.offsetWidth > 100 ? slot.offsetWidth : fallbackWidth;
		}
		return sum + w;
	}, 0);

	if (totalWidth > stageWidth) {
		const overflow = totalWidth - stageWidth;
		const overlapPerSlot = Math.ceil(overflow / (slots.length - 1));
		stage.style.setProperty("--prome-slot-overlap", `${overlapPerSlot}px`);
	} else {
		stage.style.removeProperty("--prome-slot-overlap");
	}
}

export function setFocusedActor(actorId) {
	if (actorId && actorId !== currentSpeakerId) {
		previousSpeakerId = currentSpeakerId;
		currentSpeakerId = actorId;
	} else if (!actorId) {
		previousSpeakerId = null;
		currentSpeakerId = null;
	}
	if (!stage) return; // Stage is not mounted

	const slots = [...stage.querySelectorAll(".prome-actor-slot")];
	const focusedSlot = slots.find(
		(slot) => slot.dataset.actorId === currentSpeakerId,
	);

	slots.forEach((slot, index) => {
		const id = slot.dataset.actorId;
		let zIndex = index + 1; // Base 1..N
		if (id === currentSpeakerId) {
			zIndex = 100;
		} else if (id === previousSpeakerId) {
			zIndex = 90;
		}
		slot.style.zIndex = zIndex;

		slot.classList.toggle("prome-sprite-focus", slot === focusedSlot);
		slot.classList.toggle(
			"prome-sprite-defocus",
			Boolean(focusedSlot) && slot !== focusedSlot,
		);
	});
}

export function setShakingActor(actorId) {
	shakingActorId = actorId;
	if (!stage) return; // Stage is not mounted

	const slots = [...stage.querySelectorAll(".prome-actor-slot")];
	const shakingSlot = slots.find((slot) => slot.dataset.actorId === actorId);

	for (const slot of slots) {
		slot.classList.toggle("prome-sprite-shake", slot === shakingSlot);
	}
}

/**
 * Unmounts the Prome VN 'stage'.
 */
export function unmountStage() {
	if (!stage) return; // Stage is not mounted

	window.removeEventListener("resize", onStageResize);
	clearTimeout(resizeTimeout);
	previousSpeakerId = null;
	currentSpeakerId = null;
	shakingActorId = null;

	// Remove the Prome stage element from the DOM
	stage.remove();
	stage = null;
}
