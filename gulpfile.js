/*global require, Buffer*/
'use strict'

var pkg = require('./package.json')
  , spawn = require('child_process').spawn
  , gulp = require('gulp')
  , gutil = require('gulp-util')
  , plumber = require('gulp-plumber')
  , jshint = require('gulp-jshint')
  , stylish = require('jshint-stylish')
  , uglify = require('gulp-uglify')
  , imagemin = require('gulp-imagemin')
  , pngquant = require('imagemin-pngquant')
  , sourcemaps = require('gulp-sourcemaps')
  , zip = require('gulp-zip')
  , del = require('del')
  , through = require('through2')


var ENC = 'utf8' // ascii is faster, but has no TM symbol utf8
  , SRC = 'src'
  , DEST = 'dist_'+pkg.version

// plumb everything for cleaner gulpfile & fewer gulp crashes
var gulp_src = gulp.src
gulp.srcPlumber = function plumbGulpSrc(){
  return gulp_src.apply(gulp, arguments)
    .pipe(plumber(function errHandle(e){
      gutil.beep(); gutil.log(e)
    }))
}

function replace (s, r) {
  // stream vinyl contents through String.prototype.replace()
  return through.obj(function (file, enc, cb){
    var newfile
    if (file !== null) {
      newfile = file
      for (var key in file) // dupe file, except for contents
        if (key !== 'contents') newfile[key] = file[key]
      // replace on contents then push
      var contents = file.contents.toString(ENC).replace(s, r)
      newfile.contents = new Buffer(contents, ENC)
      this.push(newfile)
    }
    else this.push(null)
    cb(null)
  })
}

function manifest (){
  // copy version from package.json to manifest.json
  // this allows versioning w/ npm command
  return gulp.src(SRC + '/manifest.json')
    .pipe(replace('{version}', pkg.version))
    .pipe(gulp.dest(DEST))
}

function img (){
  // optimize images
  // TODO: reduce dependencies by writing simple vinyl compatible
  // wrapper for image binaries (also, maybe autogenerate from svg)
  return gulp.src(SRC + '/img/**/*', {base: SRC})
    .pipe(imagemin({
      use: [pngquant()] // optipng also used by default
    }))
    .pipe(gulp.dest(DEST))
}

function scripts (evt){
  // even w/ maps, uglify makes debugging harder
  var devMode = // just don't uglify during dev
    (evt && evt.type && evt.type==='changed')

  return gulp.src(SRC + '/**/*.js')
    // abort on failure w/ pretty jshint report
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'))
    
    // uglify w/ maps
    .pipe(sourcemaps.init())
      .pipe(devMode ? through.obj() : uglify())
    .pipe(sourcemaps.write('/maps'))

    .pipe(gulp.dest(DEST))
}

function release (){
  var us = '"use strict";'
    , hp = 'chrome.runtime.onInstalled.addListener('
        +'function(){chrome.tabs.create({url:\''+pkg.homepage
        +'\'})});'
  // inject code to open Clerc homepage on install
  return gulp.src(DEST+'/background.js')
    .pipe(replace(us, us+hp))
    .pipe(gulp.dest(DEST))

  // add private key for uploading to webstore
  .on('end', function (){
    return gulp.src('key.pem')
      .pipe(gulp.dest(DEST))
  
  // save zip file
  .on('end', function (){
    return gulp.src(DEST+'**/**', {base: DEST})
      .pipe(zip(DEST+'.zip'))
      .pipe(gulp.dest('zip'))
      // remove duped private key
      .on('end', function (){
        del([DEST+'/*.pem'])
      })
    })
  })
}

function git(){
  // add any untracked distro files to git, log git status
  var gitstatus = function(){return spawn('git',['status'])}

  var status = gitstatus()
  status.stdout.on('data', function(data){
    var untracked = data.toString(ENC).split('Untracked')[1]
    if (untracked && untracked.indexOf(DEST)){
      var add = spawn('git',['add', DEST +'/*'])
      add.on('data', function(data){
        var status = gitstatus()
        status.on('data', function(data){
          gutil.log(data.toString(ENC))
        })
      })
    }
    else gutil.log(data.toString(ENC))
  })
}

function dev (){
  // oh how I wish I could use Clerc on itself here :)
  var watcher = gulp.watch(SRC+'/**/*.js')
  watcher.on('change', scripts)
}

gulp.task('manifest', manifest)
gulp.task('img', img)
gulp.task('scripts', scripts)
gulp.task('git', git)

// TODO: MAKE TESTS!!!!

// TODO: alter task structure to allow release-only
//  injections before uglify
gulp.task('build', ['manifest', 'img', 'scripts'], git)
gulp.task('release', ['build'], release)
gulp.task('watch', dev)