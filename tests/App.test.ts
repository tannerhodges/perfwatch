import { describe, expect, it, jest } from '@jest/globals';

import { App, AppOptions } from '../src/App';
import _electronAPI from '../src/electronAPI';

let mockOpenFolder = '';

jest.mock('electron', () => ({
	ipcRenderer: {
		invoke(name: string) {
			return new Promise((resolve) => {
				if (name === 'open-folder') {
					resolve(mockOpenFolder);
				} else {
					resolve(null);
				}
			});
		},
		on: jest.fn(),
	},
}));

window.electronAPI = _electronAPI;

function initApp(options: AppOptions) {
	return App(options, { effect: () => (): null => null });
}

const exampleEvent = {
	instanceId: '123.456',
	name: 'foo',
	value: 234.567,
	timestamp: 345.678,
};

function getMockEvent({ value }: { value: string }): Event {
	const mockElement: HTMLSelectElement = { value } as HTMLSelectElement;
	return { target: mockElement } as unknown as Event;
}

function setData(app: ReturnType<typeof App>, value: Record<string, unknown>) {
	Object.defineProperty(app, '$data', { value, writable: false });
}

describe('App', () => {
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

	it('has metrics', () => {
		const app = initApp({});
		expect(app.metrics).toEqual(['TTFB', 'FCP', 'LCP', 'FID', 'CLS']);
	});

	it('has colors', () => {
		const app = initApp({});
		expect(app.colors.length).toBeGreaterThan(0);
		app.colors.forEach((color) => {
			expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
		});
	});

	it('assigns colors to metrics', () => {
		const app = initApp({});
		const metricColors = app.getMetricColors();
		Object.entries(metricColors).forEach(([metric, colors]) => {
			expect(app.metrics).toContain(metric);
			expect(app.colors).toContain(colors.borderColor);
			expect(colors.backgroundColor).toEqual(
				app.getSemiTransparentColor(colors.borderColor)
			);
		});
	});

	it('can change selected metric', () => {
		const app = initApp({});
		expect(app.selectedMetric).toEqual('');

		const mockEvent = getMockEvent({ value: 'LCP' });
		app.setSelectedMetric(mockEvent);
		expect(app.selectedMetric).toEqual('LCP');
	});

	it('can tell elements whether their metric is selected', () => {
		const app = initApp({});
		setData(app, { metric: 'LCP' });
		expect(app.isMetricSelected()).toEqual(false);

		const mockEvent = getMockEvent({ value: 'LCP' });
		app.setSelectedMetric(mockEvent);
		expect(app.isMetricSelected()).toEqual(true);
	});

	it('can select a folder', async () => {
		const app = initApp({});
		expect(app.folderPath).toEqual('');

		mockOpenFolder = '/foo/bar';

		await app.selectFolder();
		expect(app.folderPath).toEqual('/foo/bar');

		mockOpenFolder = '';
	});

	it('can reset', () => {
		const app = initApp({
			events: [exampleEvent],
			fileDiffs: ['diff'],
		});

		app.reset();

		expect(app.events).toEqual([]);
		expect(app.fileDiffs).toEqual([]);
	});

	it('can format datetimes', () => {
		const app = initApp({});

		const formattedString = app.formatDateTime('1672531200000.0');
		expect(formattedString).toEqual('2023-01-01T00:00:00.000Z');

		const formattedNumber = app.formatDateTime(1672531200000.0);
		expect(formattedNumber).toEqual('2023-01-01T00:00:00.000Z');
	});
});
