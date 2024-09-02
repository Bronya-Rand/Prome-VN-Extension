import { extensionName, defaultSettings, VN_MODES } from "./constants.js";
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { isLetterboxModeEnabled } from "./utils.js";

/* Letterbox Functions */
export function resetLetterBoxSize() {
  extension_settings[extensionName].letterboxSize =
    defaultSettings.letterboxSize;
  $("#prome-letterbox-size")
    .val(defaultSettings.letterboxSize)
    .trigger("input");
  $("#prome-letterbox-size-counter").val(defaultSettings.letterboxSize);
  saveSettingsDebounced();
}

export function resetLetterBoxColor() {
  extension_settings[extensionName].letterboxColor =
    defaultSettings.letterboxColor;
  $("#prome-letterbox-color-picker").attr(
    "color",
    defaultSettings.letterboxColor
  );

  saveSettingsDebounced();
}

// Changes the size of the letterbox
export function onLetterboxSize_Change() {
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
export function onLetterboxColor_Change(evt) {
  const value = evt.detail.rgba;
  extension_settings[extensionName].letterboxColor = value;
  saveSettingsDebounced();
  applyLetterboxColor();
}

export function applyLetterboxColor() {
  document.documentElement.style.setProperty(
    "--prom-letterbox-color",
    extension_settings[extensionName].letterboxColor
  );
}

export function applyLetterboxSize() {
  let direction = "vw";
  if (extension_settings[extensionName].letterboxMode == VN_MODES.HORIZONTAL) {
    direction = "vh";
  }
  document.documentElement.style.setProperty(
    "--prom-letterbox-size",
    `${extension_settings[extensionName].letterboxSize}${direction}`
  );
}

// Enables/Disables Letterbox Mode
export function applyLetterboxMode() {
  if (extension_settings[extensionName].letterboxMode === (null || undefined)) {
    console.debug(
      `[${extensionName}] letterboxMode returned null or undefined.`
    );
  }

  console.debug(
    `[${extensionName}] Letterbox Mode: ${extension_settings[extensionName].letterboxMode}`
  );

  $("body").toggleClass(
    "hLetterBox",
    extension_settings[extensionName].letterboxMode === VN_MODES.HORIZONTAL
  );
  $("body").toggleClass(
    "vLetterBox",
    extension_settings[extensionName].letterboxMode === VN_MODES.VERTICAL
  );

  if (isLetterboxModeEnabled()) {
    $("#visual-novel-letterbox-one").show();
    $("#visual-novel-letterbox-two").show();
  } else {
    $("#visual-novel-letterbox-one").hide();
    $("#visual-novel-letterbox-two").hide();
  }

  applyLetterboxSize();

  console.debug(`[${extensionName}] Letterbox Settings Applied`);
}

/* Event Handlers */
export function onLetterbox_Select() {
  const value = Number(this.value);
  if (value < 0 || value > 2) {
    console.error(`[${extensionName}] Invalid letterbox mode value: ${value}`);
    return;
  }
  extension_settings[extensionName].letterboxMode = value;
  saveSettingsDebounced();
  applyLetterboxMode();
}
