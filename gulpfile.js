'use strict'

const gulp         = require('gulp');
const pug          = require('gulp-pug');
const sass         = require('gulp-sass');
const rename       = require("gulp-rename");
const rimraf       = require('rimraf')
const sftp         = require('gulp-sftp');
const cache        = require('gulp-cache');
const imagemin     = require('gulp-imagemin');
const gulpPngquant = require('gulp-pngquant');
const autoprefixer = require('gulp-autoprefixer');
const spritesmith  = require('gulp.spritesmith');
const sourcemaps   = require('gulp-sourcemaps');
const browserSync  = require('browser-sync').create();


// ----- SERVER -----

gulp.task('server', function() {
    browserSync.init({
        server: {
        	port: 9000,
            baseDir: "build"
        }
    });

    gulp.watch('build/**/*.*').on('change', browserSync.reload);
});

// ----- PUG -----

gulp.task('templates:compile', function buildHTML() {
  return gulp.src('_dev/templates/index.pug')
  .pipe(pug({
    pretty: true
  }))
  .pipe(gulp.dest('build'));
});

// ----- SASS -----

gulp.task('styles:compile', function () {
  return gulp.src('_dev/sass/main.scss')
  	.pipe(sourcemaps.init())
  	.pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(rename("main.min.css"))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/css'));
});

// ----- OPTIMIZE IMAGE -----

gulp.task('img:compile', function() {
    return gulp.src('_dev/img/**/*')
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [gulpPngquant()]
        })))
        .pipe(gulp.dest('build/img'));
});

// ----- SPRITE -----

gulp.task('sprite', function (cb) {
  const spriteData = gulp.src('_dev/img/icons/*.png')
  .pipe(spritesmith({
    imgName: 'sprite.png',
    imgPath: '../img/sprite.png',
    cssName: 'sprite.scss'
  }));

  spriteData.img.pipe(gulp.dest('build/img/'));
  spriteData.css.pipe(gulp.dest('_dev/sass/global/'));

  cb();
});

// ----- CLEAN -----

gulp.task('clean', function del(cb) {
	return rimraf('build', cb);
});

// ----- COPY FONTS -----

gulp.task('copy:fonts', function() {
	return gulp.src('_dev/fonts/**/*.*')
	.pipe(gulp.dest('build/fonts'));
});

// ----- COPY IMAGES -----

gulp.task('copy:images', function() {
	return gulp.src('_dev/img/**.*')
	.pipe(gulp.dest('build/img'));
});

// ----- COPY MAIN -----

gulp.task('copy', gulp.parallel('copy:fonts', 'copy:images'));

// ----- WATCH -----

gulp.task('watch', function() {
	gulp.watch('_dev/templates/**/*.pug', gulp.series('templates:compile'));
	gulp.watch('_dev/sass/**/*.scss', gulp.series('styles:compile'));
});

// ----- UPLOAD -----

gulp.task('upload', function () {
    return gulp.src('build/**/*.*')
        .pipe(sftp({
            host: 'presta-f.kl.com.ua',
            user: 'dimabo',
            pass: 'x\A%:W9($n>#5X5c',
            remotePath: '/presta-f.kl.com.ua/'
        }));
});

// ----- DEFAULT -----

gulp.task('default', gulp.series(
	'clean',
	gulp.parallel('templates:compile', 'styles:compile', 'img:compile', 'sprite', 'copy'),
	gulp.parallel('watch', 'server')
	),
	'upload'
);