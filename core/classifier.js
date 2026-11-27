import {
	extractMessageFromData,
	getGenerateUrl,
	getRequestHeaders,
} from "../../../../../script.js";
import { getContext } from "../../../../extensions.js";
import {
	getKoboldGenerationData,
	kai_flags,
	kai_settings,
} from "../../../../kai-settings.js";
import {
	createGenerationParameters,
	getChatCompletionModel,
	oai_settings,
} from "../../../../openai.js";
import { power_user } from "../../../../power-user.js";
import { parseReasoningFromString } from "../../../../reasoning.js";
import {
	createTextGenGenerationData,
	textgenerationwebui_settings,
} from "../../../../textgen-settings.js";
import {
	ConnectionManagerRequestService,
	generateWebLlmChatPrompt,
} from "../../../shared.js";
import {
	CLASSIFIER_MODES,
	DEFAULT_CLASSIFIER_PROMPT,
	DEFAULT_EXPRESSIONS,
	extensionName,
} from "../constants.js";
import { sampleLocalClassificationText } from "./classification-text.js";

const MAX_RESPONSE_TOKENS = 96;

export async function classifyExpression(text, spriteLabels, settings) {
	if (!text?.trim()) return null;
	const mode = settings.classifierMode;
	if (mode === CLASSIFIER_MODES.NONE) return null;
	const removedLabels = settings.removedCustomExpressions ?? [];
	const packLabels = spriteLabels.filter(
		(label) =>
			typeof label === "string" &&
			label.trim() &&
			!removedLabels.includes(label.trim().toLowerCase()),
	);
	const filterAvailable = settings.filterAvailableExpressions;
	const localLabels = filterAvailable ? packLabels : null;
	const runLocal = () => {
		const input = settings.sampleLocalMessages
			? sampleLocalClassificationText(text)
			: text;
		return classifyLocal(input || text, localLabels, removedLabels);
	};
	const webLlm = mode === CLASSIFIER_MODES.WEBLLM;
	if (
		!webLlm &&
		mode !== CLASSIFIER_MODES.RAW &&
		mode !== CLASSIFIER_MODES.STRUCTURED
	) {
		return runLocal();
	}

	const labels = [
		...new Set(
			filterAvailable
				? packLabels
				: [
						...packLabels,
						...DEFAULT_EXPRESSIONS,
						...(settings.customExpressions ?? []),
					],
		),
	];
	if (!labels.length) return null;
	const structured = mode === CLASSIFIER_MODES.STRUCTURED;
	const promptValues = {
		labels: JSON.stringify(labels),
		outputFormat: structured
			? 'Return only a JSON object with an "emotion" field containing that label.'
			: "Return only the label.",
	};
	const prompt = (
		settings.classifierPrompt || DEFAULT_CLASSIFIER_PROMPT
	).replace(/\{\{(labels|outputFormat)\}\}/g, (_, name) => promptValues[name]);
	try {
		const content = webLlm
			? await generateWebLlmChatPrompt(
					[{ role: "user", content: `${prompt}\n\nExcerpt:\n${text}` }],
					{ max_tokens: MAX_RESPONSE_TOKENS, temperature: 0 },
				)
			: await requestClassification(
					[
						{ role: "system", content: prompt },
						{ role: "user", content: text },
					],
					labels,
					structured,
					settings.classifierProfile,
				);
		const label = parseLabel(content, labels, structured);
		if (label) return label;
		console.warn(
			`[${extensionName}] Classifier returned no matching expression. Using Local.`,
		);
	} catch (error) {
		const backend = webLlm ? "WebLLM" : "Main API";
		console.warn(
			`[${extensionName}] ${backend} classification failed. Using Local.`,
			error,
		);
	}
	return runLocal();
}

function getOutputConstraint(api, textType, labels, structured) {
	if (!structured) return {};
	const schema = {
		type: "object",
		properties: { emotion: { type: "string", enum: labels } },
		required: ["emotion"],
		additionalProperties: false,
	};
	if (api === "openai")
		return { json_schema: { name: "prome_expression", value: schema } };
	if (
		api === "textgenerationwebui" &&
		["tabby", "llamacpp"].includes(textType)
	) {
		return { json_schema: schema };
	}
	if (
		(api === "textgenerationwebui" && textType === "koboldcpp") ||
		(api === "kobold" && kai_flags.can_use_grammar)
	) {
		const choices = labels.map((emotion) =>
			JSON.stringify(JSON.stringify({ emotion })),
		);
		return { grammar: `root ::= ${choices.join(" | ")}` };
	}
	throw new Error(
		"Structured classification is unavailable for this connection.",
	);
}

