document.addEventListener('alpine:init', () => {
	Alpine.data('App', function () {
		return {
			version: this.$persist(window.electronAPI.version).as('version'),
			events: this.$persist([]).as('events'),
			fileChanges: this.$persist([]).as('fileChanges'),
			folderPath: this.$persist('').as('folderPath'),
			selectedMetric: this.$persist('').as('selectedMetric'),

			metrics: [
				'TTFB',
				'FCP',
				'LCP',
				'FID',
				'CLS',
			],

			// https://github.com/chartjs/Chart.js/blob/e74ee7b75b49c0e8d79b67775ad5cd8424d95fef/src/plugins/plugin.colors.ts#L14-L25
			colors: [
				'rgb(54, 162, 235)', // blue
				'rgb(255, 99, 132)', // red
				'rgb(255, 159, 64)', // orange
				'rgb(255, 205, 86)', // yellow
				'rgb(75, 192, 192)', // green
				'rgb(153, 102, 255)', // purple
				'rgb(201, 203, 207)' // grey
			],

			// https://github.com/chartjs/Chart.js/blob/e74ee7b75b49c0e8d79b67775ad5cd8424d95fef/src/plugins/plugin.colors.ts#L14-L25
			getMetricColors() {
				return this.metrics.reduce((result, metric, index) => {
					const borderColor = this.colors[index % this.colors.length];
					const backgroundColor = borderColor.replace('rgb(', 'rgba(').replace(')', ', 0.5)');

					result[metric] = {
						borderColor,
						backgroundColor,
					};

					return result;
				}, {});
			},

			setSelectedMetric(event) {
				this.selectedMetric = event.target.value;
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
				this.fileChanges = [];
			},

			formatDateTime(timestamp) {
				return (new Date(timestamp)).toISOString();
			},

			getAverage(events) {
				return events.reduce((sum, e) => (sum + (e?.value || 0)), 0) / (events.length || 1);
			},

			getEventsGroupedByInstanceId() {
				const instanceEvents = this.events.reduce((result, event) => {
					let instance = result.find(g => g.instanceId === event.instanceId);
					if (instance) {
						instance.events.push(event);
					} else {
						result.push({
							instanceId: event.instanceId,
							events: [event],
						});
					}
					return result;
				}, []);

				instanceEvents.sort((a, b) => a.instanceId - b.instanceId);

				return instanceEvents;
			},

			getChart() {
				const instanceEvents = this.getEventsGroupedByInstanceId();
				const labels = instanceEvents.map(i => this.formatDateTime(i.instanceId));
				const metricColors = this.getMetricColors();

				const datasets = this.metrics.map((metric) => ({
					label: metric,
					data: instanceEvents.map((instance) => {
						return instance.events.find(e => e.name === metric)?.value.toFixed(3);
					}),
					...metricColors[metric],
				})).filter((dataset) => {
					const selectedMetric = this.selectedMetric;
					return !selectedMetric || dataset.label === selectedMetric;
				});

				return { labels, datasets };
			},

			showEvent() {
				return !this.selectedMetric || selectedMetric === this.$data.event.name;
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

			getAverageMetricLabel() {
				return `Average ${this.$data.metric}`;
			},

			getAverageMetric() {
				return this.getAverage(this.$data.events.filter(e => e.name === this.$data.metric)).toFixed(3);
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

			checkVersion() {
				if (this.version !== window.electronAPI.version) {
					console.log(`Version changed from "${this.version}" to "${window.electronAPI.version}"`);
					this.version = window.electronAPI.version;
				}
			},

			init() {
				this.checkVersion();

				const { labels, datasets } = this.getChart();
				const chart = new Chart(this.$refs.canvas.getContext('2d'), {
					type: 'line',
					data: { labels, datasets },
					options: {
						animation: false,
						interaction: { intersect: false },
						scales: { y: { beginAtZero: true } },
					}
				});

				Alpine.effect(() => {
					const { labels, datasets } = this.getChart();
					chart.data.labels = labels;
					chart.data.datasets = datasets;
					chart.update();
				});

				window.electronAPI.handleLog((data) => {
					this.events.push(data);
				});

				window.electronAPI.setFolder(this.folderPath);

				window.electronAPI.handleFileChange((event, path) => {
					const timestamp = performance.timeOrigin + performance.now();
					this.fileChanges.push({ timestamp, event, path });
				});
			},
		};
	});
});
