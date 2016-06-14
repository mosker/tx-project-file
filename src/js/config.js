require.config({
    baseUrl:'./js/',
    paths: {
        preload: 'lib/preloadjs-0.6.2.min',
        jquery: 'http://mat1.gtimg.com/libs/jquery2/2.2.0/jquery2.min',
        tvp:'http://imgcache.qq.com/tencentvideo_v1/tvp/js/tvp.player_v2_jq',
        login: 'http://imgcache.qq.com/tencentvideo_v1/tvp/js/module/tvp.login'
        //iscroll: 'lib/iscroll-lite'
    },
    shim:{
        'tvp':{
            deps:['jquery']
        },
        'login':{
            deps:['tvp','jquery']
        }
    }
});

require(['main']);