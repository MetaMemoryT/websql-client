var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');

gulp.task('default', ['compile']);

gulp.task('compile', function() {
  gulp.src('./websql-client.litcoffee')
    .pipe(coffee({
      bare: true
    }).on('error', gutil.log))
    .pipe(gulp.dest('./dist/'));
});