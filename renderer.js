document.addEventListener('alpine:init', () => {
	Alpine.data('App', function () {
		return {
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
				const labels = instanceEvents.map(i => i.instanceId);

				const datasets = this.metrics.map((metric) => ({
					label: metric,
					data: instanceEvents.map((instance) => {
						return instance.events.find(e => e.name === metric)?.value.toFixed(3);
					}),
				})).filter((dataset) => {
					const selectedMetric = this.selectedMetric;
					return !selectedMetric || dataset.label === selectedMetric;
				});

				return { labels, datasets };
			},

			init() {
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

				window.electronAPI.handleFileChange((event, path) => {
					const timestamp = performance.timeOrigin + performance.now();
					this.fileChanges.push({ timestamp, event, path });
				});
			},
		};
	});
});
