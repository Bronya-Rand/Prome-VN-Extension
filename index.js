import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced, system_message_types } from "../../../../script.js";
import { power_user } from "../../../power-user.js";
import { SlashCommand } from "../../../slash-commands/SlashCommand.js";
import { ARGUMENT_TYPE, SlashCommandNamedArgument } from '../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommandEnumValue, enumTypes } from '../../../slash-commands/SlashCommandEnumValue.js';


const extensionName = "Prome-VN-Extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
  enableVN_UI: false,
  letterboxMode: 0,
  letterboxColor: "rgba(0, 0, 0, 1)",
  letterboxSize: 8,
  hideSheld: false,
  spriteZoom: false,
  zoomSpeed: 0.6,
  zoomAnimation: "ease",
};

const VN_MODES = {
  NONE: 0,
  HORIZONTAL: 1,
  VERTICAL: 2,
};

async function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
    if (power_user.waifuMode) {
      extension_settings[extensionName].enableVN_UI = power_user.waifuMode;
    }
  }

  // Prome Updates
  $("#prome-enable-vn").prop("checked", extension_settings[extensionName].enableVN_UI).trigger("input");
  $("#prome-letterbox-mode").val(extension_settings[extensionName].letterboxMode).trigger("change");
  $("#prome-letterbox-color-picker").attr('color', extension_settings[extensionName].letterboxColor);
  $("#prome-letterbox-size").val(extension_settings[extensionName].letterboxSize).trigger("input");
  $("#prome-letterbox-size-counter").val(extension_settings[extensionName].letterboxSize);

  $("#prome-hide-sheld").prop("checked", extension_settings[extensionName].hideSheld).trigger("input");

  $("#prome-sprite-zoom").prop("checked", extension_settings[extensionName].spriteZoom).trigger("input");
  $("#prome-sprite-zoom-speed").val(extension_settings[extensionName].zoomSpeed).trigger("input");
  $("#prome-sprite-zoom-speed-counter").val(extension_settings[extensionName].zoomSpeed);
  $("#prome-sprite-zoom-animation").val(extension_settings[extensionName].zoomAnimation).trigger("change");

  // ST Main Updates
  $("#waifuMode").prop("checked", extension_settings[extensionName].enableVN_UI).trigger("input");

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
}

function prepareSlashCommands() {
  SlashCommandParser.addCommandObject(SlashCommand.fromProps({
      name: 'letterbox',
      /** @type {(args: { mode: string | undefined }) => void} */
      callback: async (args, _) => {
        if (args.mode === 'horizontal') {
          switchLetterboxMode(VN_MODES.HORIZONTAL);
        } else if (args.mode === 'vertical') {
          switchLetterboxMode(VN_MODES.VERTICAL);
        } else if (args.mode === 'off') {
          switchLetterboxMode(VN_MODES.NONE);
        }
        if (args.mode !== 'off') {
          toastr.success(`Letterbox mode is now set to ${args.mode} mode.`, "Letterbox Mode Status");
        } else {
          toastr.success(`Letterbox mode is now turned off.`, "Letterbox Mode Status");
        }
        return extension_settings[extensionName].letterboxMode;
      },
      namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
          name: 'mode',
          description: 'The mode to switch to.',
          isRequired: true,
          typeList: [ARGUMENT_TYPE.STRING],
          enumList: [
            new SlashCommandEnumValue("off", "Turn off letterbox mode.", enumTypes.namedArgument),
            new SlashCommandEnumValue("horizontal", "Enable horizontal letterboxes.", enumTypes.namedArgument),
            new SlashCommandEnumValue("vertical", "Enable vertical letterboxes.", enumTypes.namedArgument),
          ],
        }),
      ],
      helpString: 'Switches the letterbox mode in the Prome VN UI.',
  }));

  SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'focus-mode',
    callback: async () => {
      switchFocusMode(!extension_settings[extensionName].spriteZoom);
      toastr.success(`Focus Mode is now ${extension_settings[extensionName].spriteZoom ? 'enabled' : 'disabled'}.`, "Focus Mode Status");
      return extension_settings[extensionName].spriteZoom;
    },
    helpString: 'Toggles focus mode for the Prome VN UI.',
  }));

  SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: 'focus-mode-animation',
    /** @type {(args: { animation: string | undefined }) => void} */
    callback: async (args, _) => {
      if (args.animation === 'ease' || args.animation === 'ease-in' || args.animation === 'ease-out' || args.animation === 'ease-in-out' || args.animation === 'linear') {
        switchFocusModeAnimation(args.animation);
        toastr.success(`Now set to ${args.animation}.`, "Focus Mode Animation Set");
        return extension_settings[extensionName].zoomAnimation;
      } else {
        toastr.error('Please use "ease", "ease-in", "ease-out", "ease-in-out" or "linear".', "Invalid Animation");
        return null;
      }
    },
    namedArgumentList: [
      SlashCommandNamedArgument.fromProps({
        name: 'animation',
        description: 'The animation to use for sprite zoom.',
        isRequired: true,
        typeList: [ARGUMENT_TYPE.STRING],
        enumList: [
          new SlashCommandEnumValue("ease", "Ease animation.", enumTypes.namedArgument),
          new SlashCommandEnumValue("ease-in", "Ease-in animation.", enumTypes.namedArgument),
          new SlashCommandEnumValue("ease-out", "Ease-out animation.", enumTypes.namedArgument),
          new SlashCommandEnumValue("ease-in-out", "Ease-in-out animation.", enumTypes.namedArgument),
          new SlashCommandEnumValue("linear", "Linear animation.", enumTypes.namedArgument),
        ],
      }),
    ],
    helpString: 'Switches the focus mode animation when "Focus Mode" is enabled.',
  }));
}

