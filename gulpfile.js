const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const browserify = require('gulp-browserify');
 
gulp.task('default', () => {
    return gulp.src('scripts/front/**/*.js')
        .pipe(babel({
            presets: ['es2015', 'react'],
        }))
        .pipe(concat('all.js'))
        .pipe(browserify({
          debug : true
        }))
        .pipe(gulp.dest('public/assets/js'));
});