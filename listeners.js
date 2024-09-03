import { debounce_timeout } from "../../../constants.js";
import { debounce } from "../../../utils.js";
import { getContext } from "../../../extensions.js";

import { getLastChatMessage } from "./utils.js";

/* Debouncers */
export const applyZoomDebounce = debounce(async () => {
  await applyZoom();
}, debounce_timeout.short);
export const applyDefocusDebounce = debounce(async () => {
  await applyDefocus();
}, debounce_timeout.short);

// Check if the current chat has more than one member
function zoomListenerPreconditions() {
  const context = getContext();
  const group = context.groups.find((x) => x.id === context.groupId);
  if (!group) return false;

  const filteredMembers = group.members.filter(
    (x) => !group.disabled_members.includes(x)
  );
  if (filteredMembers.length <= 1) return false;
  return true;
}

// Apply focus class to the sprite
async function applyZoom() {
  if (!zoomListenerPreconditions()) return;

  // grab the current chat/group chat
  const lastMessagesWithoutSystem = getLastChatMessage();
  // if there are no messages, remove the focus class
  if (lastMessagesWithoutSystem.length === 0) {
    $("#visual-novel-wrapper > div").removeClass("prome-sprite-focus");
    return;
  }

  const lastMessage = lastMessagesWithoutSystem[0];
  // if the last message is a user message, remove the focus class
  if (lastMessage.is_user) {
    $("#visual-novel-wrapper > div").removeClass("prome-sprite-focus");
    return;
  }

  const spriteDiv = `#visual-novel-wrapper [id='expression-${lastMessage.name}.png']`;
  let sprite = $(spriteDiv);

  // apply focus class to the sprite
  const applyFocusClass = () => {
    // apply focus class to the focused sprite
    sprite.addClass("prome-sprite-focus");

    // remove focus class from other sprites
    $("#visual-novel-wrapper > div")
      .not(sprite)
      .removeClass("prome-sprite-focus");
  };

  if (sprite.length === 0) {
    // give time for the sprite to load on the page
    const checkInterval = setInterval(() => {
      sprite = $(spriteDiv);
      if (sprite.length > 0) {
        applyFocusClass();
        clearInterval(checkInterval);
      }
    }, 100);
  } else {
    applyFocusClass();
  }
}

// Apply defocus class to the sprites
async function applyDefocus() {
  if (!zoomListenerPreconditions()) return;

  const lastMessagesWithoutSystem = getLastChatMessage();
  if (lastMessagesWithoutSystem.length === 0) {
    $("#visual-novel-wrapper > div").addClass("prome-sprite-defocus");
    return;
  }

  const lastMessage = lastMessagesWithoutSystem[0];
  if (lastMessage.is_user) {
    $("#visual-novel-wrapper > div").addClass("prome-sprite-defocus");
    return;
  }

  const focusedSpriteDiv = `#visual-novel-wrapper [id='expression-${lastMessage.name}.png']`;
  let focusedSprite = $(focusedSpriteDiv);

  const applyDefocusClass = () => {
    // remove defocus class from all sprites
    $("#visual-novel-wrapper > div").removeClass("prome-sprite-defocus");

    // apply defocus class to all sprites except the focused sprite
    $("#visual-novel-wrapper > div")
      .not(focusedSprite)
      .addClass("prome-sprite-defocus");
  };

  if (focusedSprite.length === 0) {
    const checkInterval = setInterval(() => {
      focusedSprite = $(focusedSpriteDiv);
      if (focusedSprite.length > 0) {
        applyDefocusClass();
        clearInterval(checkInterval);
      }
    }, 100);
  } else {
    applyDefocusClass();
  }
}
