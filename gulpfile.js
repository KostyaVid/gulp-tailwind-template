const { task, src, dest, series, watch, parallel } = require('gulp');

const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('autoprefixer');
const postcssPresetEnv = require('postcss-preset-env');
const cssnano = require('cssnano');
const tailwind = require('tailwindcss');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const babel = require('gulp-babel');
const imagecomp = require('compress-images');
const del = require('del');
// const fileinclude = require('gulp-file-include');
const browserSync = require('browser-sync').create();

// const html = (cb) => {
//   src(['indexBundle.html'])
//     .pipe(
//       fileinclude({
//         prefix: '@@',
//         basepath: '@file',
//       }),
//     )
//     .pipe(concat('index.html'))
//     .pipe(dest('./src'));
//   cb();
// };

const scripts = (cb) => {
  src([
    //'node_modules/jquery/dist/jquery.min.js',
    'src/script.js',
  ])
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/env'],
      }),
    )
    .pipe(uglify())
    .pipe(concat('script.min.js'))    
    .pipe(sourcemaps.write('.'))
    .pipe(dest('src/scripts/'))
    .pipe(browserSync.stream());
  cb();
};

const css = (cb) => {
  var plugins = [
    tailwind(),
    autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }),
    require('postcss-nested'),
    cssnano(),
    postcssPresetEnv(),
  ];
  src('src/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(concat('style.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('src/css'))
    .pipe(browserSync.stream());
  cb();
};

async function images(cb) {
  imagecomp(
    'src/images/src/**/*',
    'src/images/dest/',
    { compress_force: false, statistic: true, autoupdate: true },
    false,
    { jpg: { engine: 'mozjpeg', command: ['-quality', '75'] } },
    { png: { engine: 'pngquant', command: ['--quality=75-100', '-o'] } },
    { svg: { engine: 'svgo', command: '--multipass' } },
    { gif: { engine: 'gifsicle', command: ['--colors', '64', '--use-col=web'] } },
    function (err, completed) {
      if (completed === true) {
        browserSync.reload();
      }
    },
  );
  cb();
}

function browsersyncServe(cb) {
  browserSync.init({ server: { baseDir: './src' }, notify: false, online: true });
  cb();
}

function cleanImg() {
  return del('src/images/dest/**/*', { force: true });
}

function cleanDist() {
  return del('dist/**/*', { force: true });
}

function watchTask() {
  watch(['src/**/*.js', '!src/**/*.min.js', '!src/**/*.min.js.map'], scripts);
  watch(['src/**/*.css', '!src/**/*.min.css', '!src/**/*.min.css.map'], css);
  watch('src/**/*.html', css).on('change', browserSync.reload);
  watch('src/images/src/**/*', images);
}

function build() {
  return src(['src/css/**/*.css', 'src/scripts/**/*.js', 'src/images/dest/**/*', 'src/*.html'], {
    base: 'src',
  }).pipe(dest('dist'));
}
exports.build = series(cleanDist, scripts, css, images, build);
exports.default = parallel(css, scripts, images, browsersyncServe, watchTask);
exports.css = css;
exports.scripts = scripts;
exports.images = images;
exports.cleanimg = cleanImg;
exports.cleandist = cleanDist;
