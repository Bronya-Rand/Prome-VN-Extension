import { SlashCommand } from "../../../slash-commands/SlashCommand.js";
import {
  ARGUMENT_TYPE,
  SlashCommandNamedArgument,
} from "../../../slash-commands/SlashCommandArgument.js";
import { SlashCommandParser } from "../../../slash-commands/SlashCommandParser.js";
import {
  SlashCommandEnumValue,
  enumTypes,
} from "../../../slash-commands/SlashCommandEnumValue.js";

import { VN_MODES, extensionName } from "./constants.js";
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

export function prepareSlashCommands() {
  SlashCommandParser.addCommandObject(
    SlashCommand.fromProps({
      name: "letterbox",
      /** @type {(args: { mode: string | undefined }) => void} */
      callback: async (args, _) => {
        if (args.mode === "horizontal") {
          switchLetterboxMode(VN_MODES.HORIZONTAL);
        } else if (args.mode === "vertical") {
          switchLetterboxMode(VN_MODES.VERTICAL);
        } else if (args.mode === "off") {
          switchLetterboxMode(VN_MODES.NONE);
        }
        if (args.mode !== "off") {
          toastr.success(
            `Letterbox mode is now set to ${args.mode} mode.`,
            "Letterbox Mode Status"
          );
        } else {
          toastr.success(
            `Letterbox mode is now turned off.`,
            "Letterbox Mode Status"
          );
        }
        return extension_settings[extensionName].letterboxMode;
      },
      namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
          name: "mode",
          description: "The mode to switch to.",
          isRequired: true,
          typeList: [ARGUMENT_TYPE.STRING],
          enumList: [
            new SlashCommandEnumValue(
              "off",
              "Turn off letterbox mode.",
              enumTypes.namedArgument
            ),
            new SlashCommandEnumValue(
              "horizontal",
              "Enable horizontal letterboxes.",
              enumTypes.namedArgument
            ),
            new SlashCommandEnumValue(
              "vertical",
              "Enable vertical letterboxes.",
              enumTypes.namedArgument
            ),
          ],
        }),
      ],
      helpString: "Switches the letterbox mode in the Prome VN UI.",
    })
  );

  SlashCommandParser.addCommandObject(
    SlashCommand.fromProps({
      name: "focus-mode",
      callback: async () => {
        switchFocusMode(!extension_settings[extensionName].spriteZoom);
        toastr.success(
          `Focus Mode is now ${
            extension_settings[extensionName].spriteZoom
              ? "enabled"
              : "disabled"
          }.`,
          "Focus Mode Status"
        );
        return extension_settings[extensionName].spriteZoom;
      },
      helpString: "Toggles focus mode for the Prome VN UI.",
    })
  );

  SlashCommandParser.addCommandObject(
    SlashCommand.fromProps({
      name: "focus-mode-animation",
      /** @type {(args: { animation: string | undefined }) => void} */
      callback: async (args, _) => {
        if (
          args.animation === "ease" ||
          args.animation === "ease-in" ||
          args.animation === "ease-out" ||
          args.animation === "ease-in-out" ||
          args.animation === "linear"
        ) {
          switchFocusModeAnimation(args.animation);
          toastr.success(
            `Now set to ${args.animation}.`,
            "Focus Mode Animation Set"
          );
          return extension_settings[extensionName].zoomAnimation;
        } else {
          toastr.error(
            'Please use "ease", "ease-in", "ease-out", "ease-in-out" or "linear".',
            "Invalid Animation"
          );
          return null;
        }
      },
      namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
          name: "animation",
          description: "The animation to use for sprite zoom.",
          isRequired: true,
          typeList: [ARGUMENT_TYPE.STRING],
          enumList: [
            new SlashCommandEnumValue(
              "ease",
              "Ease animation.",
              enumTypes.namedArgument
            ),
            new SlashCommandEnumValue(
              "ease-in",
              "Ease-in animation.",
              enumTypes.namedArgument
            ),
            new SlashCommandEnumValue(
              "ease-out",
              "Ease-out animation.",
              enumTypes.namedArgument
            ),
            new SlashCommandEnumValue(
              "ease-in-out",
              "Ease-in-out animation.",
              enumTypes.namedArgument
            ),
            new SlashCommandEnumValue(
              "linear",
              "Linear animation.",
              enumTypes.namedArgument
            ),
          ],
        }),
      ],
      helpString:
        'Switches the focus mode animation when "Focus Mode" is enabled.',
    })
  );
}

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
