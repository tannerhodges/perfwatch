require('dotenv').config();

module.exports = {
	// https://www.electronforge.io/guides/code-signing/code-signing-macos
	// https://stackoverflow.com/questions/46480682/how-to-sign-electron-app-using-electron-forge
	packagerConfig: {
		osxSign: {
			identity: `Developer ID Application: Austin Hodges (${process.env.APPLE_TEAM_ID})`,
		},
	},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "perfwatch",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: [
				"darwin",
			],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		},
	],
};
