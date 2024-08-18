import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
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

  // ST Main Updates
  $("#waifuMode").prop("checked", extension_settings[extensionName].enableVN_UI).trigger("input");

  // Apply Letterbox Settings (if enabled)
  applyLetterboxMode();
  applyLetterboxColor();
  applyLetterboxSize();

  // Apply Sheld Visibility
  applySheldVisibility();
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
      helpString: 'Switches the letterbox mode.',
  }));
}

function switchLetterboxMode(mode) {
  extension_settings[extensionName].letterboxMode = mode;
  saveSettingsDebounced();
  $("#prome-letterbox-mode").val(mode).trigger("change");
  applyLetterboxMode();
}

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

function applySheldVisibility() {
  if (extension_settings[extensionName].hideSheld === (null || undefined)) {
    console.debug(`[${extensionName}] hideSheld returned null or undefined.`);
  }

  console.debug(`[${extensionName}] Hide Sheld?: ${extension_settings[extensionName].hideSheld}`);

  $('#sheld').toggleClass('displayNone', extension_settings[extensionName].hideSheld);
}

function isLetterboxModeEnabled() {
  return Boolean(extension_settings[extensionName].letterboxMode !== VN_MODES.NONE);
}

function isSheldVisible() {
  return Boolean(!extension_settings[extensionName].hideSheld);
}

// Selects the Letterbox Mode
function onLetterbox_Select() {
  const value = Number(this.value);
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

  addLetterbox();
  loadSettings();
  prepareSlashCommands();

  if (!isSheldVisible()) {
    toastr.info("Sheld is currently hidden by the Prome VN Extension.", "Head to Extensions > Prome (Visual Novel Extension) and uncheck 'Hide Sheld (Message Box)' to show it again.");
  }
});