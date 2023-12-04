import Alpine from '../vendor/alpinejs-csp-module.esm-d352364.js';
import _persist from '../vendor/alpinejs-persist-module.esm-d352364.js';

import './index.css';
import { App, LogData } from './App';

Alpine.plugin(_persist);

type AlpinePersist = typeof Alpine & {
	$persist: (value: unknown) => {
		as: (key: string) => unknown;
	};
};

function persist(name: string, value: unknown) {
	return (Alpine as AlpinePersist).$persist(value).as(name);
}

Alpine.data('App', function () {
	return App(
		{
			version: persist('version', '') as string,
			events: persist('events', []) as LogData[],
			fileDiffs: persist('fileDiffs', []) as string[],
			folderPath: persist('folderPath', '') as string,
			selectedMetric: persist('selectedMetric', '') as string,
		},
		{
			effect: Alpine.effect,
		}
	);
});

window.Alpine = Alpine;

Alpine.start();
