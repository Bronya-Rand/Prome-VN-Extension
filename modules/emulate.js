import { extensionName } from "../constants.js";
import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

export function applySpriteEmulation() {
  if (extension_settings[extensionName].spriteEmulation === (null || undefined)) {
    console.debug(`[${extensionName}] spriteEmulation returned null or undefined.`);
  }

  console.debug(
    `[${extensionName}] Sprite Emulation?: ${extension_settings[extensionName].spriteEmulation}`
  );

  $("body").toggleClass(
    "spriteEmulation",
    extension_settings[extensionName].spriteEmulation
  );
}

export function onSpriteEmulation_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].spriteEmulation = value;
  saveSettingsDebounced();
  applySpriteEmulation();
}