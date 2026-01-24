import fs from 'fs';
import path from 'path';

import archiver from 'archiver';
import cssnano from 'cssnano';
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img'

export default function (eleventyConfig) {
  // generate build timestamp for presskit zip
  const buildTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  eleventyConfig.addGlobalData('presskitZip', `volgend-jaar-woensdag-perskit-${buildTime}.zip`);

  //compile tailwind before eleventy processes the files
  eleventyConfig.on('eleventy.before', async () => {
    const tailwindInputPath = path.resolve('./src/style.css');

    const tailwindOutputPath = './dist/style.css';

    const cssContent = fs.readFileSync(tailwindInputPath, 'utf8');

    const outputDir = path.dirname(tailwindOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const result = await processor.process(cssContent, {
      from: tailwindInputPath,
      to: tailwindOutputPath,
    });

    fs.writeFileSync(tailwindOutputPath, result.css);

    // create zip of presskit folder
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(`./dist/volgend-jaar-woensdag-perskit-${buildTime}.zip`);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory('./src/presskit/', false);
      archive.finalize();
    });
  });

  const processor = postcss([
    //compile tailwind
    tailwindcss(),

    //minify tailwind css
    cssnano({
      preset: 'default',
    }),
  ]);

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ['avif', 'webp', 'jpeg'],
    widths: ['auto'],
  });

  // copy ./src/presskit to dist/presskit
  eleventyConfig.addPassthroughCopy({ './src/presskit': 'presskit' });

  return {
    dir: { input: 'src', output: 'dist' },
  };
}
