<p align="center">
   <img src="./.github/prome-open-graph.jpg"/>
</p>

The Prome Visual Novel Extension is a extension for SillyTavern that remodernizes the Visual Novel system by separating it from ST itself into a extension.

> [!CAUTION]
> Prome in this dev build at the moment is only supported on the current staging branch of SillyTavern. Switch your SillyTavern version to `staging` using this command:
> `git checkout -b staging && git pull` !

## Why Prome?

> Prometheus: _Boom..._

## Features

1. Easy integration with SillyTavern and it's Visual Novel Mode
2. World + Character Tinting - Prome's biggest feature to date. Wanted to make a chat take place in the evening for that special 'date' or experience a post-alter version of a game world, but were unable to get such weather/events to happen (such as a locked day cycle in Honkai: Star Rail)? Now you can by setting the world and/or character colors to be how **YOU** want it to be.

> [!NOTE]
> Tinting choices available are: Blur, Brightness, Contrast, Grayscale, Hue, Invert, Saturate and Sepia. The World Tint can be shared with characters and both tints can be enabled or disabled in the Prome menu.

   <center>
      <img src="./.github/world-tint.png">
   </center>

3. **[BETA]** User Sprites - Prome's second biggest feature. Want to be part of the conversation? Borrow someone else's sprites or use your own for your own persona whilst using all of Prome's other features!

> [!IMPORTANT]
> 1. On rare occasions, SillyTavern may display a warning saying _'prome-user' is not in the list of group members_ in a Group Chat. Ignore this warning as this is your persona and Prome has already added it to the group chat.
> 2. When changing chats, you might spot a "broken" character in the character/group list named `Prome User Sprite (Do Not Click)`. Do not interact with it as this is Prome making a "dummy character" for your persona to use in a group chat. You can however move it's position to be elsewhere in a group chat.
> 3. If you decide to use the name of a character that exists in the group chat or your persona name is the same as a character in chat, your user sprite *may* change expressions to that of said character. This is primarily a ST limitation but you can always revert it via `/express` or by duplicating the character folder and renaming it to something else.

   <center>
      <img src="./.github/user-sprite.png">
   </center>

4. Sprite Emulation - Ever wanted to make a group chat of all your favorite characters but there is that one character who you can't find sprites for? With Sprite Emulation, Prome will just tell SillyTavern to use said character's character card and include them in the group chat!
   <center>
    <img src="./.github/card-emulation.png"/>
   </center>
5. Focus/Defocus Mode - Want to replicate the sprite focus of some visual novels like Doki Doki Literature Club. Focus Mode/Darken Character Sprites gives you the ability to do so within your chats, making it known who is speaking at any given moment.

> [!NOTE]
> The animation speed and transition of Focus/Darken Character Sprites can be adjusted in the Prome menu.

   <center>
    <img src="./.github/defocus.png"/>
   </center>

6. Auto-Hide Sprites (an alternative to disabling characters) - Wanted to keep everyone in chat but there are just too many people on screen to see them all? Give Prome a limit of sprites to show in the VN screen! Whether you want 3, 6 or 8, Prome will auto-hide anyone who hasn't partaken in the conversation, making the screen easier to see.
   <center>
    <img src="./.github/auto-hide.png">
   </center>

7. Sprite Shadows & Shake (Emulates Speaking) - Wanted a bit more "realism" to your character sprites? Prome has the ability to mimic a character talking by shaking the sprite subtly and add a shadow to the sprite itself, making the character blend in more into the environment you've chosen!

> [!IMPORTANT]
> Sprite Shake will only work if `Streaming` is enabled in your preset settings. Sprite Shadows can be adjusted in X and Y distances as well as blur strength.

   <center>
       <img src="./.github/sprite-shadow.png">
    </center>

8. Sprite Scaling - Are your sprite(s) having a small tendency to clip out of bounds or maybe they are just too dang big? Or is it the opposite and they're tiny as heck? Scale them up or down as you wish!

> [!NOTE] 
> This is a global scaler and will affect all sprites in the chat (including User Sprites).

|                       Default (1.0)                       |                          Reduced (0.75)                         |
| :-------------------------------------------------------: | :-------------------------------------------------------------: | 
| ![sprite-scale-base.png](./.github/sprite-scale-base.png) | ![sprite-scale-reduced.png](./.github/sprite-scale-reduced.png) |