function getLastChatMessage() {
  const context = getContext();
  const reversedChat = context.chat.slice().reverse();

  return reversedChat.filter((mes) => !mes.is_system && !mes.extra?.image);
}

/* Slash Commands */
function switchLetterboxMode(mode) {
  extension_settings[extensionName].letterboxMode = mode;
  saveSettingsDebounced();
  $("#prome-letterbox-mode").val(mode).trigger("change");
  applyLetterboxMode();
}

function switchFocusModeAnimation(animation) {
  extension_settings[extensionName].zoomAnimation = animation;
  saveSettingsDebounced();
  $("#prome-sprite-zoom-animation").val(animation).trigger("change");
  applySpriteZoomAnimation();
}

function switchFocusMode(mode) {
  extension_settings[extensionName].spriteZoom = mode;
  saveSettingsDebounced();
  $("#prome-sprite-zoom").prop("checked", mode).trigger("input");
  applySpriteZoom();
}

/* Letterbox Functions */
function resetLetterBoxSize() {
  extension_settings[extensionName].letterboxSize = defaultSettings.letterboxSize;
  $("#prome-letterbox-size").val(defaultSettings.letterboxSize).trigger("input");
  $("#prome-letterbox-size-counter").val(defaultSettings.letterboxSize);
  saveSettingsDebounced();
}

function resetLetterBoxColor () {
  extension_settings[extensionName].letterboxColor = defaultSettings.letterboxColor;
  $("#prome-letterbox-color-picker").attr('color', defaultSettings.letterboxColor);

  saveSettingsDebounced();
}

// Changes the size of the letterbox
function onLetterboxSize_Change() {
  const value = this.value;
  if (value < 1 || value > 50) {
    console.error(`[${extensionName}] Invalid letterbox size value: ${value}`);
    return;
  }
  extension_settings[extensionName].letterboxSize = value;
  $("#prome-letterbox-size").val(value);
  $("#prome-letterbox-size-counter").val(value);
  saveSettingsDebounced();
  applyLetterboxSize();
}

// Changes the color of the letterbox
function onLetterboxColor_Change(evt) {
  const value = evt.detail.rgba;
  extension_settings[extensionName].letterboxColor = value;
  saveSettingsDebounced();
  applyLetterboxColor();
}

function applyLetterboxColor() {
  document.documentElement.style.setProperty('--prom-letterbox-color', extension_settings[extensionName].letterboxColor);
}

