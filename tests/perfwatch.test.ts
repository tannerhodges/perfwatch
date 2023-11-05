import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';

import { sendMessage } from '../src/perfwatch';

let originalSendBeacon: typeof window.navigator.sendBeacon;
let mockSendBeacon: jest.Mock;

beforeEach(() => {
	// Mock `sendBeacon()`
	originalSendBeacon = window.navigator.sendBeacon;
	mockSendBeacon = jest.fn();
	Object.defineProperty(window.navigator, 'sendBeacon', {
		value: mockSendBeacon,
		writable: true,
	});
});

afterEach(() => {
	// Restore `sendBeacon()`
	Object.defineProperty(window.navigator, 'sendBeacon', {
		value: originalSendBeacon,
		writable: false,
	});
});

describe('perfwatch', () => {
	it('sends log data in a beacon', () => {
		sendMessage({ name: 'test', value: 1 });

		expect(mockSendBeacon).toHaveBeenCalledWith(
			'http://localhost:1873/perfwatch/log',
			expect.stringMatching(
				/{"name":"test","value":1,"instanceId":"\d+\.\d+","timestamp":\d+}/
			)
		);
	});

	// TODO:
	// it('collects TTFB', () => {});
	// it('collects FCP', () => {});
	// it('collects LCP', () => {});
	// it('collects FID', () => {});
	// it('collects CLS', () => {});

	// TODO:
	// it('collects performance.measure()', () => {});
	// it('can send custom logs via PerfWatch.log()', () => {});
	// it('console.logs all PerfWatch.logs', () => {});
});
