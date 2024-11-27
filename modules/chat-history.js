import {
	getContext,
	renderExtensionTemplateAsync,
} from "../../../../extensions.js";
import { timestampToMoment } from "../../../../utils.js";
import { getUserAvatar, user_avatar } from "../../../../personas.js";
import {
	system_avatar,
	default_avatar,
	getThumbnailUrl,
	messageFormatting,
	appendMediaToMessage,
	addCopyToCodeBlocks,
} from "../../../../../script.js";
import { extensionName } from "../constants.js";
import { POPUP_TYPE, callGenericPopup } from "../../../../popup.js";
import { isGroupChat } from "../utils.js";

function getChatAvatar(mes) {
	const context = getContext();
	const this_chid = context.characterId;
	let avatarImg = getUserAvatar(user_avatar);

	if (!mes.is_user) {
		if (mes.force_avatar) {
			avatarImg = mes.force_avatar;
		} else if (this_chid === undefined) {
			avatarImg = system_avatar;
		} else {
			if (context.characters[this_chid].avatar !== "none") {
				avatarImg = getThumbnailUrl(
					"avatar",
					context.characters[this_chid].avatar,
				);
			} else {
				avatarImg = default_avatar;
			}
		}
	} else if (mes.is_user && mes.force_avatar) {
		avatarImg = mes.force_avatar;
	}

	return avatarImg;
}

export async function getChatHistory() {
	async function renderChatHistory() {
		// get the chat history render
		const promeChatHistoryItemList = template.find(".promeChatHistoryList");
		promeChatHistoryItemList.empty();
		let chatHistory = context.chat;
		// skip first message in chat if it's a group chat
		if (isGroupChat()) {
			chatHistory = chatHistory.splice(1);
		}

		for (const mes of chatHistory) {
			let messageText = mes.mes;

			// setup the chat history item
			const promeChatHistoryItemTemplate = template
				.find(".promeChatHistoryItemTemplate .promeChatHistoryItem")
				.clone();
			promeChatHistoryItemTemplate
				.find(".promeChatHistoryItemSenderAvatar")
				.attr("src", getChatAvatar(mes));
			promeChatHistoryItemTemplate
				.find(".promeChatHistoryItemSenderName")
				.text(mes.name);

			const momentDate = timestampToMoment(mes.send_date);
			const timestamp = momentDate.isValid() ? momentDate.format("LL LT") : "";
			promeChatHistoryItemTemplate
				.find(".promeChatHistoryItemSenderTimestamp")
				.text(timestamp);

			messageText = messageFormatting(
				messageText,
				mes.name,
				mes.is_system,
				mes.is_user,
				context.chat.indexOf(mes),
			);
			promeChatHistoryItemTemplate
				.find(".promeChatHistoryItemSenderText")
				.append(messageText);

			appendMediaToMessage(mes, promeChatHistoryItemTemplate);
			addCopyToCodeBlocks(promeChatHistoryItemTemplate);

			// append the chat history item to the chat history list
			promeChatHistoryItemList.append(promeChatHistoryItemTemplate);
		}
	}

	const context = getContext();
	const template = $(
		await renderExtensionTemplateAsync(
			`third-party/${extensionName}/html`,
			"chat_history",
		),
	);
	await renderChatHistory();
	await callGenericPopup(template, POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		okButton: "Close",
		allowVerticalScrolling: true,
	});
}
