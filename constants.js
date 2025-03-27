export const extensionName = "Prome-VN-Extension";
export const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
export const VN_MODES = {
	NONE: 0,
	HORIZONTAL: 1,
	VERTICAL: 2,
};

const defaultTintValues = {
	name: "Jarilo Midnight",
	shared: false,
	world: {
		enabled: true,
		blur: 0,
		brightness: 34,
		contrast: 100,
		grayscale: 0,
		hue: 0,
		invert: 0,
		saturate: 100,
		sepia: 10,
	},
	character: {
		enabled: true,
		blur: 0,
		brightness: 100,
		contrast: 100,
		grayscale: 0,
		hue: 0,
		invert: 0,
		saturate: 100,
		sepia: 0,
	},
};

const defaultTintPresets = [
	{
		name: "Dark Penacony",
		shared: false,
		world: {
			enabled: true,
			blur: 0,
			brightness: 34,
			contrast: 100,
			grayscale: 0,
			hue: 90,
			invert: 1,
			saturate: 100,
			sepia: 10,
		},
		character: {
			enabled: true,
			blur: 0,
			brightness: 100,
			contrast: 100,
			grayscale: 0,
			hue: 0,
			invert: 0,
			saturate: 100,
			sepia: 0,
		},
	},
	{
		name: "Jarilo Midnight",
		shared: false,
		world: {
			enabled: true,
			blur: 0,
			brightness: 34,
			contrast: 100,
			grayscale: 0,
			hue: 0,
			invert: 0,
			saturate: 100,
			sepia: 10,
		},
		character: {
			enabled: true,
			blur: 0,
			brightness: 100,
			contrast: 100,
			grayscale: 0,
			hue: 0,
			invert: 0,
			saturate: 100,
			sepia: 0,
		},
	},
];

export const defaultSettings = {
	enableVN_UI: false,
	letterboxMode: 0,
	letterboxColor: "rgba(0, 0, 0, 1)",
	letterboxSize: 8,
	hideSheld: false,
	spriteZoom: false,
	zoomSpeed: 0.6,
	zoomAnimation: "ease",
	spriteDefocusTint: false,
	showOnlyLastMessage: false,
	emulateSprites: false,
	spriteShake: false,
	spriteShadow: false,
	shadowOffsetX: 15,
	shadowOffsetY: 5,
	shadowBlur: 9,
	worldTint: false,
	currentTintValues: defaultTintValues,
	selectedTint: "Jarilo Midnight",
	tintPresets: defaultTintPresets,
	enableUserSprite: false,
	userSprite: "",
	autoHideSprites: false,
	maxViewableCharacters: 5,
	maxSpriteScale: 1,
	scaleSprites: false,
};
