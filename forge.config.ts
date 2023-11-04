import type {
	ForgeConfig,
	ForgePackagerOptions,
} from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import 'dotenv/config';

const packagerConfig: ForgePackagerOptions = {};

// https://www.electronforge.io/guides/code-signing/code-signing-macos
const appleCredentials = {
	appleId: process.env.APPLE_ID || '',
	appleIdPassword: process.env.APPLE_PASSWORD || '',
	teamId: process.env.APPLE_TEAM_ID || '',
};

// Only sign if all credentials are provided.
if (Object.values(appleCredentials).every((v) => v)) {
	packagerConfig.osxSign = true;
	packagerConfig.osxNotarize = {
		tool: 'notarytool',
		...appleCredentials,
	};
}

const config: ForgeConfig = {
	packagerConfig,
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
