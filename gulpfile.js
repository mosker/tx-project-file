'use strict';

var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');

var $ = gulpLoadPlugins({pattern: '*', lazy: true}),
    _ = {src: 'src', dist: 'dist', 'cssPreProcessor': 'sass'};	//在此处切换less/sass

// 防止中断
function swallowError(err) {
    $.notify.onError({
        title: 'Gulp Error',
        message: 'Error: <%= error.message %>'
    })(err);
    this.emit('end');
}

// less编译及绑定less监听回调
gulp.task('dev:less', function () {
    return gulp.src(_.src + '/less/main.less')
        .pipe($.plumber(swallowError))
        .pipe($.less())
        .pipe($.connect.reload())
        .pipe(gulp.dest(_.src + '/css/'));
});

// sass编译及绑定sass监听回调
gulp.task('dev:sass', function () {
    return gulp.src(_.src + '/sass/main.scss')
        .pipe($.plumber(swallowError))
        .pipe($.sass().on('error', $.sass.logError))
        .pipe($.connect.reload())
        .pipe(gulp.dest(_.src + '/css/'));
});

// 绑定html监听回调
gulp.task('dev:html', function () {
    return gulp.src([_.src + '/**/*.html', '!' + _.src + '/tpls/**/*.html'])
        .pipe($.plumber(swallowError))
        .pipe($.connect.reload());
});

// 绑定js监听回调
gulp.task('dev:js', function () {
    return gulp.src([_.src + '/js/**/*.js'])
        .pipe($.plumber(swallowError))
        .pipe($.connect.reload());
});

// artTemplate TmodJS预编译
gulp.task('dev:tmod', function () {
    return gulp.src([_.src + '/tpls/**/*.html'])
        .pipe($.plumber(swallowError))
        .pipe($.tmod({
            templateBase: _.src + '/tpls',
            combo: true,
            runtime: 'templateModule.js', // 输出文件名
            compress: true, // 是否压缩 HTML 多余空白字符
            minify: true,
            cache: false
        }))
        .pipe(gulp.dest(_.src + '/js/module'));
});

// 注册监听任务
gulp.task('dev:watch', function () {
    gulp.watch([_.src + '/sass/**/*.scss'], ['dev:sass']);//sass
    gulp.watch([_.src + '/**/*.html', '!' + _.src + '/tpls/**/*.html'], ['dev:html']);
    gulp.watch([_.src + '/tpls/**/*.html'], ['dev:tmod']);
    gulp.watch([_.src + '/js/**/*.js'], ['dev:js']);
});

// 开启server
gulp.task('dev:connect', function () {
    $.connect.server({
        root: _.src,
        port: process.env.HAMMER_DEV_PORT || 80,
        livereload: true,
        middleware: function () {
            return [$.connectSsi({
                baseDir: _.src,
                ext: '.html'
            })];
        }
    });
});

// 开发中默认任务
gulp.task('default', function () {
    $.runSequence(['dev:' + _.cssPreProcessor, 'dev:tmod'], 'dev:connect', 'dev:watch');
});

/**================================开发-打包分割===================================**/

// 清空dist目录
gulp.task('build:del', function () {
    $.del([_.dist]);
});

// requirejs打包
gulp.task('requirejs', function (cb) {
    require('requirejs').optimize({
        baseUrl: _.src + '/js/',
        optimize: 'none',
        include: ['config'],
        mainConfigFile: _.src + '/js/config.js',
        excludeShallow: ['jquery'],
        out: _.dist + '/js/main.js',
        preserveLicenseComments: true,
        useStrict: true,
        wrap: true
    }, function () {
        cb();   // 成功，通知gulp任务结束
    }, function () {
        cb();   // 失败，通知gulp任务结束
    });
});

// 打包后压缩js
gulp.task('build:js', ['requirejs'], function () {
    return gulp.src(_.dist + '/js/main.js')
        .pipe($.uglify({output: {ascii_only: true}}))//不需要压缩可以注释掉
        .pipe(gulp.dest(_.dist + '/js'));
});

// artTemplate 编译
gulp.task('build:tmod', function () {
    return gulp.src([_.src + '/tpls/**/*.html'])
        .pipe($.plumber(swallowError))
        .pipe($.tmod({
            templateBase: _.src + '/tpls',
            combo: true,
            runtime: 'templateModule.js', // 输出文件名
            compress: true, // 是否压缩 HTML 多余空白字符
            minify: true,
            cache: false
        }))
		.pipe($.uglify({output: {ascii_only: true}}))//不需要压缩可以注释掉
        .pipe(gulp.dest(_.dist + '/js/module'));
});

// css压缩
gulp.task('build:css',['dev:sass'], function () {
    return gulp.src(_.src + '/css/**/*.css')
        .pipe($.cleanCss({compatibility: 'ie7'}))//不需要压缩可以注释掉
        .pipe(gulp.dest(_.dist + '/css'));
});

// index.html处理
gulp.task('build:index', function () {
    return gulp.src(_.src + '/index.html')
        .pipe($.replace('<script src="/js/config.js"></script>', '<script src="js/main.js" ></script>'))
        .pipe($.htmlmin({collapseWhitespace: true}))//不需要压缩的可以注释掉
        .pipe(gulp.dest(_.dist));
});

// html页面片压缩
gulp.task('build:html', ['build:index'], function () {
    return gulp.src(_.src + '/includes/*.html')
        .pipe($.htmlmin({collapseWhitespace: true}))//不需要压缩的可以注释掉
        .pipe(gulp.dest(_.dist + '/includes/'));
});

// 图片压缩
gulp.task('build:img', function () {
    return gulp.src(_.src + '/imgs/*')
        .pipe($.imagemin({
            progressive: true,  //针对jpg
            use: [$.imageminPngquant({quality: '65-80', speed: 4})]//png
        }))
        .pipe(gulp.dest(_.dist + '/imgs'));
});

// 开启server
gulp.task('build:connect', function () {
    $.connect.server({
        root: _.dist,
        port: 8080,
        livereload: true,
        middleware: function () {
            return [$.connectSsi({
                baseDir: _.dist,
                ext: '.html'
            })];
        }
    });
});

gulp.task('build', function () {
    $.runSequence('build:del', ['build:img', 'build:js', 'build:tmod', 'build:css', 'build:html'], 'build:connect');
});