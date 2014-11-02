require! <[gulp gulp-concat-po gulp-xgettext gulp-replace]>

gulp.task 'pot' ->
  gulp.src 'templates/**/*.html' {base: '.'}
    # wacky hack before jinja templates gets properly jsxgettext'ed
    # https://github.com/zaach/jsxgettext/issues/78
    .pipe gulp-replace /or gettext/g, "|| gettext"
    .pipe gulp-xgettext do
      language: 'jinja'
      keywords: [name: '_'] ++ [name: 'format']
      bin: 'node_modules/.bin/jsxgettext'
    .pipe gulp-concat-po 'messages.pot'
    .pipe gulp.dest "locale/templates/LC_MESSAGES"
