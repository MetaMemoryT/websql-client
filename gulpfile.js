var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');

gulp.task('default', ['compile']);
var paths = './src/websql-client.litcoffee';

gulp.task('compile', function() {
  gulp.src(paths)
    .pipe(coffee({
      bare: true
    }).on('error', gutil.log))
    .pipe(gulp.dest('./dist/'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths, ['compile']);
});