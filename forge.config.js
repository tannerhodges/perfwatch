require('dotenv').config();

module.exports = {
	// https://www.electronforge.io/guides/code-signing/code-signing-macos
	// https://stackoverflow.com/questions/46480682/how-to-sign-electron-app-using-electron-forge
	packagerConfig: {
		ignore: [
			'/_tanner_misc',
			'/images',
			'\.*\.code-',
			'\.editorconfig',
			'\.env',
			'\.env',
			'\.gitignore',
			'\.nvmrc',
			'example.html',
		],
		// https://github.com/electron/osx-sign
		osxSign: {
			identity: process.env.APPLE_IDENTITY,
			entitlements: true,
			hardenedRuntime: true,
			// https://github.com/electron/notarize/issues/54#issuecomment-704625356
			'gatekeeper-assess': false,
		},
		// https://github.com/electron/notarize
		osxNotarize: {
			tool: 'notarytool',
			appleId: process.env.APPLE_ID,
			appleIdPassword: process.env.APPLE_PASSWORD,
			teamId: process.env.APPLE_TEAM_ID,
		},
	},
	makers: [
		{
			name: '@electron-forge/maker-zip',
			platforms: [
				'darwin',
			],
		},
	],
};
