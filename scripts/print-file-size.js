const fs = require('fs');
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(`usage: node ${__filename} path_to_file`);
  process.exit(1);
}

const [ filePath ] = args;
let resolvedPath;
try {
  resolvedPath = fs.realpathSync(filePath);
} catch (err) {
  console.error(`cant resolve file path "${filePath}":`, err.message);
  process.exit(1);
}

const fileStat = fs.statSync(resolvedPath);

const sizeInKb = fileStat.size / 1000;

console.log(`${filePath}: ${sizeInKb}KB`);
