import { describe, expect, it } from '@jest/globals';

import { App, AppOptions } from '../src/App';

function initApp(options: AppOptions) {
	return App(options, { effect: () => (): null => null });
}

const exampleEvent = {
	instanceId: '123.456',
	name: 'foo',
	value: 234.567,
	timestamp: 345.678,
};

describe('renderer', () => {
	it('can configure options', () => {
		const app = initApp({
			version: '123',
			events: [exampleEvent],
			fileDiffs: ['diff'],
			folderPath: '/foo/bar',
			selectedMetric: 'LCP',
		});

		expect(app.version).toEqual('123');
		expect(app.events).toEqual([exampleEvent]);
		expect(app.fileDiffs).toEqual(['diff']);
		expect(app.folderPath).toEqual('/foo/bar');
		expect(app.selectedMetric).toEqual('LCP');
	});
});
