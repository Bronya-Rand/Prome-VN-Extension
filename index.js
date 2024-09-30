/* ST Core Imports */
import {
  extension_settings,
  renderExtensionTemplateAsync,
} from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { power_user } from "../../../power-user.js";
import { POPUP_TYPE, callGenericPopup } from "../../../popup.js";

/* Prome Core Imports */
import {
  extensionName,
  extensionFolderPath,
  defaultSettings,
} from "./constants.js";
import { applyZoomDebounce, applyDefocusDebounce, emulateSpritesDebounce } from "./listeners.js";

/* Prome Feature Imports */
import { prepareSlashCommands } from "./modules/slash-commands.js";
import {
  applyLetterboxMode,
  applyLetterboxColor,
  applyLetterboxSize,
  onLetterbox_Select,
  onLetterboxColor_Change,
  onLetterboxSize_Change,
  resetLetterBoxSize,
  resetLetterBoxColor,
} from "./modules/letterbox.js";
import {
  applySheldMode,
  applySheldVisibility,
  onSheld_Click,
  onSheldMode_Click,
} from "./modules/sheld.js";
import { isSheldVisible } from "./utils.js";
import {
  applySpriteZoomTimer,
  applySpriteZoomAnimation,
  applySpriteZoom,
  onSpriteZoom_Click,
  onSpriteZoomTimer_Change,
  resetSpriteZoomTimer,
  onSpriteZoomAnimation_Select,
  applySpriteDefocusTint,
  onSpriteDefocusTint_Click,
} from "./modules/focus.js";
import { getChatHistory } from "./modules/chat-history.js";
import { applySpriteEmulation, onSpriteEmulation_Click } from "./modules/emulate.js";

async function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
    if (power_user.waifuMode) {
      extension_settings[extensionName].enableVN_UI = power_user.waifuMode;
    }
  }

  // Check if new settings are added to extension_settings
  for (const key in defaultSettings) {
    if (extension_settings[extensionName][key] === undefined) {
      console.debug(`[${extensionName}] New setting added: ${key}`);
      extension_settings[extensionName][key] = defaultSettings[key];
    }
  }

  // Prome Updates
  $("#prome-enable-vn")
    .prop(
      "checked",
      extension_settings[extensionName].enableVN_UI || power_user.waifuMode
    )
    .trigger("input");
  $("#prome-letterbox-mode")
    .val(extension_settings[extensionName].letterboxMode)
    .trigger("change");
  $("#prome-letterbox-color-picker").attr(
    "color",
    extension_settings[extensionName].letterboxColor
  );
  $("#prome-letterbox-size")
    .val(extension_settings[extensionName].letterboxSize)
    .trigger("input");
  $("#prome-letterbox-size-counter").val(
    extension_settings[extensionName].letterboxSize
  );

  $("#prome-hide-sheld")
    .prop("checked", extension_settings[extensionName].hideSheld)
    .trigger("input");

  $("#prome-sprite-zoom")
    .prop("checked", extension_settings[extensionName].spriteZoom)
    .trigger("input");
  $("#prome-sprite-zoom-speed")
    .val(extension_settings[extensionName].zoomSpeed)
    .trigger("input");
  $("#prome-sprite-zoom-speed-counter").val(
    extension_settings[extensionName].zoomSpeed
  );
  $("#prome-sprite-zoom-animation")
    .val(extension_settings[extensionName].zoomAnimation)
    .trigger("change");
  $("#prome-sprite-defocus-tint")
    .prop("checked", extension_settings[extensionName].spriteDefocusTint)
    .trigger("input");

  $("#prome-emulate-sprites")
    .prop(
      "checked",
      extension_settings[extensionName].emulateSprites
    )

  $("#prome-sheld-last_mes").prop(
    "checked",
    extension_settings[extensionName].showOnlyLastMessage
  );

  // ST Main Updates
  $("#waifuMode")
    .prop("checked", extension_settings[extensionName].enableVN_UI)
    .trigger("input");

  // Apply Letterbox Settings (if enabled)
  applyLetterboxMode();
  applyLetterboxColor();
  applyLetterboxSize();

  // Apply Sheld Settings
  applySheldVisibility();
  applySheldMode();

  // Apply Sprite Emulation 
  applySpriteEmulation();

  // Apply Sprite Zoom
  applySpriteZoomTimer();
  applySpriteZoomAnimation();
  applySpriteZoom();
  // Apply Sprite Defocus Tint
  applySpriteDefocusTint();
}

/* Prome Core Listeners */
function onVNUI_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].enableVN_UI = value;
  power_user.waifuMode = value;
  saveSettingsDebounced();

  // Hijack ST Main's Waifu Mode
  $("body").toggleClass("waifuMode", power_user.waifuMode);
  $("#waifuMode").prop("checked", power_user.waifuMode);
}

async function onKeybindListClick() {
  const template = await renderExtensionTemplateAsync(
    `third-party/${extensionName}/html`,
    "keybinds"
  );
  await callGenericPopup(template, POPUP_TYPE.TEXT, "", {});
}