function applyLetterboxSize() {
  let direction = "vw";
  if (extension_settings[extensionName].letterboxMode == VN_MODES.HORIZONTAL) {
    direction = "vh";
  }
  document.documentElement.style.setProperty('--prom-letterbox-size', `${extension_settings[extensionName].letterboxSize}${direction}`);
}

// Enables/Disables Letterbox Mode
function applyLetterboxMode() {
  if (extension_settings[extensionName].letterboxMode === (null || undefined)) {
    console.debug(`[${extensionName}] letterboxMode returned null or undefined.`);
  }

  console.debug(`[${extensionName}] Letterbox Mode: ${extension_settings[extensionName].letterboxMode}`);

  $('body').toggleClass('hLetterBox', extension_settings[extensionName].letterboxMode === VN_MODES.HORIZONTAL);
  $('body').toggleClass('vLetterBox', extension_settings[extensionName].letterboxMode === VN_MODES.VERTICAL);

  if (isLetterboxModeEnabled()) {
    $('#visual-novel-letterbox-one').show();
    $('#visual-novel-letterbox-two').show();
  } else {
    $('#visual-novel-letterbox-one').hide();
    $('#visual-novel-letterbox-two').hide();
  }

  applyLetterboxSize();

  console.debug(`[${extensionName}] Letterbox Settings Applied`);
}

/* Sheld Functions */
function applySheldVisibility() {
  if (extension_settings[extensionName].hideSheld === (null || undefined)) {
    console.debug(`[${extensionName}] hideSheld returned null or undefined.`);
  }

  console.debug(`[${extensionName}] Hide Sheld?: ${extension_settings[extensionName].hideSheld}`);

  $('#sheld').toggleClass('displayNone', extension_settings[extensionName].hideSheld);
}

/* Sprite Zoom Functions */
function applySpriteZoom() {
  if (extension_settings[extensionName].spriteZoom === (null || undefined)) {
    console.debug(`[${extensionName}] spriteZoom returned null or undefined.`);
  }

  console.debug(`[${extensionName}] Sprite Zoom?: ${extension_settings[extensionName].spriteZoom}`);

  $('body').toggleClass('spriteZoom', extension_settings[extensionName].spriteZoom);
}

function applySpriteZoomTimer() {
  document.documentElement.style.setProperty('--prom-sprite-zoom-speed', `${extension_settings[extensionName].zoomSpeed}s`);
}

function onSpriteZoomTimer_Change() {
  const value = this.value;
  if (value < 0 || value > 1) {
    console.error(`[${extensionName}] Invalid zoom speed value: ${value}`);
    return;
  }
  extension_settings[extensionName].zoomSpeed = value;
  $("#prome-sprite-zoom-speed").val(value);
  $("#prome-sprite-zoom-speed-counter").val(value);
  saveSettingsDebounced();
  applySpriteZoomTimer();
}

function resetSpriteZoomTimer() {
  extension_settings[extensionName].zoomSpeed = defaultSettings.zoomSpeed;
  $("#prome-sprite-zoom-speed").val(defaultSettings.zoomSpeed).trigger("input");
  $("#prome-sprite-zoom-speed-counter").val(defaultSettings.zoomSpeed);
  saveSettingsDebounced();
}

function applySpriteZoomAnimation() {
  document.documentElement.style.setProperty('--prom-sprite-zoom-animation', extension_settings[extensionName].zoomAnimation);
}

/* Helper Functions */
function isLetterboxModeEnabled() {
  return Boolean(extension_settings[extensionName].letterboxMode !== VN_MODES.NONE);
}

function isSheldVisible() {
  return Boolean(!extension_settings[extensionName].hideSheld);
}

/* Event Handlers */
function onLetterbox_Select() {
  const value = Number(this.value);
  if (value < 0 || value > 2) {
    console.error(`[${extensionName}] Invalid letterbox mode value: ${value}`);
    return;
  }
  extension_settings[extensionName].letterboxMode = value;
  saveSettingsDebounced();
  applyLetterboxMode();
}