9. Letterbox Mode - Make your VN experience more 'cinematic' or 'retro' with letterboxes of the past!

> [!NOTE]
> Letterboxes can be rendered horizontalally or vertically and can be adjusted in size and color in the Prome menu.

|                 Horizontal                  |                Vertical                 |
| :-----------------------------------------: | :-------------------------------------: |
| ![horizontal.png](./.github/horizontal.png) | ![vertical.png](./.github/vertical.png) |

10. Traditional VN Mode - Want a even further visual novel experience of one reply at a time? Enabling Traditional VN Mode will make Prome transform the SillyTavern VN screen to behave more similarly to some Visual Novels like Katawa Shoujo or NVL (long text) type games.
   <center>
    <img src="./.github/single-message.png"/>
    </center>

> [!TIP]
> To view chat history with Traditional VN Mode on, click on the Wand Icon and click _Open Chat History_.
> ![single-chat-history-log.png](./.github/single-chat-history-log.png)

11. Sheld Visibility - Hide the Sheld (Message Box) to capture the moment of a given chat.

> [!NOTE]
> This feature can be toggled in the Settings Menu or by pressing `Ctrl` + `F1`.

   <center>
      <img src="./.github/sheld_hide.png"/>
   </center>

Most of Prome's feature settings can be found under _Extensions_ > `Prome (Visual Novel Extension)`. Other features like Chat History will be located under the wand tool in the ST chatbox.
| Extension Settings | Wand Options |
| :-------------------------------------: | :---------------------------------------: |
| ![settings.png](./.github/settings.png) | ![settings2.png](./.github/settings2.png) |

## Prerequisites

- SillyTavern 1.12.14+ 

## Installation and Usage

### Installation

Prome has two branches to choose from:
1. `main` - The stable version of Prome that works for all SillyTavern versions (unless staging breaks a Prome dependency).
2. `dev` - Basically a beta version of Prome where stuff I plan to add/fix go before moving to staging. May not work fully and stuff in it may change at any time.

> [!NOTE]
> If you are installing Prome via ST's *Download Extensions & Assets* or *Install Extension* methods, you will only be able to use the `main` branch of Prome. If you desire to use the `dev` branch of Prome, see the [Git](#via-git) install method.

#### Via Download Extensions & Assets (Easiest)

1. Click _Extensions_ then **Download Extensions & Assets**
2. Click the red power plug button and then OK.
3. Scroll down to find `Prome Visual Novel Extension` and click the Download button.
4. Refresh the SillyTavern page.
5. Click on _Extensions_ again and click down on the `Prome (Visual Novel Extension)` dropdown and toggle _Enable Prome_.
   > If you already have Visual Novel Mode on, you can skip this step.
6. Profit.

#### Via Install Extension

1. Click _Extensions_ then **Install Extension**
2. Paste in the following **link** into the text field and click Save: `https://github.com/Bronya-Rand/Prome-VN-Extension`.
3. Refresh the SillyTavern page.
4. Click on _Extensions_ again and click down on the `Prome (Visual Novel Extension)` dropdown and toggle _Enable Prome_.
   > If you already have Visual Novel Mode on, you can skip this step.
5. Profit.

#### Via Git
1. Go to your extensions folder (usually in `/data/default-user/extensions`).
2. Open Command Prompt, Terminal, Windows Powershell, etc. and run the following command: 
   ```sh
   git clone https://github.com/Bronya-Rand/Prome-VN-Extension
   ```

> [!NOTE]
> If you want to use the `dev` branch of Prome, run this command instead: 
> ```sh
> git clone https://github.com/Bronya-Rand/Prome-VN-Extension -b dev
> ```
3. Refresh the SillyTavern page or start up SillyTavern (if it's not running).
4. Click on _Extensions_ again and click down on the `Prome (Visual Novel Extension)` dropdown and toggle _Enable Prome_.
   > If you already have Visual Novel Mode on, you can skip this step.
5. Profit.

The Prome Visual Novel Extension, the Prome Visual Novel Extension Code, Copyright 2024-2025 Bronya-Rand. All rights reserved. 
