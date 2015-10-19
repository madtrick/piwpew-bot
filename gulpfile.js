'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('default', function () {
  return gulp.src(['lib/**/*.js', 'index.js'], {base: './'})
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});
