import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import 'dotenv/config';

const config: ForgeConfig = {
	// https://www.electronforge.io/guides/code-signing/code-signing-macos
	// https://stackoverflow.com/questions/46480682/how-to-sign-electron-app-using-electron-forge
	packagerConfig: {
		ignore: [
			/\/_tanner_misc/,
			/\/images/,
			/.*.code-/,
			/.editorconfig/,
			/.env/,
			/.gitignore/,
			/.nvmrc/,
			/example.html/,
		],
		// https://github.com/electron/osx-sign
		osxSign: true,
		// https://github.com/electron/notarize
		osxNotarize: {
			tool: 'notarytool',
			appleId: process.env.APPLE_ID || '',
			appleIdPassword: process.env.APPLE_PASSWORD || '',
			teamId: process.env.APPLE_TEAM_ID || '',
		},
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ['darwin']),
		new MakerRpm({}),
		new MakerDeb({}),
	],
	plugins: [
		new VitePlugin({
			// `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
			// If you are familiar with Vite configuration, it will look really familiar.
			build: [
				{
					// `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
					entry: 'src/main.ts',
					config: 'vite.main.config.ts',
				},
				{
					entry: 'src/preload.ts',
					config: 'vite.preload.config.ts',
				},
				{
					entry: 'src/perfwatch.ts',
					config: 'vite.perfwatch.config.ts',
				},
			],
			renderer: [
				{
					name: 'main_window',
					config: 'vite.renderer.config.ts',
				},
			],
		}),
	],
};

export default config;
