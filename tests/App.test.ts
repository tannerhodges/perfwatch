import { describe, expect, it } from '@jest/globals';

import { App, AppOptions } from '../src/App';

function initApp(options: AppOptions) {
	return App(options, { effect: () => (): null => null });
}

describe('renderer', () => {
	it('has metrics', () => {
		const app = initApp({});
		expect(app.metrics).toEqual(['TTFB', 'FCP', 'LCP', 'FID', 'CLS']);
	});
});
