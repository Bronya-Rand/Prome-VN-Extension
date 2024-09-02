import { extension_settings } from "../../../extensions.js";
import { extensionName } from "./constants.js";
import { saveSettingsDebounced } from "../../../../script.js";

/* Sheld Functions */
export function applySheldVisibility() {
  if (extension_settings[extensionName].hideSheld === (null || undefined)) {
    console.debug(`[${extensionName}] hideSheld returned null or undefined.`);
  }

  console.debug(
    `[${extensionName}] Hide Sheld?: ${extension_settings[extensionName].hideSheld}`
  );

  $("#sheld").toggleClass(
    "displayNone",
    extension_settings[extensionName].hideSheld
  );
}

/* Event Handlers */
export function onSheld_Click(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].hideSheld = value;
  saveSettingsDebounced();
  applySheldVisibility();
}
