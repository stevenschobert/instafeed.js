const uglifyEs = require('uglify-es');
const fs = require('fs').promises;
const path = require('path');
const rollup = require('rollup');

const pkg = require('../package.json');

const args = process.argv.slice(2);
const [srcPath, destFolder] = args;

const srcName = path.basename(srcPath);

const esUnminName = srcName.replace('.js', '.es.js');
const esMinName = srcName.replace('.js', '.es.min.js');
const esMapName = srcName.replace('.js', '.es.min.map');

const umdExportName = 'Instafeed';
const umdUnminName = srcName.replace('.js', '.js');
const umdMinName = srcName.replace('.js', '.min.js');
const umdMapName = srcName.replace('.js', '.min.map');

const esUnminPath = path.join(destFolder, esUnminName);
const esMinPath = path.join(destFolder, esMinName);
const esMapPath = path.join(destFolder, esMapName);

const umdUnminPath = path.join(destFolder, umdUnminName);
const umdMinPath = path.join(destFolder, umdMinName);
const umdMapPath = path.join(destFolder, umdMapName);

const preamble = `/* ${pkg.name} | v${pkg.version} | ${pkg.homepage} | License: ${pkg.license} */`;

function minify(srcMap, opts) {
  const result = uglifyEs.minify(srcMap, opts);

  if (result.error) {
    console.error(`${result.error.filename}:${result.error.line},${result.error.col}: ${result.error.message}`);
    throw new Error(`error minifying`);
  }

  if (Array.isArray(result.warnings)) {
    for (const warn of result.warnings) {
      console.warn(warn);
    }
  }

  return result;
}

async function build() {
  console.log('------------------------\nBuilding ES version\n------------------------');

  const esModule = await getModuleBundle(srcPath, {
    format: 'es'
  });

  const esUnminResult = minify({
    [esUnminName]: esModule.code
  }, {
    warnings: 'verbose',
    ecma: 5,
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

  const esMinResult = minify({
    [esUnminName]: esUnminResult.code
  }, {
    warnings: 'verbose',
    ecma: 5,
    ie8: true,
    compress: true,
    output: {
      preamble: preamble
    },
    mangle: true,
    sourceMap: {
      filename: esMinName,
      url: esMapName
    }
  });

  console.log('------------------------\nBuilding UMD version\n------------------------');

  const umdModule = await getModuleBundle(srcPath, {
    format: 'umd',
    name: umdExportName,
    exports: 'default'
  });

  const umdUnminResult = minify({
    [umdUnminName]: umdModule.code
  }, {
    warnings: 'verbose',
    ecma: 5,
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

  const umdMinResult = minify({
    [umdUnminName]: umdUnminResult.code
  }, {
    warnings: 'verbose',
    ecma: 5,
    ie8: true,
    compress: true,
    output: {
      preamble: preamble
    },
    mangle: true,
    sourceMap: {
      filename: umdMinName,
      url: umdMapName
    }
  });

  await Promise.all([
    fs.writeFile(esUnminPath, esUnminResult.code, { encoding: 'utf-8' }),
    fs.writeFile(esMinPath, esMinResult.code, { encoding: 'utf-8' }),
    fs.writeFile(esMapPath, esMinResult.map, { encoding: 'utf-8' }),

    fs.writeFile(umdUnminPath, umdUnminResult.code, { encoding: 'utf-8' }),
    fs.writeFile(umdMinPath, umdMinResult.code, { encoding: 'utf-8' }),
    fs.writeFile(umdMapPath, umdMinResult.map, { encoding: 'utf-8' })
  ]);
}

async function getModuleBundle(filePath, outputOptions) {
  const bundle = await rollup.rollup({
    input: filePath
  });

  const { output } = await bundle.generate(outputOptions);

  const chunk = output.find((chunk) => {
    return chunk.fileName === path.basename(filePath);
  });

  if (!chunk) {
    throw new Error(`no rollup output chunk found for ${filePath}`);
  }

  return chunk;
}

const start = process.hrtime();
build().then(() => {
  const duration = process.hrtime(start);
  console.log(
    '------------------------\nBuild complete (%ds %dms)\n------------------------',
    duration[0],
    Math.round(duration[1] / 1000000)
  );
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
})
