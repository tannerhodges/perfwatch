const fs = require('fs');
const diff = require('diff');
const path = require('path');

const folderToWatch = './test'; // Change this to the folder you want to watch

// Create an object to store the current content of each file being watched
const fileContents = {};

// Watch the folder for changes
fs.watch(folderToWatch, (eventType, filename) => {
  if (eventType === 'change') {
    const filePath = path.join(folderToWatch, filename);

    // Read the current content of the file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading ${filename}: ${err}`);
        return;
      }

      // Calculate the diff from the previous content
      const previousContent = fileContents[filename] || '';
      const differences = diff.diffLines(previousContent, data);

      // Print the diff
      console.log(`Changes in ${filename}:`);
      differences.forEach(part => {
        const prefix = part.added ? '+' : part.removed ? '-' : ' ';
        console.log(part.value.split('\n').map(line => `${prefix} ${line}`).join('\n'));
      });

      // Update the stored content for future comparisons
      fileContents[filename] = data;
    });
  }
});

console.log(`Watching ${folderToWatch} for file changes...`);
