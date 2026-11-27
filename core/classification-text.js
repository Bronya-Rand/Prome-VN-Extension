const LOCAL_SAMPLE_LIMIT = 500;
const SAMPLE_SEPARATOR = "\n\n";

const sentenceSegmenter =
	typeof Intl.Segmenter === "function"
		? new Intl.Segmenter(undefined, { granularity: "sentence" })
		: null;

function clipExcerpt(text, limit, fromEnd = false) {
	const start = fromEnd ? text.length - limit : 0;
	const end = fromEnd ? text.length : limit;
	const excerpt = text.slice(start, end);
	let clipped = excerpt;

	if (fromEnd && /\S/u.test(text[start - 1])) {
		clipped = excerpt.replace(/^\S+\s+/u, "");
	} else if (!fromEnd && /\S/u.test(text[end])) {
		clipped = excerpt.replace(/\s+\S+$/u, "");
	}

	return (clipped || excerpt)
		.trim()
		.replace(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/g, "");
}

export function sampleLocalClassificationText(text) {
	const cleaned = text
		.replace(/(?<=\S)\*+|\*+(?=\S)/gu, "")
		.replace(/(?<![\p{L}\p{N}_])_+(?=\S)|(?<=\S)_+(?![\p{L}\p{N}_])/gu, "")
		.trim();
	if (cleaned.length <= LOCAL_SAMPLE_LIMIT) return cleaned;

	const budget = LOCAL_SAMPLE_LIMIT - SAMPLE_SEPARATOR.length;
	const sentences = sentenceSegmenter
		? [...sentenceSegmenter.segment(cleaned)]
		: [];
	const takeEnding = (limit) => {
		const start = sentences.find(
			({ index }) => cleaned.length - index <= limit,
		)?.index;
		return start === undefined
			? clipExcerpt(cleaned, limit, true)
			: cleaned.slice(start);
	};

	const ending = takeEnding(Math.floor(budget / 2));
	const headBudget = budget - ending.length;
	const lastOpeningSentence = sentences.findLast(
		({ index, segment }) => index + segment.trimEnd().length <= headBudget,
	);
	const beginning = lastOpeningSentence
		? cleaned
				.slice(
					0,
					lastOpeningSentence.index + lastOpeningSentence.segment.length,
				)
				.trimEnd()
		: clipExcerpt(cleaned, headBudget);

	// Reuse any space left by the opening sentences to keep more of the ending.
	return beginning + SAMPLE_SEPARATOR + takeEnding(budget - beginning.length);
}
