// updateConfigSize.js
import fs from 'fs';
import path from 'path';

// Paths
const configPath = path.resolve('.output/public/config.js');
const indexPath = path.resolve('.output/server/index.mjs');

// Get byte size of config.js
const sizeInBytes = fs.readFileSync(configPath).length;
console.log(`Config.js size: ${sizeInBytes} bytes`);

// Read index.mjs content
let indexContent = fs.readFileSync(indexPath, 'utf-8');

// Regex to find the size value for "/config.js" in the assets object
// It matches "/config.js": { ... "size": <number> ... }
const regex = /("\/config\.js":\s*{[^}]*?"size":\s*)\d+/s;

// Replace the old size with the new size
if (regex.test(indexContent))
{
  indexContent = indexContent.replace(regex, `$1${sizeInBytes}`);
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`Updated index.mjs with new size for /config.js.`);
}
else
{
  console.error('Could not find "/config.js" in index.mjs');
}