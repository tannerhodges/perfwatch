document.addEventListener('alpine:init', () => {
	Alpine.store('data', {
		events: [],
		fileChanges: [],
		folderPath: '',
	});
});

document.addEventListener('alpine:initialized', () => {
	Alpine.store('data', {
		events: Alpine.$persist([]).as('events'),
		fileChanges: Alpine.$persist([]).as('fileChanges'),
		folderPath: Alpine.$persist('').as('folderPath'),
	});
});

window.electronAPI.handleLog((data) => {
	Alpine.store('data').events.push(data);
});

window.electronAPI.handleFileChange((event, path) => {
	const timestamp = performance.timeOrigin + performance.now();
	Alpine.store('data').fileChanges.push({ timestamp, event, path });
});
