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

const srcContent = fs.readFileSync(srcPath, { encoding: 'utf-8' });

const unMinResult = minify({
  [srcName]: srcContent
}, {
  warnings: 'verbose',
  ie8: true,
  compress: false,
  output: {
    preamble: preamble,
    beautify: true,
    comments: false,
    indent_level: 2
  },
  mangle: false,
  sourceMap: false
});

const minResult = minify({
  [srcName]: unMinResult.code
}, {
  warnings: 'verbose',
  ie8: true,
  compress: true,
  output: {
    preamble: preamble
  },
  mangle: true,
  sourceMap: {
    filename: minName,
    url: mapName
  }
});

fs.writeFileSync(unMinPath, unMinResult.code, { encoding: 'utf-8' });
fs.writeFileSync(minPath, minResult.code, { encoding: 'utf-8' });
fs.writeFileSync(mapPath, minResult.map, { encoding: 'utf-8' });

process.exit(0);

function minify(srcMap, opts) {
  const result = uglify.minify(srcMap, opts);

  if (result.error) {
    console.error(`${result.error.filename}:${result.error.line},${result.error.col}: ${result.error.message}`);
    process.exit(1);
  }

  if (Array.isArray(result.warnings)) {
    for (const warn of result.warnings) {
      console.warn(warn);
    }
  }
  return result;
}
