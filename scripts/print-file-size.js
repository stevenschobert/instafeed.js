const fs = require('fs');
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error(`usage: node ${__filename} path_to_file`);
  process.exit(1);
}

for (const arg of args) {
  let resolvedPath;
  try {
    resolvedPath = fs.realpathSync(arg);
  } catch (err) {
    console.error(`cant resolve file path "${arg}":`, err.message);
    process.exit(1);
  }

  const fileStat = fs.statSync(resolvedPath);

  const sizeInKb = fileStat.size / 1000;

  console.log(`${arg}: ${sizeInKb}KB`);
}