// Toggles Prome VN Mode
function onVNUI_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].enableVN_UI = value;
  power_user.waifuMode = value;
  saveSettingsDebounced();

  // Hijack ST Main's Waifu Mode
  $('body').toggleClass('waifuMode', power_user.waifuMode);
  $('#waifuMode').prop('checked', power_user.waifuMode);
}

// Toggles Sheld Visibility
function onSheld_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].hideSheld = value;
  saveSettingsDebounced();
  applySheldVisibility();
}

// Toggles Sprite Zoom
function onSpriteZoom_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].spriteZoom = value;
  saveSettingsDebounced();
  applySpriteZoom();
}

function onSpriteZoomAnimation_Select() {
  const value = String(this.value);
  if (value != "ease" && value != "ease-in" && value != "ease-out" && value != "ease-in-out") {
    console.error(`[${extensionName}] Invalid sprite zoom animation value: ${value}`);
    return
  }
  extension_settings[extensionName].zoomAnimation = value;
  saveSettingsDebounced();
  applySpriteZoomAnimation();
}

/* Listeners */
async function applyZoom() {
  // grab the current chat/group chat
  const context = getContext();
  const group = context.groups.find((x) => x.id === context.groupId);
  if (!group) return;

  const filteredMembers = group.members.filter((x) => !group.disabled_members.includes(x));
  if (filteredMembers.length <= 1) return;
  
  const lastMessagesWithoutSystem = getLastChatMessage();
  // if there are no messages, remove the focus class
  if (lastMessagesWithoutSystem.length === 0) {
    $("#visual-novel-wrapper .prome-sprite-focus").removeClass("prome-sprite-focus");
    return;
  }

  const lastMessage = lastMessagesWithoutSystem[0];
  // if the last message is a user message, remove the focus class
  if (lastMessage.is_user) {
    $("#visual-novel-wrapper .prome-sprite-focus").removeClass("prome-sprite-focus");
    return;
  }

  const spriteDiv = `#visual-novel-wrapper [id='expression-${lastMessage.name}.png']`;
  let sprite = $(spriteDiv);

  // apply focus class to the sprite
  const applyFocusClass = () => {
    sprite.addClass("prome-sprite-focus");
    $("#visual-novel-wrapper .prome-sprite-focus").not(sprite).removeClass("prome-sprite-focus");
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

// This function is called when the extension is loaded
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

  $("#prome-enable-vn").on("click", onVNUI_Click);
  $("#prome-letterbox-mode").on("change", onLetterbox_Select);
  $("#prome-letterbox-color-picker").on("change", onLetterboxColor_Change);
  $("#prome-letterbox-size").on("input", onLetterboxSize_Change);
  $("#prome-letterbox-size-counter").on("input", onLetterboxSize_Change);
  $("#prome-letterbox-size-restore").on("click", resetLetterBoxSize);
  $("#prome-letterbox-color-restore").on("click", resetLetterBoxColor);

  $("#prome-hide-sheld").on("click", onSheld_Click);

  $("#prome-sprite-zoom").on("click", onSpriteZoom_Click);
  $("#prome-sprite-zoom-speed").on("input", onSpriteZoomTimer_Change);
  $("#prome-sprite-zoom-speed-counter").on("input", onSpriteZoomTimer_Change);
  $("#prome-sprite-zoom-speed-restore").on("click", resetSpriteZoomTimer);
  $("#prome-sprite-zoom-animation").on("change", onSpriteZoomAnimation_Select);

  addLetterbox();
  loadSettings();
  prepareSlashCommands();

  if (!isSheldVisible()) {
    toastr.info("Head to Extensions > Prome (Visual Novel Extension) and uncheck 'Hide Sheld (Message Box)' to show it again.", "Sheld is currently hidden by the Prome VN Extension.");
  }
});

$(document).ready(function() {
  // Listener for when a new message is sent
  // Listen for new divs added/removed from the chat div
  const chatObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.classList.contains('mes')) {
            // New div with class "mes" added
            applyZoom();
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (node.classList.contains('mes')) {
            // Div with class "mes" removed
            applyZoom();
          }
        });
      } 
    });
  });

  const chatDiv = document.getElementById('chat');
  chatObserver.observe(chatDiv, { childList: true });
});