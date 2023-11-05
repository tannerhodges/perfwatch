import { onTTFB, onFCP, onLCP, onFID, onCLS } from 'web-vitals';

export type MetricEvent = {
	name: string;
	value: number;
};

// Send performance data to perfwatch.
export function sendMessage(e: MetricEvent) {
	window.navigator.sendBeacon(
		'http://localhost:1873/perfwatch/log',
		JSON.stringify({
			name: e.name,
			value: e.value,
			instanceId: window.performance.timeOrigin.toString(),
			timestamp: Date.now(),
		})
	);
}

// Collect metrics.
onTTFB(sendMessage);
onFCP(sendMessage);
onLCP(sendMessage);
onFID(sendMessage);
onCLS(sendMessage);
