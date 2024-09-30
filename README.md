# Prome Visual Novel Extension

The Prome Visual Novel Extension is a extension for SillyTavern that remodernizes the Visual Novel system by separating it from ST itself into a extension.

## Why Prome?

> Prometheus: _Boom..._

## Features

1. Easy integration with ST's VN Mode.
2. Letterbox Mode - Make your VN experience more 'cinematic.'

   > This feature can be toggled to be horizontal or vertical and can be adjusted in size and color as needed.

   |                 Horizontal                  |                Vertical                 |
   | :-----------------------------------------: | :-------------------------------------: |
   | ![horizontal.png](./.github/horizontal.png) | ![vertical.png](./.github/vertical.png) |

3. Sheld Visibility - Hide the Sheld (Message Box) to capture the moment of a given chat.
   > This feature can be toggled in the Settings Menu or by pressing `Ctrl` + `F1`.
   <center>
    <img src="./.github/sheld_hide.png"/>
   </center>
4. Focus Mode - Focuses the speaking character sprite in chat with different animations and animation speed.
   > This feature is only supported in a Group Chat VN.
   <center>
    <img src="./.github/focus-mode.png"/>
   </center>
5. Darken Character Sprites - Similar to Focus Mode, but focuses primarily on making the focused sprite more noticeable by darkening other characters.
   > This feature is only supported in a Group Chat VN. This feature also works alongside `Focus Mode` itself.
   <center>
    <img src="./.github/defocus.png"/>
   </center>
6. [BETA] Traditional VN Mode - Hides all messages that isn't the last message to make the chat more akin to a normal VN response prompt.
   <center>
    <img src="./.github/single-message.png"/>
    </center>
7. [BETA] Chat History (for Traditional VN Mode) - Since Traditional VN hides all messages but the last sent message, a wand button has been added to view said chat history.
   > This feature is obsolete if you don't use VN Mode, but can be accessed regardless via the Wand Icon -> Open Chat History.
   <center>
    <img src="./.github/single-chat-history-log.png"/>
   </center>
8. [BETA] Sprite Emulation - Emulates Sprites by using a character's character card.
   > TBH, I have no idea what use case this has, but someone asked for it.
   <center>
    <img src="./.github/card-emulation.png"/>
   </center>

Most features and it's settings can be found under *Extensions* > `Prome (Visual Novel Extension)`. Other features like Chat History will be located under the wand tool in the ST chatbox.

   |              Extension Settings              |              Wand Options              |
   | :-----------------------------------------: | :-------------------------------------: |
   | ![settings.png](./.github/settings.png) | ![settings2.png](./.github/settings2.png) |

## Prerequisites

A SillyTavern that supports extensions.

## Installation and Usage

### Installation

1. Click _Extensions_ then **Install Extension**
2. Paste in the following **link** into the text field and click Save: `https://github.com/Bronya-Rand/Bronie-Parser-Extension`.
3. Click down on the `Prome (Visual Novel Extension)` dropdown and toggle _Enable Prome VN Mode_.
   > If you already have Visual Novel Mode on, you can skip this step.
4. Profit.
