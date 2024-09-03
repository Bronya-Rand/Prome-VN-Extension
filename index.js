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
import { applyZoomDebounce, applyDefocusDebounce } from "./listeners.js";

/* Prome Feature Imports */
import { prepareSlashCommands } from "./slash-commands.js";
import {
  applyLetterboxMode,
  applyLetterboxColor,
  applyLetterboxSize,
  onLetterbox_Select,
  onLetterboxColor_Change,
  onLetterboxSize_Change,
  resetLetterBoxSize,
  resetLetterBoxColor,
} from "./letterbox.js";
import { applySheldVisibility, onSheld_Click } from "./sheld.js";
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
} from "./focus.js";

async function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
    if (power_user.waifuMode) {
      extension_settings[extensionName].enableVN_UI = power_user.waifuMode;
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

  // ST Main Updates
  $("#waifuMode")
    .prop("checked", extension_settings[extensionName].enableVN_UI)
    .trigger("input");

  // Apply Letterbox Settings (if enabled)
  applyLetterboxMode();
  applyLetterboxColor();
  applyLetterboxSize();

  // Apply Sheld Visibility
  applySheldVisibility();

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
    `third-party/${extensionName}`,
    "keybinds"
  );
  await callGenericPopup(template, POPUP_TYPE.TEXT, "", {});
}

jQuery(async () => {
  function addLetterbox() {
    const letterboxHtml = `
      <div id="visual-novel-letterbox-one"></div>
      <div id="visual-novel-letterbox-two"></div>
    `;

    $("body").append(letterboxHtml);
  }

  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
  $("#extensions_settings").append(settingsHtml);

  /* Prome Core Actions */
  $("#prome-enable-vn").on("click", onVNUI_Click);
  $("#prome-keybinds").on("click", onKeybindListClick);

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
  const promeObserver = new MutationObserver((mutations) => {
    let shouldApplyDebounce = false;

    mutations.forEach((mutation) => {
      if (mutation.type !== "childList") return;

      mutation.addedNodes.forEach((node) => {
        if (
          node.classList &&
          (node.classList.contains("mes") ||
          (node.tagName === "IMG" && node.classList.contains("expression")))
        ) {
          shouldApplyDebounce = true;
        }
      });

      if (!shouldApplyDebounce) {
        mutation.removedNodes.forEach((node) => {
          if (
            node.classList &&
            (node.classList.contains("mes") ||
            (node.tagName === "IMG" && node.classList.contains("expression")))
          ) {
            shouldApplyDebounce = true;
          }
        });
      }
    });

    if (shouldApplyDebounce) {
      applyDefocusDebounce();
      applyZoomDebounce();
    }
  });

  const chatDiv = document.getElementById("chat");
  promeObserver.observe(chatDiv, { childList: true });

  // Since the VN Wrapper is loaded by ST, we need to wait for it to load
  const vnWrapperInterval = setInterval(() => {
    const vnWrapperDiv = document.getElementById("visual-novel-wrapper");
    if (vnWrapperDiv) {
      promeObserver.observe(vnWrapperDiv, { childList: true, subtree: true });
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
