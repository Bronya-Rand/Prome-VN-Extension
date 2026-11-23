let stage = null;
let currentSpeakerId = null;
let shakingActorId = null;

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
			img = slot.querySelector(".prome-actor-sprite");
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

		// Only update `src` if it has changed to avoid unnecessary reloads
		if (actor.spriteUrl && img.getAttribute("src") !== actor.spriteUrl) {
			img.src = actor.spriteUrl;
		}

		// Ensure DOM order matches actors array order
		stage.appendChild(slot);
	}

	setFocusedActor(currentSpeakerId);
	setShakingActor(shakingActorId);
}

export function setFocusedActor(actorId) {
	currentSpeakerId = actorId;
	if (!stage) return; // Stage is not mounted

	const slots = [...stage.querySelectorAll(".prome-actor-slot")];
	const focusedSlot = slots.find((slot) => slot.dataset.actorId === actorId);

	for (const slot of slots) {
		slot.classList.toggle("prome-sprite-focus", slot === focusedSlot);
		slot.classList.toggle(
			"prome-sprite-defocus",
			Boolean(focusedSlot) && slot !== focusedSlot,
		);
	}
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

	// Remove the Prome stage element from the DOM
	stage.remove();
	stage = null;
}
