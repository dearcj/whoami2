var gulp         = require('gulp'),
    rename       = require('gulp-rename');
    sass         = require('gulp-sass');
    autoprefixer = require('gulp-autoprefixer');
    browserSync = require('browser-sync').create();

function scss(done) {
    gulp.src('./scss/**/*.scss')
        .pipe(sass({
            errorLogToConsole: true,
            outputStyle: 'compressed'
        }))
        .on('error', console.error.bind(console))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe( gulp.dest('./css') )
        .pipe(browserSync.stream());

    done();
}

function sync(done) {
    browserSync.init({
        server: {
            baseDir: './'
        },
        port: 3000
    });
    done();
}

function reload(done) {
    browserSync.reload();
    done();
}

function watchFiles() {
    gulp.watch('./scss/**/*', scss);
    gulp.watch('./**/*.html', reload);
    gulp.watch('./**/*.js', reload);
}

gulp.task('default', gulp.parallel(sync, watchFiles));
gulp.task(sync);
