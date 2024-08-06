import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { power_user } from "../../../power-user.js";
import { isMobile } from "../../../RossAscends-mods.js";

const extensionName = "prome-vn-extension";
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
  }

  // Prome Updates
  $("#prome-enable-vn").prop("checked", extension_settings[extensionName].enableVN_UI).trigger("input");
  $("#prome-letterbox-mode").val(extension_settings[extensionName].letterboxMode).trigger("change");
  $("#prome-letterbox-color-picker").attr('color', extension_settings[extensionName].letterboxColor);
  $("#prome-letterbox-size").val(extension_settings[extensionName].letterboxSize).trigger("input");
  $("#prome-letterbox-size-counter").val(extension_settings[extensionName].letterboxSize);

  // ST Main Updates
  $("#waifuMode").prop("checked", extension_settings[extensionName].enableVN_UI).trigger("input");

  // Apply Letterbox Settings (if enabled)
  applyLetterboxMode();
  applyLetterboxColor();
  applyLetterboxSize();
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

function isLetterboxModeEnabled() {
  return Boolean(extension_settings[extensionName].letterboxMode !== VN_MODES.NONE);
}

function isVNMode() {
  return Boolean(!isMobile() && extension_settings[extensionName].enableVN_UI);
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

// This function is called when the extension is loaded
jQuery(async () => {
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);

  $("#extensions_settings").append(settingsHtml);

  $("#prome-enable-vn").on("click", onVNUI_Click);
  $("#prome-letterbox-mode").on("change", onLetterbox_Select);
  $("#prome-letterbox-color-picker").on("change", onLetterboxColor_Change);
  $("#prome-letterbox-size").on("input", onLetterboxSize_Change);
  $("#prome-letterbox-size-restore").on("click", resetLetterBoxSize);
  $("#prome-letterbox-color-restore").on("click", resetLetterBoxColor);

  loadSettings();
});
