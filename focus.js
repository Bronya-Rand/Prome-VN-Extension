import { extensionName, defaultSettings } from "./constants.js";
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

/* Sprite Zoom Functions */
export function applySpriteZoom() {
  if (extension_settings[extensionName].spriteZoom === (null || undefined)) {
    console.debug(`[${extensionName}] spriteZoom returned null or undefined.`);
  }

  console.debug(
    `[${extensionName}] Sprite Zoom?: ${extension_settings[extensionName].spriteZoom}`
  );

  $("body").toggleClass(
    "spriteZoom",
    extension_settings[extensionName].spriteZoom
  );
}

export function applySpriteDefocusTint() {
  if (extension_settings[extensionName].spriteDefocusTint === (null || undefined)) {
    console.debug(`[${extensionName}] spriteDefocusTint returned null or undefined.`);
  }

  console.debug(
    `[${extensionName}] Sprite Defocus Tint?: ${extension_settings[extensionName].spriteDefocusTint}`
  );

  $("body").toggleClass(
    "spriteDefocusTint",
    extension_settings[extensionName].spriteDefocusTint
  );
}

export function applySpriteZoomTimer() {
  document.documentElement.style.setProperty(
    "--prom-sprite-zoom-speed",
    `${extension_settings[extensionName].zoomSpeed}s`
  );
}

export function applySpriteZoomAnimation() {
  document.documentElement.style.setProperty(
    "--prom-sprite-zoom-animation",
    extension_settings[extensionName].zoomAnimation
  );
}

/* Event Handlers */
export function onSpriteZoomTimer_Change() {
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

export function resetSpriteZoomTimer() {
  extension_settings[extensionName].zoomSpeed = defaultSettings.zoomSpeed;
  $("#prome-sprite-zoom-speed").val(defaultSettings.zoomSpeed).trigger("input");
  $("#prome-sprite-zoom-speed-counter").val(defaultSettings.zoomSpeed);
  saveSettingsDebounced();
}

export function onSpriteZoom_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].spriteZoom = value;
  saveSettingsDebounced();
  applySpriteZoom();
}

export function onSpriteDefocusTint_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].spriteDefocusTint = value;
  saveSettingsDebounced();
  applySpriteDefocusTint();
}

export function onSpriteZoomAnimation_Select() {
  const value = String(this.value);
  if (
    value != "ease" &&
    value != "ease-in" &&
    value != "ease-out" &&
    value != "ease-in-out"
  ) {
    console.error(
      `[${extensionName}] Invalid sprite zoom animation value: ${value}`
    );
    return;
  }
  extension_settings[extensionName].zoomAnimation = value;
  saveSettingsDebounced();
  applySpriteZoomAnimation();
}
