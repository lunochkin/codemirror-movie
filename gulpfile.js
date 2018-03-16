const gulp = require('gulp')
const browserify = require('browserify')
const babelify = require('babelify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const minifyCSS = require('gulp-minify-css')
const sourcemaps = require('gulp-sourcemaps')


gulp.task('js', () => {
	return browserify('lib/movie.js', {debug: true})
		.transform('babelify', {presets: ['env']})
		.bundle()
		.pipe(source('movie.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(sourcemaps.write('./'))
		// Gulp Plugins Here
		.pipe(gulp.dest('dist'));
});

gulp.task('css', () => {
	return gulp.src('./lib/movie.css')
		.pipe(minifyCSS())
		.pipe(gulp.dest('./dist'));
});

gulp.task('watch', () => {
// 	jsBundler.watch({sourceMap: true});
	gulp.watch('./lib/**/*.js', ['js']);
});

gulp.task('demo:js', () => {
	return browserify('demo/src/index.js', {debug: true})
		.transform('babelify', {presets: ['env', 'react']})
		.bundle()
		.pipe(source('bundle.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('demo/dist'))
})

gulp.task('demo:css', () => {
	gulp.src('./lib/movie.css')
		.pipe(minifyCSS())
		.pipe(gulp.dest('./demo/dist'))

	gulp.src('./node_modules/codemirror/lib/codemirror.css')
		.pipe(minifyCSS())
		.pipe(gulp.dest('./demo/dist'))
})

gulp.task('demo:watch', () => {
// 	jsBundler.watch({sourceMap: true});
	gulp.watch('./demo/src/**/*.js', ['demo:js']);
	gulp.watch('./lib/**/*.js', ['demo:js']);
});

gulp.task('default', ['js', 'css']);
