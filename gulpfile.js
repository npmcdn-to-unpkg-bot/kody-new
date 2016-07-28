var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var babelify = require('babelify');

var dependencies = [
	'react',
  	'react-dom'
];
 
gulp.task('default', () => {


	// create vendor.js with dependencies
	// browserify({
	// 		require: dependencies,
	// 		debug: true
	// 	})
	// .bundle()
	// .pipe(source('vendors.js'))
	// .pipe(gulp.dest('./public/assets/js'));

	// the app
	var app = browserify({
    	entries: './scripts/front/app.js',
    	debug: true
  	})

  	dependencies.forEach(function (d) {
		app.external(d);
	});

	app
	  	.transform("babelify", {presets: ["es2015", "react"]})
	    .bundle()
	    .pipe(source('app.js'))
	    .pipe(gulp.dest('public/assets/js'));

    // return gulp.src('scripts/front/app.js')
    //     .pipe(babel({
    //         presets: ['es2015', 'react'],
    //     }))
    //     // .pipe(concat('all.js'))
    //     .pipe(browserify({
    //     	require: dependencies,
    //       	debug : true
    //     }))
    //     .pipe(gulp.dest('public/assets/js'));
});