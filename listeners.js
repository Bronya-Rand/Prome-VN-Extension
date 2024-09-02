import { getContext } from "../../../extensions.js";
import { getLastChatMessage } from "./utils.js";

export async function applyZoom() {
  // grab the current chat/group chat
  const context = getContext();
  const group = context.groups.find((x) => x.id === context.groupId);
  if (!group) return;

  const filteredMembers = group.members.filter(
    (x) => !group.disabled_members.includes(x)
  );
  if (filteredMembers.length <= 1) return;

  const lastMessagesWithoutSystem = getLastChatMessage();
  // if there are no messages, remove the focus class
  if (lastMessagesWithoutSystem.length === 0) {
    $("#visual-novel-wrapper .prome-sprite-focus").removeClass(
      "prome-sprite-focus"
    );
    return;
  }

  const lastMessage = lastMessagesWithoutSystem[0];
  // if the last message is a user message, remove the focus class
  if (lastMessage.is_user) {
    $("#visual-novel-wrapper .prome-sprite-focus").removeClass(
      "prome-sprite-focus"
    );
    return;
  }

  const spriteDiv = `#visual-novel-wrapper [id='expression-${lastMessage.name}.png']`;
  let sprite = $(spriteDiv);

  // apply focus class to the sprite
  const applyFocusClass = () => {
    sprite.addClass("prome-sprite-focus");
    $("#visual-novel-wrapper .prome-sprite-focus")
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
