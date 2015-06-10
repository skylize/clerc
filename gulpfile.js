/*global require*/
'use strict'

var version = require('./package').version

var gulp = require('gulp')
  , gutil = require('gulp-util')
  , plumber = require('gulp-plumber')
  , jshint = require('jshint')
  , stylish = require('jshint-stylish')
  , uglify = require('gulp-uglify')
  , replace = require('gulp-replace')
  , imagemin = require('gulp-imagemin')
  , pngquant = require('imagemin-pngquant')
  , through2 = require('through2')

// vinyl files are objects
var through = function through2ObjectMode(fn) {
  return through2({objectMode: true}, fn)
}

// plumb everything, just works better that way
var gulp_src = gulp.src
gulp.src = function plumbGulpSrc(){
  return gulp_src.apply(gulp, arguments)
    .pipe(plumber(gutil.log))
}

var SRC = 'src'
  , DEST = 'dist_'+version

function manifest (){
  gulp.src(SRC + '/manifest.json')
    .pipe(replace('{version}', version))
    .pipe(gulp.dest(DEST))
}

gulp.task('manifest', manifest)