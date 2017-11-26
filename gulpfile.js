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
var less = require('less');
var fs = require('fs-extra');

/**
 * Build Tasks
 */

gulp.task('default', [ 'package' ])
gulp.task('electron-dev', [ 'package-electron' ])

// bundle all dependencies
// see app/app/app.js to use
gulp.task('bundle',  function (cb) {
	var builder = new Builder('./epg-app', './epg-app/config.js');
	builder.bundle('app/app - [app/**/*]', './epg-app/bundles/dependencies.js', { minify: false, sourceMaps: false, lowResSourceMaps: false, mangle: false })
	.then(function( out ) {
		gutil.log('wrote /bundles/dependencies.js');
		gutil.log(out.modules);
		builder.reset()
		cb()
	})
	.catch(function(err) {
		gutil.log('FAILED dep bundle ',err)
		cb()
	});
});
 
gulp.task('package', ['bundle'], function() {
	
	gulp.src([
		'epg-app/jspm_packages/system.js',
		'epg-app/app.js'
    ])
    .pipe(concat('epg.js'))
    .pipe(gulp.dest('epg-app/bundles'))
    .on('end', function() {
		gutil.log('wrote /epg-app/bundles/epg.js');
	});
});


gulp.task('bundle-electron',  function (cb) {
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

gulp.task('package-electron', ['bundle-electron'], function() {
	
	gulp.src([
		'epg-app/jspm_packages/system.js',
		'epg-app/bundles/dependencies.js',
		'epg-app/electron-app.js'
    ])
    .pipe(concat('electron.js'))
    .pipe(gulp.dest('epg-app/bundles'))
    .on('end', function() {
		gutil.log('wrote /epg-app/bundles/electron.js');
		
	});
});


gulp.task('worker',  function (cb) {
	var builder = new Builder('./epg-app', './epg-app/config.js');
	builder.buildStatic('app/common/workers/app', './epg-app/bundles/worker-temp.js', { minify: false, mange:false, sourceMaps: false })
	.then(function( out ) {
		gutil.log(out.modules);
		gulp.src([
			'node_modules/socket.io-client/dist/socket.io.min.js', 
			'epg-app/bundles/worker-temp.js',
		])
		.pipe(concat('worker.js'))
		.pipe(gulp.dest('epg-app/bundles'))
		.on('end', function() {
			gutil.log('wrote /epg-app/bundles/worker.js');
			fs.remove('./epg-app/bundles/worker-temp.js', function (err) {
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

gulp.task('production',  function (cb) {
	var builder = new Builder('./epg-app', './epg-app/config.js');
	builder.buildStatic('app/app', './epg-app/bundles/material-system.js', { minify: true, mange:false, sourceMaps: false })
	.then(function( out ) {
		gutil.log(out.modules);
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
	builder.buildStatic('app/app', './epg-app/bundles/material-system.js', { minify: false, sourceMaps: false })
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
	fs.readFile('./epg-app/styles/site.less', 'utf8', ( err, file ) => {
		if ( file ) {
			//console.log(file)
			less.render(file, {
				paths: ['./epg-app/styles/']
			})
			.then( out => {
				fs.writeFile('/tmp/site.css', out.css, err => {
					if ( err ) {
						gutil.log('Err in writeFile', err);
						return cb(err)
					}
					cb()
				});
			}, err => {
				gutil.log('Error in Less', err);
				cb(err);
			});
			
		} else {
			cb(err)
		}
	});	
});


// Watch
gulp.task('watch', function() {
  gulp.watch('./epg-app/app/common/workers/**', ['worker'])
})

