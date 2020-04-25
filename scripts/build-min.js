const uglify = require('uglify-js');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const args = process.argv.slice(2);
const [srcPath, destFolder] = args;

const srcName = path.basename(srcPath);
const mapName = srcName.replace('.js', '.min.map');
const minName = srcName.replace('.js', '.min.js');

const unMinPath = path.join(destFolder, srcName);
const mapPath = path.join(destFolder, mapName);
const minPath = path.join(destFolder, minName);

const preamble = `/* ${pkg.name} | v${pkg.version} | ${pkg.homepage} | License: ${pkg.license} */`;

const src = fs.readFileSync(srcPath, { encoding: 'utf-8' });

const unMinResult = uglify.minify({
  [srcName]: src
}, {
  warnings: 'verbose',
  ie8: true,
  compress: false,
  output: {
    preamble: preamble,
    beautify: true,
    comments: false
  },
  mangle: false,
  sourceMap: false
});

if (unMinResult.error) {
  console.error(`${unMinResult.error.filename}:${unMinResult.error.line},${unMinResult.error.col}: ${unMinResult.error.message}`);
  process.exit(1);
}

if (Array.isArray(unMinResult.warnings)) {
  for (const warn of unMinResult.warnings) {
    console.warn(warn);
  }
}

const minResult = uglify.minify({
  [srcName]: unMinResult.code
}, {
  warnings: 'verbose',
  ie8: true,
  output: {
    preamble: preamble
  },
  mangle: {
    reserved: ['Instafeed']
  },
  sourceMap: {
    filename: minName,
    url: mapName
  }
});

if (minResult.error) {
  console.error(`${minResult.error.filename}:${minResult.error.line},${minResult.error.col}: ${minResult.error.message}`);
  process.exit(1);
}

if (Array.isArray(minResult.warnings)) {
  for (const warn of minResult.warnings) {
    console.warn(warn);
  }
}

fs.writeFileSync(unMinPath, unMinResult.code, { encoding: 'utf-8' });
fs.writeFileSync(minPath, minResult.code, { encoding: 'utf-8' });
fs.writeFileSync(mapPath, minResult.map, { encoding: 'utf-8' });

process.exit(0);