async function requestClassification(messages, labels, structured, profileId) {
	const context = getContext();
	if (profileId) {
		const profile = ConnectionManagerRequestService.getProfile(profileId);
		const { selected: api, type } =
			ConnectionManagerRequestService.validateProfile(profile);
		const constraint = getOutputConstraint(api, type, labels, structured);
		const response = await ConnectionManagerRequestService.sendRequest(
			profileId,
			messages,
			MAX_RESPONSE_TOKENS,
			{ stream: false, includePreset: false },
			{ include_reasoning: false, ...constraint },
		);
		return response.content;
	}

	const api = context.mainApi;
	const constraint = getOutputConstraint(
		api,
		textgenerationwebui_settings.type,
		labels,
		structured,
	);
	if (api === "openai") {
		const settings = {
			...oai_settings,
			openai_max_tokens: MAX_RESPONSE_TOKENS,
			show_thoughts: false,
			reasoning_effort: "min",
			bias_preset_selected: "",
			enable_web_search: false,
			request_images: false,
		};
		const { generate_data: payload } = await createGenerationParameters(
			settings,
			getChatCompletionModel(settings),
			"quiet",
			messages,
			{ jsonSchema: constraint.json_schema },
		);
		delete payload.stop;
		delete payload.tools;
		delete payload.tool_choice;
		const response = await context.ChatCompletionService.sendRequest(payload);
		return response.content;
	}

	const prompt = power_user.instruct.enabled
		? context.TextCompletionService.constructPrompt(
				messages,
				power_user.instruct,
			)
		: messages.map((message) => message.content).join("\n\n");
	if (api === "textgenerationwebui") {
		const settings = {
			...textgenerationwebui_settings,
			json_schema: null,
			grammar_string: "",
			include_reasoning: false,
			min_length: 0,
			ban_eos_token: false,
		};
		const payload = createTextGenGenerationData(
			settings,
			null,
			prompt,
			MAX_RESPONSE_TOKENS,
		);
		const response = await context.TextCompletionService.processRequest({
			...payload,
			stream: false,
			stop: [],
			stopping_strings: [],
			custom_token_bans: undefined,
			banned_strings: undefined,
			...constraint,
		});
		return response.content;
	}
	if (api === "kobold") {
		const payload = getKoboldGenerationData(
			prompt,
			kai_settings,
			MAX_RESPONSE_TOKENS,
			context.maxContext,
			false,
			"quiet",
		);
		const response = await fetch(getGenerateUrl(api), {
			method: "POST",
			headers: getRequestHeaders(),
			body: JSON.stringify({
				...payload,
				grammar: undefined,
				stop_sequence: [],
				...constraint,
			}),
		});
		if (!response.ok)
			throw new Error(`Kobold classification failed (${response.status}).`);
		return extractMessageFromData(await response.json(), api);
	}
	throw new Error(
		"Main API classification is unavailable for this connection.",
	);
}

function parseLabel(content, labels, structured) {
	let value = content;
	if (typeof content === "string") {
		const answer = (parseReasoningFromString(content)?.content ?? content)
			.replace(/^[\s\S]*?<\/think>\s*/i, "")
			.trim()
			.replace(/^```(?:json|text)?\s*([\s\S]*?)\s*```$/i, "$1")
			.trim();
		if (structured || answer.startsWith('"')) {
			try {
				value = JSON.parse(answer);
			} catch {
				return null;
			}
		} else {
			value = answer.replace(/^`([^`]+)`$/, "$1");
		}
	}
	const candidate = structured ? value?.emotion : value;
	return matchLabel(candidate, labels);
}

function matchLabel(candidate, labels) {
	if (typeof candidate !== "string") return null;
	const normalized = candidate.trim().toLowerCase();
	return (
		labels.find((label) => label.trim().toLowerCase() === normalized) ?? null
	);
}

export async function classifyLocal(
	text,
	availableLabels = null,
	removedLabels = [],
) {
	try {
		const response = await fetch("/api/extra/classify", {
			method: "POST",
			headers: getRequestHeaders(),
			body: JSON.stringify({ text }),
		});

		if (response.ok) {
			const data = await response.json();
			for (const { label } of data.classification ?? []) {
				if (
					typeof label !== "string" ||
					removedLabels.includes(label.trim().toLowerCase())
				) {
					continue;
				}
				if (!availableLabels) return label;
				const match = matchLabel(label, availableLabels);
				if (match) return match;
			}
		}

		return null;
	} catch (error) {
		toastr.error(
			"Could not classify expression. Check the console or your backend for more information.",
		);
		console.error(error);
		return null;
	}
}
