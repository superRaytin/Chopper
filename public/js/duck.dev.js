/*
 @ duckJS —— A Module Loader For JavaScript
 @ version : 1.0.0
 @ author : superRaytin
 @ contact : superRaytin@163.com
 @ home : http://github.com/superRaytin/duckJS
 */
!function( window, document, undefined ){
    var head = document.head || document.getElementsByTagName('head')[0],
    // 页面路径
        pagePath,
    // 根路径
        rootPath,
    // 当前正在加载的模块
        onLoadingModName,
        useExecuteOnce = true;

    var rword = /[^, ]+/g;

    // 缓存加载队列
    var QueueCache = {};

    var duckJS = function(){
    };

    /*
     * 对象混合器
     * @param {Object} target 目标对象
     * @param {Object} provider 提供者
     * @param {Boolean} cover 是否覆盖同名属性或方法
     * @return {Object} 处理后的目标对象
     */
    var mix = function( target, provider, cover ){

        if( cover === undefined ) cover = true;

        for( var key in provider ){
            var covFalse = cover === false && !target[ key ];

            if( cover === true || covFalse ){
                target[ key ] = provider[ key ];
            };
        };

        return target;
    };

    mix( duckJS, {
        mix : mix,
        // 模块缓存
        module : {},

        // 配置信息
        global : {
            debug : false, // 默认非debug模式
            charset : 'utf-8',
            alias : {} // 存储模块信息
        },

        // 模块标识缓存
        markCache : {},

        // 暴露给用户配置的方法
        config : function( option ){
            var global = duckJS.global;

            if( option.constructor != Object ){
                throw new Error('param of config must be Object!');
            };

            duckModule.each( option, function( value, key ){
                if( key == 'alias' ){
                    duckModule.each( value, function( modUrl, modName ){
                        global.alias[ modName ] = modUrl;
                    });
                }
                else if( key == 'base' ){
                    global[ key ] = duckModule.parsePath( value, global.base );
                }
                else{
                    global[ key ] = value;
                };
            });
        },

        // 模块状态
        STATUS : {
            FETCHING : 1, // 开始下载（输出script标签到页面）
            READY : 2, // 已下载到本地，并准备就绪（所有依赖模块已保存）
            COMPILING : 3, // 编译中（正在执行factory）
            COMPILIED : 4 // 编译完成（正确输出了exports）
        },

        // 打印日志
        log : function( content, wrapper ){
            if( window.console ){
                window.console.log( content );
            }
            else{
                wrapper = document.getElementById( wrapper || 'duckJSLog' );
                if( wrapper ){
                    wrapper.getElementsByTagName('div')[1].innerHTML += content + '<br \/>';
                    wrapper.style.display != 'block' && ( wrapper.style.display = 'block' );
                };
            };
        }
    });

    /*
     * 模块调用方法
     * @param {Array} ids 模块ID
     * @param {Function} callback 回调函数
     * @return {Object} 返回duckJS，方便链式调用
     */
    duckJS.use = function( ids, callback ){
        ids = typeof ids === 'string' ? [ ids ] : ids;

        var modNames = [],
            modUrls = [],
            queue;

        duckModule.each( ids, function( id ){
            var parseResult = duckModule.parseModById( id ),
                modName = parseResult[0],
                modUrl = parseResult[1];

            modNames.push( modName );
            modUrls.push( modUrl );
        });

        // 组装加载队列
        queue = modNames.join('__') + '__duckJS__queue';
        QueueCache[ queue ] = {
            names : modNames,
            markNames : modNames.slice(), // 拷贝一个副本（JS中对象是按址传递）
            urls : modUrls,
            callback : callback
        };

        // 执行队列
        useExecuteOnce && duckJS._load( duckModule.getFirstItem( QueueCache ) );

        return duckJS;
    };

    // 加载队列
    duckJS._load = function( queue ){
        var data = QueueCache[ queue ],
            markNames = data.markNames,
            modNames = data.names,
            modUrls = data.urls,
            module = duckJS.module,
            modName = modNames.shift(),
            modUrl = modUrls.shift(),
            mod = module[ modName ] || ( module[ modName ] = {} ),
            STATUS = duckJS.STATUS,
            label;

        // 标识当前正在加载的模块
        onLoadingModName = modName;

        var complete = function(){
            // 返回继续加载未完成的模块
            if( modNames.length ) return duckJS._load( queue );

            // 所有模块及依赖都已下载完成
            var exports = duckModule.getModExports( markNames );

            // 执行回调
            if( data.callback ){
                data.callback.apply( null, exports );
            };

            // 删除加载完成的队列
            delete QueueCache[ queue ];

            // 检查是否还有未加载的队列
            duckModule.getFirstItem( QueueCache ) && duckJS._load( duckModule.getFirstItem( QueueCache ) );
        };

        // 模块已加载过
        if( mod.status && mod.status > STATUS.FETCHING ){
            // 检查该模块是否需要特殊回溯
            mod.toDepListBack && duckModule.fireFactoryBack( mod );
            D.log('【加载模块】 => 模块【' + modName + '】已加载过，直接回调');
            return complete();
        };

        // load js file
        if( !/\.css$/.test( modUrl ) ){
            label = document.createElement('script');
            label.src = modUrl;
            label.type = 'text/javascript';
        }
        // load css file
        else{
            label = document.createElement('link');
            label.type = 'text/css';
            label.setAttribute( 'rel', 'stylesheet' );
            label.setAttribute( 'href', modUrl );
        };
        label.setAttribute( 'charset', duckJS.global.charset );

        label.onload = label.onreadystatechange = label.onerror = function(){
            if( this.readyState && !/^complete|loaded$/.test( this.readyState ) ) return;

            label.onload = label.onreadystatechange = label.onerror = null;
            !this.getAttribute('rel') && head.removeChild( label );
            label = null;

            complete();
        };

        // 标识模块状态与所属加载队列
        mod.status = STATUS.FETCHING;
        mod.queue = queue;

        head.appendChild( label );

        useExecuteOnce = false;
    };

    /*
     * 将模块定义方法挂载到全局
     * @param {string} || {Array} deps 模块依赖
     * @param {Function} factory 模块工厂
     * @return 可直接返回一个对象
     */
    window.define = function( deps, factory ){
        var module = duckJS.module,
            loadingModName = onLoadingModName,
            mod = module[ loadingModName ],
            toDepList = mod.toDepList,
            queue = QueueCache[ mod.queue ],
            queueNames = queue.names,
            queueUrls = queue.urls,
            STATUS = duckJS.STATUS,
            dep, lastDepMod, parseResult, depModName, depModUrl, isLast;

        // define(function(){...})
        if( typeof deps === 'function' ){
            factory = deps;
            deps = null;
        }
        // define('...',function(){...})
        else if( typeof deps === 'string' ){
            deps = [ deps ];
        }
        // define({...})
        else if( deps.constructor == Object ){
            mod.exports = deps;
            mod.status = STATUS.COMPILIED;
            return;
        };

        // 存储模块依赖
        mod.deps = [];

        if( deps && deps.length ){
            for( var len = deps.length, i = len - 1; i >= 0; i-- ){
                dep = deps[i];
                parseResult = duckModule.parseModById( dep );
                depModName = parseResult[0];
                depModUrl = parseResult[1];

                mod.deps.unshift( depModName );

                depMod = module[ depModName ] || ( module[ depModName ] = {} );

                // 过滤已加载过的依赖
                if( depMod.status > STATUS.FETCHING ){
                    D.log('【定义模块】 => 依赖模块【' + depModName + '】加载过，已过滤');
                    deps.splice( i, 1 );
                }
                else{
                    // 如果最后一个依赖模块已加载，则依次往前推
                    if( !lastDepMod ){
                        lastDepMod = depMod;
                    };

                    // 根据各依赖模块在依赖列表中的索引来标识是否最后一个（用于特殊回溯）
                    isLast = depMod.isLast || ( depMod.isLast = [] );
                    isLast.unshift( i === len - 1 );

                    // 塞入加载队列
                    queueNames.unshift( depModName );
                    queueUrls.unshift( depModUrl );
                };
            };

            // 保存模块信息
            if( deps.length ){
                if( !lastDepMod.toDepList ){
                    // 先查找当前模块的依赖列表
                    lastDepMod.toDepList = toDepList || [];

                    lastDepMod.toDepList.unshift({
                        name : loadingModName,
                        factory : factory
                    });

                    mod.status = STATUS.READY;
                }
                // 最后一个依赖模块有依赖列表
                else{
                    // 拷贝作为一个特殊回溯列表
                    lastDepMod.toDepListBack = lastDepMod.toDepListBack || lastDepMod.toDepList.slice();

                    // 当前模块有依赖列表
                    if( toDepList ){
                        lastDepMod.toDepListBack = toDepList.concat( lastDepMod.toDepListBack );
                    };

                    lastDepMod.toDepListBack.unshift({
                        name : loadingModName,
                        factory : factory
                    });

                    mod.status = STATUS.READY;
                };
            }
        };

        // 无依赖或依赖已加载完成，触发factory
        if( !deps || !deps.length ){
            mod.status = STATUS.READY;
            var exports = duckModule.getModExports( mod.deps );

            mod.status = STATUS.COMPILING;
            mod.exports = factory.apply( null, exports );
            mod.status = STATUS.COMPILIED;

            // 回溯
            if( mod.toDepListBack ){
                D.log('【定义模块】 => 模块【' + loadingModName + '】进行特殊回溯');
                duckModule.fireFactoryBack( mod );
            }else{
                duckModule.fireFactory( mod );
            };
        };

        // 编译完成毁尸灭迹（toDepList作为一个编译期临时的数组缓存）
        if( mod.toDepList ) delete mod.toDepList;
    };

    var duckModule = {
        /*
         * 解析模块ID
         * @param {string} id 模块ID
         * @return {Array} 模块名称, 完整的模块url
         * @example
         base = 'http://www.abc.com/aaa/bbb/'
         http://www.abc.com/aaa/bbb/yy.js -> [ httpwwwabccomaaabbbyy, http://www.abc.com/aaa/bbb/yy.js ]
         /aaa/yy.js						 -> [ httpwwwabccomaaayy, http://www.abc.com/aaa/yy.js ]
         ../bbb2/yy.js					 -> [ httpwwwabccomaaabbb2yy, http://www.abc.com/aaa/bbb2/yy.js ]
         ccc/yy.js						 -> [ httpwwwabccomaaabbbcccyy, http://www.abc.com/aaa/bbb/ccc/yy.js ]
         ccc/yy							 -> [ httpwwwabccomaaabbbcccyy, http://www.abc.com/aaa/bbb/ccc/yy.js ]
         yy								 -> [ httpwwwabccomaaabbbyy, http://www.abc.com/aaa/bbb/yy.js ]
         */
        parseModById : function( id ){
            var base = duckJS.global.base,
                alias = duckJS.global.alias,
                markCache = duckJS.markCache,
                rHttpMod = /[^\w-]/g,
                rparam = /\?.*$/,
                rjs = /\.js$/,
                rcss = /\.css$/,
                rdeal = rjs,
                cid = id, name, url;

            //已解析过的标识直接从缓存中拿
            if( markCache[ id ] ){
                D.log('【解析模块】 => 标识【' + id + '】已解析过');
                return [ markCache[ id ].name, markCache[ id ].url ];
            };

            // 优先读取配置中模块别名
            if( alias[ id ] ){
                id = alias[ id ];
            };

            // parse js file
            if( rcss.test( id ) ) rdeal = rcss;

            // http://www.abc.com/aaa/bbb/yy.js
            if( /^http|file/.test( id ) ){
                url = id;
            }else{
                if( !rjs.test( id ) && !rcss.test( id ) ) id += '.js';
                // ../ccc/yy.js
                if( /^\.\./.test( id ) ){
                    for( url = base + id; /[^\s]+\/\.\./.test( url ); url = url.replace( /[^\/]+\/\.\.\//g, '' ) );
                }
                // /aaa/yy.js
                else if( id.charAt(0) == '/' ){
                    url = rootPath + id;
                }
                // ccc/yy.js || yy.js
                else{
                    url = base + id;
                };
            };

            name = url.replace( rdeal, '' ).replace( rHttpMod, '' ).replace( rparam, '' );
            markCache[ cid ] = {
                name : name,
                url : url
            };

            return [ name, url ];
        },

        // factory回溯
        fireFactory : function( depMod ){
            var module = duckJS.module,
                toDepList = depMod.toDepList,
                STATUS = duckJS.STATUS,
                exports, mod, name, factory, depExports;

            if( toDepList ){
                duckModule.each( toDepList, function( item ){
                    name = item.name,
                        factory = item.factory,
                        mod = module[ name ];
                    depExports = duckModule.getModExports( mod.deps );

                    mod.status = STATUS.COMPILING;
                    exports = factory.apply( null, depExports );
                    mod.exports = exports;
                    mod.status = STATUS.COMPILIED;
                });
            };
        },
        // 特殊回溯
        fireFactoryBack : function( depMod ){
            // 当前为特殊回溯模块，且后面还有未触发factory的模块，则停止回溯
            if( !depMod.isLast.shift() ) return;

            var module = duckJS.module,
                toDepListBack = depMod.toDepListBack,
                toDepListBackItem = toDepListBack.shift(),
                STATUS = duckJS.STATUS,
                exports, mod, name, factory, depExports;

            if( toDepListBackItem ){
                name = toDepListBackItem.name,
                    factory = toDepListBackItem.factory,
                    mod = module[ name ];
                depExports = duckModule.getModExports( mod.deps );

                mod.status = STATUS.COMPILING;
                exports = factory.apply( null, depExports );
                mod.exports = exports;
                mod.status = STATUS.COMPILIED;
            };
        },

        // 获取模块接口
        getModExports : function( modNames ){
            var module = duckJS.module,
                res = [],
                len = modNames.length;

            for( var i = 0; i < len; i++ ){
                var modName = modNames[i], exports = module[ modName ].exports;
                res.push( exports );
            };

            return res;
        },

        /*
         * 解析路径
         * @param {string} path 要解析的路径
         * @param {string} relativePath 相对路径
         * @return {string} 完整的模块相对路径
         * @example
         relativePath = 'http://www.abc.com/aaa/bbb/'
         http://www.abc.com/aaa/bbb/yy.js -> http://www.abc.com/aaa/bbb/
         /aaa/yy.js						 -> http://www.abc.com/aaa/
         ../ccc/yy.js					 -> http://www.abc.com/aaa/ccc/
         ccc/yy.js						 -> http://www.abc.com/aaa/bbb/ccc/
         */
        parsePath : function( path, relativePath ){
            // http(s)://www.abc.com/aaa/yy.js
            var res;
            if( /^http/.test( path ) ){
                res = path.substring( 0, path.lastIndexOf('/') ) + '/';
            }
            // ../aaa/yy.js
            else if( /^\.\.\//.test( path ) ){
                for( res = relativePath + path; /[^\s]+\/\.\./.test( res ); res = res.replace( /[^\/]+\/\.\.\//g, '' ) );
                res = res.substring( 0, res.lastIndexOf('/') ) + '/';
            }
            // /aaa/yy.js || aaa/yy.js
            else{
                res = path.charAt(0) == '/' ? ( rootPath + path ) : ( relativePath + path );
                //res = res.substring( 0, res.charAt( res.length - 1 ) == '/' ? res.lastIndexOf('/') : res.length ) + '/';
                res = res.substring( 0, res.lastIndexOf('/') ) + '/';
            };
            return res;
        },

        // 将类数组对象转换成真正的数组
        makeArray : function( likeArray ){
            var result = [],
                len = likeArray.length, i;

            for( i = len - 1; i >= 0; i-- ){
                result.unshift( likeArray[i] );
            };

            return result;
        },

        // 遍历数组或对象（名字空间）
        each : function( target, callback ){
            var len = target.length;

            if( len !== undefined ){
                for( var i = 0; i < len; i++ ){
                    var cur = target[i];

                    // 返回false 中断循环
                    if( callback.call( cur, cur, i ) === false ) break;
                };
            }
            else{
                for( var key in target ){
                    var cur = target[key];
                    if( callback.call( cur, cur, key ) === false ) break;
                };
            };
        },

        // 获取对象第一个属性名
        getFirstItem : function( obj ){
            for( var key in obj ){
                return key;
            };
            return false;
        }
    };

    window.D = window.duckJS = duckJS;

    // 初始化获取模块相对路径
    !function( script ){
        var lastScript = script[ script.length - 1 ],
            jsPath = lastScript.getAttribute('src'),
            pageUrl = document.URL.replace( /#.*/g, '' ).replace( /\\/g, '/' ),
            dataMain = lastScript.getAttribute('data-main');

        // 处理页面路径
        if( pageUrl.lastIndexOf( '/', 7 ) != -1 ){
            pagePath = pageUrl.substring( 0, pageUrl.lastIndexOf( '/' ) ) + '/';
            rootPath = pageUrl.substring( 0, pageUrl.indexOf( '/', 7 ) );
        }else{
            pagePath = pageUrl + '/';
            rootPath = pageUrl;
        };

        duckJS.global.base = duckModule.parsePath( jsPath, pagePath );

        // 查找预加载
        dataMain && duckJS.use( dataMain.split(/\s*,\s*/g) );

    }( document.getElementsByTagName('script') );
}( this, this.document, undefined );
