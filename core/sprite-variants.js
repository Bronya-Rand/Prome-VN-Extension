function spritePathWithoutQuery(path) {
	return path.split("?")[0];
}

export function getSpriteFilename(sprite) {
	return spritePathWithoutQuery(sprite.path).split("/").at(-1);
}

export function getSpriteStem(sprite) {
	return getSpriteFilename(sprite).replace(/\.[^.]+$/, "");
}

export function chooseExpressionSprite(
	sprites,
	expression,
	previous,
	settings,
) {
	for (const label of [expression?.label, settings.fallbackExpression]) {
		const normalized = label?.trim().toLowerCase();
		if (!normalized || settings.removedCustomExpressions?.includes(normalized))
			continue;
		const variants = sprites.filter(
			(sprite) => sprite.label.toLowerCase() === normalized,
		);
		if (!variants.length) continue;

		if (expression?.spritePath) {
			const selectedPath = spritePathWithoutQuery(expression.spritePath);
			const selected = variants.find(
				(sprite) => spritePathWithoutQuery(sprite.path) === selectedPath,
			);
			if (selected) return selected;
		}

		if (!settings.allowMultipleSprites) {
			return (
				variants.find(
					(sprite) => getSpriteStem(sprite).toLowerCase() === normalized,
				) ?? variants.sort((a, b) => a.path.localeCompare(b.path))[0]
			);
		}

		const previousSprite = variants.find(
			(sprite) => sprite.path === previous?.spriteUrl,
		);
		if (
			previousSprite &&
			previous.allowMultipleSprites &&
			previous.expression === expression
		) {
			return previousSprite;
		}

		const choices =
			settings.rerollSameSprite && previousSprite && variants.length > 1
				? variants.filter((sprite) => sprite !== previousSprite)
				: variants;
		return choices[Math.floor(Math.random() * choices.length)];
	}
	return null;
}
