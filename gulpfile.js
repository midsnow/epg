var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var reactify = require('reactify');
var literalify = require('literalify');
var rename = require('gulp-rename');
var concat = require('gulp-concat')
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
//var packages = require('./public/client/packages');
var _ = require('lodash');
var pm2 = require('pm2');
var Builder = require('systemjs-builder');
var gutil = require('gulp-util');
var less = require('gulp-less');

/**
 * Build Tasks
 */

// bundle all dependencies
// see app/app/app.js to use
gulp.task('bundle',  function (cb) {
	var builder = new Builder('./epg-app', './epg-app/config.js');
	builder.bundle('app/app - [app/**/*]', './epg-app/bundles/dependencies.js', { minify: false, sourceMaps: true })
	.then(function() {
		gutil.log('wrote /bundles/dependencies.js');
		builder.reset()
		cb()
	})
	.catch(function(err) {
		gutil.log('FAILED dep bundle ',err)
		cb()
	});
});
 
gulp.task('package', function() {
	
	gulp.src([
		'epg-app/jspm_packages/system.js',
		'epg-app/app.js'
    ])
    .pipe(concat('epg.js'))
    .pipe(gulp.dest('epg-app/bundles'));
});

gulp.task('package-electron', function() {
	
	gulp.src([
		'epg-app/jspm_packages/system.js',
		'epg-app/electron-app.js'
    ])
    .pipe(concat('electron.js'))
    .pipe(gulp.dest('epg-app/bundles'));
});

gulp.task('default', [ 'bundle', 'package' ])
gulp.task('electron-dev', [ 'bundle', 'package-electron' ])

gulp.task('production',  function (cb) {
	var builder = new Builder('./epg-app', './epg-app/config.js');
	builder.buildStatic('app/app', './epg-app/bundles/material-system.js', { minify: false, sourceMaps: false })
	.then(function() {
		gulp.src([
			'node_modules/socket.io-client/dist/socket.io.min.js', 
			'epg-app/bundles/material-system.js',
			
		])
		.pipe(concat('epg.js'))
		.pipe(gulp.dest('epg-app/bundles'))
		.on('end', function() {
			gutil.log('wrote /epg-app/bundles/epg.js');
			fs.remove('./epg-app/bundles/material-system.js', function (err) {
				if (err) {
					return console.error(err)
				}
			})
			cb();
		});
	})
	.catch(function(err) {
		gutil.log('FAILED dep bundle ',err)
		cb()
	});
});

gulp.task('electron',  function (cb) {
	var builder = new Builder('./epg-app', './epg-app/config.js');
	builder.buildStatic('app/electron-app', './epg-app/bundles/material-system.js', { minify: false, sourceMaps: false })
	.then(function() {
		gulp.src([
			'node_modules/socket.io-client/dist/socket.io.min.js', 
			'epg-app/bundles/material-system.js',
			
		])
		.pipe(concat('electron.js'))
		.pipe(gulp.dest('epg-app/bundles'))
		.on('end', function() {
			gutil.log('wrote /epg-app/bundles/electron.js');
			fs.remove('./epg-app/bundles/material-system.js', function (err) {
				if (err) {
					return console.error(err)
				}
			})
			cb();
		});
	})
	.catch(function(err) {
		gutil.log('FAILED dep bundle ',err)
		cb()
	});
});


gulp.task('less', ['less2'], function () {
   return gulp.src([
		'./epg-app/styles/fixed-data-table.css',
		'./epg-app/styles/react-virtualized.css',
		'./epg-app/styles/font-awesome.min.css',
		'./epg-app/styles/material-icon.css',
		'/tmp/site.css',
    ])
    .pipe(concat('styles.css'))
    .pipe(gulp.dest('./epg-app/css/'))
});

gulp.task('less2', function (cb) {
  
	gulp.src('./epg-app/styles/site.less')
	.pipe(less())
	.pipe(gulp.dest('/tmp'))
	.on('error', console.error.bind(console))
	.end(()=>{
		cb();
	});
});


// Watch
gulp.task('watch', function() {
  gulp.watch('client/**', ['scripts'])
  gulp.watch(['snowstreams.js', 'lib/**/*.js', 'routes/**/*.js', 'models/**/*.js'], ['pm2'])
})

gulp.task('default', [ 'bundle-dependencies'])
