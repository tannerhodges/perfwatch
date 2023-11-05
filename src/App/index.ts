import {
	Chart,
	CategoryScale,
	LinearScale,
	LineController,
	LineElement,
	PointElement,
} from 'chart.js';

Chart.register(
	CategoryScale,
	LinearScale,
	LineController,
	LineElement,
	PointElement
);

export type AlpineFunctions = {
	effect: (callback: () => void) => void;
};

export type LogData = {
	instanceId: string;
	name: string;
	value: number;
	timestamp: number;
};

export type EventsGroupedByInstanceIdEntry = {
	instanceId: string;
	events: LogData[];
};

export type EventsGroupedByInstanceId = EventsGroupedByInstanceIdEntry[];

export type MetricNames = string[];

export type MetricColor = {
	borderColor: string;
	backgroundColor: string;
};

export type MetricColors = {
	[metric: string]: MetricColor;
};

export type ChartDataset = {
	label: string;
	data: string[];
} & MetricColor;

export type ChartDatasets = ChartDataset[];

export type AppOptions = {
	version?: string;
	events?: LogData[];
	fileDiffs?: string[];
	folderPath?: string;
	selectedMetric?: string;
};

export function App(options: AppOptions, { effect }: AlpineFunctions) {
	const appOptions: AppOptions = {
		...options,
		version: '',
		events: [],
		fileDiffs: [],
		folderPath: '',
		selectedMetric: '',
	};

	return {
		...appOptions,

		metrics: ['TTFB', 'FCP', 'LCP', 'FID', 'CLS'],

		// https://github.com/chartjs/Chart.js/blob/e74ee7b75b49c0e8d79b67775ad5cd8424d95fef/src/plugins/plugin.colors.ts#L14-L25
		colors: [
			'rgb(54, 162, 235)', // blue
			'rgb(255, 99, 132)', // red
			'rgb(255, 159, 64)', // orange
			'rgb(255, 205, 86)', // yellow
			'rgb(75, 192, 192)', // green
			'rgb(153, 102, 255)', // purple
			'rgb(201, 203, 207)', // grey
		],

		// https://github.com/chartjs/Chart.js/blob/e74ee7b75b49c0e8d79b67775ad5cd8424d95fef/src/plugins/plugin.colors.ts#L14-L25
		getMetricColors(): MetricColors {
			return (this.metrics as MetricNames).reduce(
				(result: MetricColors, metric: string, index: number) => {
					const borderColor = this.colors[index % this.colors.length];
					const backgroundColor = borderColor
						.replace('rgb(', 'rgba(')
						.replace(')', ', 0.5)');

					result[metric] = {
						borderColor,
						backgroundColor,
					};

					return result;
				},
				{}
			);
		},

		setSelectedMetric(event: Event) {
			const selectElement = event.target as HTMLSelectElement;
			if (selectElement instanceof HTMLSelectElement) {
				this.selectedMetric = selectElement.value;
			}
		},

		isMetricSelected() {
			return this.selectedMetric === this.$data.metric;
		},

		async selectFolder() {
			const folderPath = await window.electronAPI.openFolder();
			this.folderPath = folderPath;
		},

		reset() {
			this.events = [];
			// TODO: Reset git repo?
			this.fileDiffs = [];
		},

		formatDateTime(timestamp: string | number): string {
			if (typeof timestamp === 'string') {
				timestamp = parseFloat(timestamp);
			}
			const date = new Date(timestamp);
			return date.toISOString();
		},

		getEventsGroupedByInstanceId(): EventsGroupedByInstanceId {
			const instanceEvents = this.events.reduce(
				(result: EventsGroupedByInstanceId, event: LogData) => {
					const instance = result.find(
						(g) => g.instanceId === event.instanceId
					);
					if (instance) {
						instance.events.push(event);
					} else {
						result.push({
							instanceId: event.instanceId,
							events: [event],
						});
					}
					return result;
				},
				[]
			);

			instanceEvents.sort(
				(
					a: EventsGroupedByInstanceIdEntry,
					b: EventsGroupedByInstanceIdEntry
				) => (a.instanceId < b.instanceId ? -1 : 1)
			);

			return instanceEvents;
		},

		getChart(): { labels: string[]; datasets: ChartDatasets } {
			const instanceEvents: EventsGroupedByInstanceId =
				this.getEventsGroupedByInstanceId();
			const labels: string[] = instanceEvents.map((i) =>
				this.formatDateTime(i.instanceId)
			);
			const metricColors: MetricColors = this.getMetricColors();

			const datasets: ChartDatasets = (this.metrics as MetricNames)
				.map((metric) => ({
					label: metric,
					data: instanceEvents.map((instance) => {
						return instance.events
							.find((e) => e.name === metric)
							?.value.toFixed(3);
					}),
					...metricColors[metric],
				}))
				.filter((dataset: ChartDataset) => {
					const selectedMetric = this.selectedMetric;
					return !selectedMetric || dataset.label === selectedMetric;
				});

			return { labels, datasets };
		},

		showEvent() {
			return (
				!this.selectedMetric || this.selectedMetric === this.$data.event.name
			);
		},

		getEventDateTime() {
			return this.formatDateTime(this.$data.event.instanceId);
		},

		getEventName() {
			return this.$data.event.name;
		},

		getEventValue() {
			return this.$data.event.value.toFixed(3);
		},

		showMetric() {
			return !this.selectedMetric || this.selectedMetric === this.$data.metric;
		},

		getAverage(values: number[]): number {
			return (
				values.reduce((sum, value) => sum + (value || 0), 0) /
				(values.length || 1)
			);
		},

		getStandardDeviation(values: number[], mean: number): number {
			const squaredDifferences = values.map((value) =>
				Math.pow(value - mean, 2)
			);
			const variance =
				squaredDifferences.reduce((acc, value) => acc + value, 0) /
				(values.length - 1);
			return Math.sqrt(variance);
		},

		getControlLimits(values: (number | string)[] | undefined, multiplier = 3) {
			values = values
				.filter((value) => typeof value !== 'undefined')
				.map((value) => {
					if (typeof value === 'string') {
						return Number.parseFloat(value);
					}
					return value;
				});

			const mean: number = this.getAverage(values);
			const standardDeviation = this.getStandardDeviation(values, mean);

			return {
				upper: mean + multiplier * standardDeviation,
				lower: mean - multiplier * standardDeviation,
			};
		},

		getAverageMetricLabel() {
			return `Average ${this.$data.metric}`;
		},

		getAverageMetric(): string {
			return this.getAverage(
				(this.$data.events as LogData[])
					.filter((e) => e.name === this.$data.metric)
					.map((e) => e.value)
			).toFixed(3);
		},

		getFileChangeDateTime() {
			return this.formatDateTime(this.$data.fileChange.timestamp);
		},

		getFileChangeEvent() {
			return this.$data.fileChange.event;
		},

		getFileChangePath() {
			return this.$data.fileChange.path;
		},

		async checkVersion() {
			const appVersion = await window.electronAPI.getAppVersion();

			if (this.version !== appVersion) {
				console.log(
					`Version changed from "${this.version}" to "${appVersion}"`
				);
				this.version = appVersion;
			}
		},

		async init() {
			await this.checkVersion();

			const {
				labels,
				datasets,
			}: { labels: string[]; datasets: ChartDatasets } = this.getChart();

			const chart = new Chart(this.$refs.canvas.getContext('2d'), {
				type: 'line',
				data: { labels, datasets },
				options: {
					animation: false,
					interaction: { intersect: false },
					scales: { y: { beginAtZero: true } },
				},
			});

			effect(() => {
				const {
					labels,
					datasets,
				}: { labels: string[]; datasets: ChartDatasets } = this.getChart();

				// TODO: Control limits?
				// const lcp = datasets.find((d) => d.label === 'LCP');
				// if (lcp) {
				// 	const { upper: lcpUcl, lower: lcpLcl } = this.getControlLimits(
				// 		lcp.data.slice(0, -1),
				// 		1.5
				// 	);
				// 	console.log({ lcpUcl, lcpLcl }, lcp.data.slice(0, -1));
				// 	const metricColors: MetricColors = this.getMetricColors();
				// 	datasets.push({
				// 		label: 'LCP UCL',
				// 		data: labels.map(() => lcpUcl),
				// 		borderColor: metricColors['LCP'].backgroundColor,
				// 		backgroundColor: metricColors['LCP'].backgroundColor,
				// 	});
				// 	datasets.push({
				// 		label: 'LCP LCL',
				// 		data: labels.map(() => lcpLcl),
				// 		borderColor: metricColors['LCP'].backgroundColor,
				// 		backgroundColor: metricColors['LCP'].backgroundColor,
				// 	});
				// }

				chart.data.labels = labels;
				chart.data.datasets = datasets;
				chart.update();
			});

			window.electronAPI.handleLog((data: LogData) => {
				const instanceIds = new Set(
					(this.events as LogData[]).map((e) => e.instanceId)
				);
				const isNewInstance = !instanceIds.has(data.instanceId);
				if (isNewInstance) {
					window.electronAPI.commitInstance(data.instanceId);
				}

				this.events.push(data);
			});

			window.electronAPI.setFolder(this.folderPath);

			// TODO: Flesh out this API...
			window.electronAPI.handleFileDiff((diff: string) => {
				this.fileDiffs.unshift(diff);
			});
		},
	};
}
