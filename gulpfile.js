var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');

var source = require('vinyl-source-stream');
var gutil = require('gulp-util');
var browserifyshim = require('browserify-shim');

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
    	extensions: [".js", ".react"],
    	debug: true
  	})

  	dependencies.forEach(function (d) {
		app.external(d);
	});

	app
	  	.transform("babelify", {
	  		presets: ["es2015", "react"],
	  		extensions: [".js", ".react"]
	  	})
	  	.transform(browserifyshim)
	    .bundle()
	    .pipe(source('app.js'))
	    .pipe(gulp.dest('public/assets/js'));

});

gulp.task('watch', function() {
	gulp.watch(['scripts/front/**/*.js', 'scripts/front/**/*.react'], ['default']);
});