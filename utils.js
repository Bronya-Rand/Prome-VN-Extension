import { getContext, extension_settings } from "../../../extensions.js";
import { extensionName, VN_MODES } from "./constants.js";

export function getLastChatMessage() {
  const context = getContext();
  const reversedChat = context.chat.slice().reverse();

  return reversedChat.filter((mes) => !mes.is_system && !mes.extra?.image);
}

export function getChatId() {
  const context = getContext();
  return context.getCurrentChatId();
}

export function isLetterboxModeEnabled() {
  return Boolean(
    extension_settings[extensionName].letterboxMode !== VN_MODES.NONE
  );
}

export function isSheldVisible() {
  return Boolean(!extension_settings[extensionName].hideSheld);
}