async function onChatHistoryClick() {
  getChatHistory();
}

jQuery(async () => {
  function addLetterbox() {
    const letterboxHtml = `
      <div id="visual-novel-letterbox-one"></div>
      <div id="visual-novel-letterbox-two"></div>
    `;

    $("body").append(letterboxHtml);
  }

  const settingsHtml = await $.get(`${extensionFolderPath}/html/settings.html`);
  $("#extensions_settings").append(settingsHtml);

  /* Prome Core Actions */
  $("#prome-enable-vn").on("click", onVNUI_Click);
  $("#prome-keybinds").on("click", onKeybindListClick);

  const wandButtonHtml = await renderExtensionTemplateAsync(
    `third-party/${extensionName}/html`,
    "wand_buttons"
  );
  $("#extensionsMenu").append(wandButtonHtml);
  $("#prome-wand-chat-history").on("click", onChatHistoryClick);

  /* Prome Feature Actions */
  // Letterbox
  $("#prome-letterbox-mode").on("change", onLetterbox_Select);
  $("#prome-letterbox-color-picker").on("change", onLetterboxColor_Change);
  $("#prome-letterbox-size").on("input", onLetterboxSize_Change);
  $("#prome-letterbox-size-counter").on("input", onLetterboxSize_Change);
  $("#prome-letterbox-size-restore").on("click", resetLetterBoxSize);
  $("#prome-letterbox-color-restore").on("click", resetLetterBoxColor);

  // Sheld
  $("#prome-hide-sheld").on("click", onSheld_Click);
  $("#prome-sheld-last_mes").on("click", onSheldMode_Click);

  // Sprite Emulation
  $("#prome-emulate-sprites").on("click", onSpriteEmulation_Click);

  // Focus
  $("#prome-sprite-zoom").on("click", onSpriteZoom_Click);
  $("#prome-sprite-zoom-speed").on("input", onSpriteZoomTimer_Change);
  $("#prome-sprite-zoom-speed-counter").on("input", onSpriteZoomTimer_Change);
  $("#prome-sprite-zoom-speed-restore").on("click", resetSpriteZoomTimer);
  $("#prome-sprite-zoom-animation").on("change", onSpriteZoomAnimation_Select);
  // Sprite Defocus Tint
  $("#prome-sprite-defocus-tint").on("click", onSpriteDefocusTint_Click);

  /* Prome Feature Initialization */
  addLetterbox();
  loadSettings();
  prepareSlashCommands();

  // Show info message if Sheld is hidden
  if (!isSheldVisible()) {
    toastr.info(
      "Head to Extensions > Prome (Visual Novel Extension) and uncheck 'Hide Sheld (Message Box)' to show it again.",
      "Sheld is currently hidden by the Prome VN Extension."
    );
  }
});

$(document).ready(function () {
  /* Mutation Observer for Chat and VN Wrapper */
  /* Listen for changes in the chat and image expressions */
  const promeChatObserver = new MutationObserver((mutations) => {
    let shouldApplyDebounce = false;

    mutations.forEach((mutation) => {
      if (mutation.type !== "childList") return;

      mutation.addedNodes.forEach((node) => {
        if (
          node.classList &&
          (node.classList.contains("mes") ||
            (node.tagName === "DIV" && node.classList.contains("expression-holder")))
        ) {
          shouldApplyDebounce = true;
        }
      });

      if (!shouldApplyDebounce) {
        mutation.removedNodes.forEach((node) => {
          if (
            node.classList &&
            (node.classList.contains("mes") ||
              (node.tagName === "DIV" && node.classList.contains("expression-holder")))
          ) {
            shouldApplyDebounce = true;
          }
        });
      }
    });

    emulateSpritesDebounce();

    if (shouldApplyDebounce) {
      applyDefocusDebounce();
      applyZoomDebounce();
    }

    // Apply Sheld Mode on new messages
    applySheldMode();
  });

  const chatDiv = document.getElementById("chat");
  promeChatObserver.observe(chatDiv, { childList: true });

  /* Mutation Observer for VN Sprites */
  /* Removes the VN Sprite's 'hidden' toggle for 'prome-render-sprite' */
  const promeSpriteObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const spriteDiv = mutation.target;
        if (spriteDiv.classList.contains('hidden')) {
          spriteDiv.classList.remove('hidden');
        }
      }
    }
  });

  // Since the VN Wrapper is loaded by ST, we need to wait for it to load
  const vnWrapperInterval = setInterval(() => {
    const vnWrapperDiv = document.getElementById("visual-novel-wrapper");
    if (vnWrapperDiv) {
      promeChatObserver.observe(vnWrapperDiv, { childList: true, subtree: true });
      promeSpriteObserver.observe(vnWrapperDiv, { attributes: true, subtree: true });
      clearInterval(vnWrapperInterval);
    }
  }, 100);
});

/* Keybinds */
// Hide Sheld via Ctrl+F1
$(document).keydown(function (event) {
  if (event.which === 112 && event.ctrlKey) {
    event.preventDefault();
    $("#prome-hide-sheld").click();
  }
});
