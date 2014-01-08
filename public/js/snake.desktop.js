/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                setImmediate(fn);
            };
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
        }
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            var sync = true;
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        if (sync) {
                            async.nextTick(iterate);
                        }
                        else {
                            iterate();
                        }
                    }
                }
            });
            sync = false;
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    async.nextTick(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.nextTick(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            var sync = true;
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                if (sync) {
                    async.nextTick(function () {
                        async.whilst(test, iterator, callback);
                    });
                }
                else {
                    async.whilst(test, iterator, callback);
                }
            });
            sync = false;
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var sync = true;
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                if (sync) {
                    async.nextTick(function () {
                        async.doWhilst(iterator, test, callback);
                    });
                }
                else {
                    async.doWhilst(iterator, test, callback);
                }
            }
            else {
                callback();
            }
        });
        sync = false;
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            var sync = true;
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                if (sync) {
                    async.nextTick(function () {
                        async.until(test, iterator, callback);
                    });
                }
                else {
                    async.until(test, iterator, callback);
                }
            });
            sync = false;
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        var sync = true;
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                if (sync) {
                    async.nextTick(function () {
                        async.doUntil(iterator, test, callback);
                    });
                }
                else {
                    async.doUntil(iterator, test, callback);
                }
            }
            else {
                callback();
            }
        });
        sync = false;
    };

    async.queue = function (worker, concurrency) {
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.nextTick(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var sync = true;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(function () {
                        var cbArgs = arguments;

                        if (sync) {
                            async.nextTick(function () {
                                next.apply(null, cbArgs);
                            });
                        } else {
                            next.apply(null, arguments);
                        }
                    });
                    worker(task.data, cb);
                    sync = false;
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.nextTick(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());


;

(function() {


;

function _nextTick(cb) {
	setTimeout(cb, 0);
}

var requestAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	_nextTick;

;

// utils
var _ArrayProto = Array.prototype;
var _ObjProto = Object.prototype;
var _slice = _ArrayProto.slice;
var _nativeIndexOf = _ArrayProto.indexOf;
var _nativeForEach = _ArrayProto.forEach;
var _hasOwnProperty = _ObjProto.hasOwnProperty;
var _nativeKeys = Object.keys;

var _breaker = {};

var u = {};

u.has = function(obj, key) {
	return _hasOwnProperty.call(obj, key);
};

u.keys = _nativeKeys || function(obj) {
	if (obj !== Object(obj)) throw new TypeError('Invalid object');
	var keys = [];
	for (var key in obj)
		if (u.has(obj, key)) keys.push(key);
	return keys;
};

u.indexOf = function(array, item) {
	if (array === null) return -1;
	var i = 0,
		length = array.length;
	if (_nativeIndexOf && array.indexOf === _nativeIndexOf) return array.indexOf(item);
	for (; i < length; i++)
		if (array[i] === item) return i;
	return -1;
};

u.each = function(obj, iterator, context) {
	if (obj === null) return;
	if (_nativeForEach && obj.forEach === _nativeForEach) {
		obj.forEach(iterator, context);
	} else if (obj.length === +obj.length) {
		for (var i = 0, length = obj.length; i < length; i++) {
			if (iterator.call(context, obj[i], i, obj) === _breaker) return;
		}
	} else {
		var _keys = u.keys(obj);
		for (var index = 0; index < _keys.length; index++) {
			if (iterator.call(context, obj[_keys[index]], _keys[index], obj) === breaker) return;
		}
	}
};

u.extend = function(obj) {
	u.each(_slice.call(arguments, 1), function(source) {
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	});

	return obj;
};

function _only_once(func) {
	var called = false;
	return function() {
		if (called) return;

		called = true;
		if (func) func.apply(this, arguments);
	};
}

u.bind = function(func, context) {
	var args = _slice.call(arguments, 2);
	return function() {
		func.apply(context, args.concat(_slice.call(arguments)));
	};
};


u.delay = function(millies, func) {
	return function() {
		var args = arguments;
		setTimeout(function() {
			if (func) func.apply(this, args);
		}, millies);
	};
};

u.timeup = function(millies, func, onTimeup) {
	var STATUS_DOING = 'doing';
	var STATUS_DONE = 'done';
	var STATUS_TIMEOUT = 'timeout';
	var status = STATUS_DOING;

	setTimeout(function() {
		console.log("u.timeup onTimeup, status: ", status);
		if (status !== STATUS_DOING) {
			return;
		}

		status = STATUS_TIMEOUT;
		if (onTimeup) {
			onTimeup();
		}
	}, millies);

	return function() {
		console.log("u.timeup callback, status: ", status);
		if (status !== STATUS_DOING) {
			return;
		}

		status = STATUS_DONE;
		if (func) {
			func.apply(this, arguments);
		}
	}
};

console = window.console || {};
console.log = console.log || function() {};
console.error = console.error || function() {};


;

var cookie = function() {
	return cookie.get.apply(cookie, arguments);
};

cookie.utils = {

	// Is the given value an array? Use ES5 Array.isArray if it's available.
	isArray: Array.isArray || function(value) {
		return Object.prototype.toString.call(value) === '[object Array]';
	},

	// Is the given value a plain object / an object whose constructor is `Object`?
	isPlainObject: function(value) {
		return !!value && Object.prototype.toString.call(value) === '[object Object]';
	},

	// Convert an array-like object to an array – for example `arguments`.
	toArray: function(value) {
		return Array.prototype.slice.call(value);
	},

	// Get the keys of an object. Use ES5 Object.keys if it's available.
	getKeys: Object.keys || function(obj) {
		var keys = [],
			key = '';
		for (key in obj) {
			if (obj.hasOwnProperty(key)) keys.push(key);
		}
		return keys;
	},

	// Unlike JavaScript's built-in escape functions, this method
	// only escapes characters that are not allowed in cookies.
	escape: function(value) {
		return String(value).replace(/[,;"\\=\s%]/g, function(character) {
			return encodeURIComponent(character);
		});
	},

	// Return fallback if the value is not defined, otherwise return value.
	retrieve: function(value, fallback) {
		return value == null ? fallback : value;
	}

};

cookie.defaults = {};

cookie.expiresMultiplier = 60 * 60 * 24;

cookie.set = function(key, value, options) {

	if (cookie.utils.isPlainObject(key)) { // Then `key` contains an object with keys and values for cookies, `value` contains the options object.


		for (var k in key) { // TODO: `k` really sucks as a variable name, but I didn't come up with a better one yet.
			if (key.hasOwnProperty(k)) this.set(k, key[k], value);
		}

	} else {

		options = cookie.utils.isPlainObject(options) ? options : {
			expires: options
		};

		var expires = options.expires !== undefined ? options.expires : (this.defaults.expires || ''), // Empty string for session cookies.
			expiresType = typeof(expires);

		if (expiresType === 'string' && expires !== '') expires = new Date(expires);
		else if (expiresType === 'number') expires = new Date(+new Date + 1000 * this.expiresMultiplier * expires); // This is needed because IE does not support the `max-age` cookie attribute.

		if (expires !== '' && 'toGMTString' in expires) expires = ';expires=' + expires.toGMTString();

		var path = options.path || this.defaults.path; // TODO: Too much code for a simple feature.
		path = path ? ';path=' + path : '';

		var domain = options.domain || this.defaults.domain;
		domain = domain ? ';domain=' + domain : '';

		var secure = options.secure || this.defaults.secure ? ';secure' : '';

		document.cookie = cookie.utils.escape(key) + '=' + cookie.utils.escape(value) + expires + path + domain + secure;

	}

	return this; // Return the `cookie` object to make chaining possible.

};

// TODO: This is commented out, because I didn't come up with a better method name yet. Any ideas?
// cookie.setIfItDoesNotExist = function (key, value, options) {
//	if (this.get(key) === undefined) this.set.call(this, arguments);
// },

cookie.remove = function(keys) {

	keys = cookie.utils.isArray(keys) ? keys : cookie.utils.toArray(arguments);

	for (var i = 0, l = keys.length; i < l; i++) {
		this.set(keys[i], '', -1);
	}

	return this; // Return the `cookie` object to make chaining possible.
};

cookie.empty = function() {

	return this.remove(cookie.utils.getKeys(this.all()));

};

cookie.get = function(keys, fallback) {

	fallback = fallback || undefined;
	var cookies = this.all();

	if (cookie.utils.isArray(keys)) {

		var result = {};

		for (var i = 0, l = keys.length; i < l; i++) {
			var value = keys[i];
			result[value] = cookie.utils.retrieve(cookies[value], fallback);
		}

		return result;

	} else return cookie.utils.retrieve(cookies[keys], fallback);

};

cookie.all = function() {

	if (document.cookie === '') return {};

	var cookies = document.cookie.split('; '),
		result = {};

	for (var i = 0, l = cookies.length; i < l; i++) {
		var item = cookies[i].split('=');
		result[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
	}

	return result;

};

cookie.enabled = function() {

	if (navigator.cookieEnabled) return true;

	var ret = cookie.set('_', '_').get('_') === '_';
	cookie.remove('_');
	return ret;
};


;

// api
var api = {
	NOT_LOGIN: 'not-login',
	upload: function(params, callback) {
		$.get('/test/upload', params, "json").success(function(data) {
			if (data.status != 1) {
				callback('error');
			} else {
				callback(null, data.data);
			}
		}).error(function() {
			callback('network error');
		});
	},

	info: function(callback) {
		$.get('/test/info', "json").success(function(data) {
			if (data.status != 1) {
				callback('error');
			} else {
				callback(null, data.data);
			}
		}).error(function() {
			callback('network error');
		});
	},

	sync_score: function(params, callback) {
		function _upload(callback) {
			api.upload(params, function(err, data) {
				if (err) return callback(err);
				callback(null, data.gift);
			});
		}

		function _info(gift, callback) {
			api.info(function(err, user) {
				if (err) return callback(err);
				user.gift = gift;
				callback(null, user);
			});
		}

		async.waterfall([_upload, _info],
			//u.delay(5 * 1000,
			function(err, result) {
				if (err) return callback(err);
				callback(null, result);
			}
			//)
		);
	},

	login: function(callback) {
		setTimeout(function() {
			callback(null);
		}, 0);
	},

	userid: 0,

	isUserLogined: function() {
		return true;
		if (this.userid === 0) {
			this.userid = 1;
			return false;
		} else {
			return true;
		}
	}
};

;

// Timer
var _Timer = {
	INIT_FPS: 4
};

function Timer(tick) {
	this.fps = _Timer.INIT_FPS;
	this.tick = tick;
	this.paused = false;
}

Timer.prototype = {
	constructor: Timer,

	start: function() {
		this.paused = false;
		this.count();
	},

	count: function() {
		var self = this;
		setTimeout(function() {
			if (self.paused) return;

			self.tick();
			self.count();
		}, 1000 / this.fps);
	},

	pause: function() {
		this.paused = true;
	},

	speedUp: function() {
		if (this.fps < 60) this.fps++;
	}
};

;

// game

DIRECTION_LEFT = 'left';
DIRECTION_RIGHT = 'right';
DIRECTION_UP = 'up';
DIRECTION_DOWN = 'down';

var META = {
	foods: {
		food1: {
			key: "food1",
			name: 'food1'
		},
		food2: {
			key: "food2",
			name: 'food2'
		},
		food3: {
			key: "food3",
			name: 'food3'
		},
		food4: {
			key: "food4",
			name: 'food4'
		},
		food5: {
			key: "food5",
			name: 'food5'
		},
		food6: {
			key: "food6",
			name: 'food6'
		},
		food7: {
			key: "food7",
			name: 'food7'
		},
		food8: {
			key: "food8",
			name: 'food8'
		},
		food9: {
			key: "food9",
			name: 'food9'
		},
		food10: {
			key: "food10",
			name: 'food10'
		},
		food11: {
			key: "food11",
			name: 'food11'
		},
		food12: {
			key: "food12",
			name: 'food12'
		},
		food13: {
			key: "food13",
			name: 'food13'
		},
		food14: {
			key: "food14",
			name: 'food14'
		}
	}
};

var Fooder = {
	getFood: function() {
		var keyset = u.keys(META.foods);
		if (keyset.length === 0) return null;

		var index = Math.floor(Math.random() * keyset.length);
		return META.foods[keyset[index]];
	}
};


INVERSE_DIRECTION = {
	up: DIRECTION_DOWN,
	left: DIRECTION_RIGHT,
	right: DIRECTION_LEFT,
	down: DIRECTION_UP
};

function Snake(blocks, length) {
	this.blocks = blocks;

	this.direction = DIRECTION_LEFT;
	this.directionChanged = false;

	this.x = Math.ceil(this.blocks / 2);
	this.y = Math.ceil(this.blocks / 2);
	this.sections = [];
	for (var i = this.x + length - 1; i >= this.x; i--) {
		this.sections.push({
			x: i,
			y: this.y
		});
	}
}

Snake.prototype = {

	section: function(i) {
		var index = (this.sections.length + i) % this.sections.length;
		return this.sections[index];
	},

	length: function() {
		return this.sections.length;
	},

	changeDirection: function(direction) {
		if (this.directionChanged) return;

		if (direction === INVERSE_DIRECTION[this.direction]) return;

		this.direction = direction;
		this.directionChanged = true;
	},

	bumpSelf: function() {
		return this.onBody(this.x, this.y);
	},

	onBody: function(x, y) {
		for (var i = 0; i < this.sections.length; i++) {
			var section = this.sections[i];
			if (section.x === x && section.y === y) return true;
		}

		return false;
	},

	directionOfSection: function(i) {
		var len = this.sections.length;
		var index = (len + i) % len;
		var prev, section;
		if (index == len - 1) {
			prev = this.section(index);
			section = this.section(index - 1);
		} else {
			section = this.section(index);
			prev = this.section(index + 1);
		}

		var direction;
		if (prev.x === section.x) {
			if (prev.y === section.y - 1) {
				direction = DIRECTION_UP;
			} else {
				direction = DIRECTION_DOWN;
			}
		} else {
			if (prev.x === section.x - 1) {
				direction = DIRECTION_LEFT;
			} else {
				direction = DIRECTION_RIGHT;
			}
		}
		return direction;
	},

	move: function() {
		switch (this.direction) {
			case DIRECTION_UP:
				this.y--;
				break;
			case DIRECTION_DOWN:
				this.y++;
				break;
			case DIRECTION_LEFT:
				this.x--;
				break;
				//case DIRECTION_RIGHT:
			default:
				this.x++;
		}
	},
};

var _Game = {
	DEFAULT_SCORE: 10,
	triggerScoreChanged: function() {
		if (this.scoreListener) {
			this.scoreListener();
		}
	}
};

function Game(canvas) {
	if (!canvas) return;

	var self = this;
	this.canvas = canvas;
	this.context = this.canvas.getContext('2d');
	this.blocks = Game.BLOCKS;
	this.block_size = this.canvas.width / this.blocks;

	this.snake = new Snake(this.blocks, 5);
	this.foods = [];
	this.food = this.getFood();
	this.scoreListener = null;

	this.status = Game.INITIALIZED;
	this.failListener = null;

	this.timer = new Timer(function() {
		self.snake.move();
		if (self.isCollision()) {
			self.timer.pause();
			self.fail();
			return;
		}

		self.snake.directionChanged = false;
		if (self.snake.x == self.food.x && self.snake.y == self.food.y) {
			self.foods.push(self.food);
			if (self.foods.length % 5 === 0) self.timer.speedUp();

			_Game.triggerScoreChanged.call(self);
			self.snake.sections.push({
				x: self.snake.x,
				y: self.snake.y
			});

			var food = self.getFood();
			if (!food) return self.fail();
			self.food = food;
		} else {
			self.snake.sections.shift();
			self.snake.sections.push({
				x: self.snake.x,
				y: self.snake.y
			});
		}

		requestAnimationFrame(function() {
			self.draw();
		});
	});
}

u.extend(Game, {
	BLOCKS: 10,
	INITIALIZED: 'initialized',
	PLAYING: 'playing',
	PAUSED: 'paused',
	OVER: 'over'
});

Game.prototype = {
	contructor: Game,

	isInitialized: function() {
		return this.status === Game.INITIALIZED;
	},

	isOver: function() {
		return this.status === Game.OVER;
	},

	over: function() {
		this.status = Game.OVER;
	},

	start: function() {
		var self = this;
		if (this.status !== Game.INITIALIZED &&
			this.status !== Game.PAUSED) {
			console.error('wrong status');
			return;
		}

		this.status = Game.PLAYING;
		this.timer.start();
		requestAnimationFrame(function() {
			self.draw();
		});
	},

	pause: function() {
		this.timer.pause();
		this.status = Game.PAUSED;
	},

	fail: function() {
		this.status = Game.OVER;
		if (this.failListener) this.failListener();
	},

	onFailed: function(l) {
		this.failListener = l;
	},

	isCollision: function() {
		if (this.snake.x < 0 || this.snake.x >= this.blocks ||
			this.snake.y < 0 || this.snake.y >= this.blocks) return true;

		return this.snake.bumpSelf();
	},

	resetCanvas: function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},

	score: function() {
		var score = 0;
		u.each(this.foods, function(food) {
			score += food.score;
		});
		return score;
	},

	onScoreChanged: function(l) {
		this.scoreListener = l;
	},

	drawSnake: function() {
		this.drawSnakeHead();
		this.drawSnakeBody();
		this.drawSnakeTail();
	},

	drawImage: function(image, sprite, rect) {
		var ctx = this.context;
		ctx.drawImage(image, sprite.x, sprite.y, sprite.width, sprite.height,
			rect.x, rect.y, rect.width, rect.height);
	},

	drawSnakeBody: function() {
		for (var i = 1; i < this.snake.length() - 1; i++) {
			var section = this.snake.section(i);
			this.drawImage(snakeImage, snakeSprites["animal_body_nian"], this.getRect(section));
		}
	},

	drawSnakeTail: function(section) {
		var tail = this.snake.section(0),
			direction = this.snake.directionOfSection(0),
			sprite = snakeSprites["animal_tail_" + direction];
		this.drawImage(snakeImage, sprite, this.getRect(tail));
	},

	drawSnakeHead: function() {
		var head = this.snake.section(-1),
			direction = this.snake.directionOfSection(-1),
			sprite = snakeSprites["animal_head_" + direction];
		this.drawImage(snakeImage, sprite, this.getRect(head));
	},

	getRect: function(section) {
		return {
			x: section.x * this.block_size,
			y: section.y * this.block_size,
			width: this.block_size,
			height: this.block_size
		};
	},

	drawFood: function() {
		var sprite = foodSprites[this.food.key];
		var rect = this.getRect(this.food);
		this.drawImage(foodImage, sprite, rect);
	},

	draw: function() {
		this.resetCanvas();
		this.drawSnake();
		this.drawFood();
	},

	changeSnakeDirection: function(direction) {
		this.snake.changeDirection(direction);
	},

	getFood: function() {
		if (this.snake.sections.length === this.blocks * this.blocks) return null;

		var _food = Fooder.getFood();
		var pos = this.getNewFoodPosition();
		return u.extend({}, _food, pos, {
			score: _food.score || _Game.DEFAULT_SCORE
		});
	},

	getNewFoodPosition: function() {
		var pos = {};
		do {
			pos.x = Math.floor(Math.random() * this.blocks);
			pos.y = Math.floor(Math.random() * this.blocks);
		} while (this.snake.onBody(pos.x, pos.y));

		return pos;
	}
};

;


var DIRECTION_KEYCODES = {
    up: [38, 75, 87],
    down: [40, 74, 83],
    left: [37, 65, 72],
    right: [39, 68, 76],
};

function getDirectionByKeyCode(keyCode) {
    for (var key in DIRECTION_KEYCODES) {
        var codelist = DIRECTION_KEYCODES[key];
        if (~u.indexOf(codelist, keyCode)) {
            return key;
        }
    }

    return null;
}

function Modal(el) {
    this.el = el;
    this.$el = $(el);
}

Modal.prototype = {
    show: function() {
        this.$el.removeClass("hide");
    },

    hide: function() {
        this.$el.addClass("hide");
    }
};

function GameOverPane(el) {
    var self = this;
    this.el = el;
    this.$el = $(el);
    this.$el.find('.restart').click(function() {
        if (self.onRestartHandler) {
            self.onRestartHandler();
        }
    });
}

GameOverPane.prototype = {
    constructor: GameOverPane,

    showGift: function() {
        this.$el.find(".courage-section").removeClass('hide');
    },

    setScore: function(score) {
        this.$el.find(".score").html(score);
        if (score > 50) {
            this.$el.find(".tip-section .tips").html("<p>你竟然得了</p>" +
                "<p><span class='score'>" + score + "</span>分</p>" +
                "<p>年兽好满足，</p>" +
                "<p>暂时不会再来了！</p>");
            this.$el.find(".nian-mood").removeClass('nian-sad').addClass('nian-happy');
        } else {
            this.$el.find(".tip-section .tips").html("<p>你才得了</p>" +
                "<p><span class='score'>" + score + "</span>分</p>" +
                "<p>年兽还没吃饱，</p>" +
                "<p>还有可能出没哦！</p>" + 
                "<p>继续加油吧！</p>");
            this.$el.find(".nian-mood").removeClass('nian-happy').addClass('nian-sad');
        }
    },

    hideGift: function() {
        this.$el.find(".courage-section").addClass('hide');
    },

    onRestart: function(handler) {
        this.onRestartHandler = handler;
    },

    show: function() {
        this.$el.removeClass("hide");
    },

    hide: function() {
        this.$el.addClass("hide");
    }
};

var _Controller = {
    setupKeyBindings: function() {
        var self = this;

        function while_playing(func) {
            return function() {
                if (self.game.status !== Game.PLAYING) return;
                if (func) func.apply(this, arguments);
            };
        }

        $(document).on("keydown", while_playing(function(e) {
            e.preventDefault();
            var direction = getDirectionByKeyCode(e.keyCode);
            if (direction) self.game.changeSnakeDirection(direction);
        }));

        var hammer = $(document).hammer();

        hammer.on('touchmove', while_playing(function(e) {
            e.preventDefault();
        })).on("swipeup, dragup", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('up');
        })).on("swipedow dragdown", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('down');
        })).on("swipeleft dragleft", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('left');
        })).on("swiperight dragright", while_playing(function(e) {
            e.preventDefault();
            self.game.changeSnakeDirection('right');
        }));
    },

    onScoreChanged: function() {
        this.currentScoreEl.innerHTML = this.game.score();
    },

    onUploadScoreFailed: function() {
        var self = this;
        console.error('failed to upload score');
        this.errorPane.show();
        setTimeout(function() {
            self.errorPane.hide();
            self.$overlay.hide();
        }, 2 * 1000);
    },

    onScoreUploaded: function(user) {
        this.showTotalScore(user.score);
        if (user.gift) {
            this.gameoverPane.showGift();
        } else {
            this.gameoverPane.hideGift();
        }
        this.gameoverPane.setScore(this.game.score());
        this.gameoverPane.show();
    },

    onUploadScoreTimeout: function() {
        _Controller.onUploadScoreFailed.call(this);
    },

    onGameFailed: function() {
        var self = this;
        $(this.controlButton).removeClass('pause');
        this.game.over();

        function _hide(func) {
            return function() {
                self.loadingPane.hide();
                if (func) {
                    func.apply(null, arguments);
                }
            }
        }

        this.$overlay.show();
        this.loadingPane.show();
        api.sync_score({
                score: this.game.score()
            },
            //u.delay(5 * 1000,
            u.timeup(10 * 1000,
                _hide(function(err, data) {
                    if (err) {
                        _Controller.onUploadScoreFailed.call(self);
                    } else {
                        _Controller.onScoreUploaded.call(self, data);
                    }
                }), _hide(u.bind(_Controller.onUploadScoreTimeout, this))
            )
            //)
        );
    },

    newGame: function() {
        this.game = new Game(this.canvas);
        this.game.onScoreChanged(u.bind(_Controller.onScoreChanged, this));
        this.game.onFailed(u.bind(_Controller.onGameFailed, this));
    },

    kickOff: function() {
        this.currentScoreEl.innerHTML = 0;
        this.rounds++;
    },

    //start or resume
    resume: function() {
        this.game.start();
        $(this.controlButton).addClass('pause');
    },

    pause: function() {
        this.game.pause();
        $(this.controlButton).removeClass('pause');
    },

    startGame: function() {
        _Controller.newGame.call(this);
        _Controller.kickOff.call(this);
        _Controller.resume.call(this);
    }
};

function Controller() {
    this.rounds = 0;
    this.user = null;
}

Controller.prototype = {

    onload: function(canvas) {

        var self = this;

        var $loadingPanel = $(".snake-loading-pane");
        $loadingPanel.find("h1").hide();
        if (!api.isUserLogined()) {
            $loadingPanel.find("button").show().click(function() {
                // TODO
            });
            return;
        }

        $loadingPanel.find("button").show().click(function() {
            $loadingPanel.hide();
            if (cookie.get('snake_played') !== 'true') {
                self.$rules.show();
            } else {
                _Controller.startGame.call(self);
            }
        });

        this.canvas = canvas;
        //_Controller.newGame.call(this);
        this.$overlay = $(".snake-modal-overlay");
        this.loadingPane = new Modal($(".snake-modal-wrap.loading")[0]);
        this.errorPane = new Modal($(".snake-modal-wrap.error")[0]);
        this.gameoverPane = new GameOverPane($(".gameover")[0]);
        this.gameoverPane.onRestart(function() {
            self.$overlay.hide();
            self.gameoverPane.hide();
            _Controller.startGame.call(self);
        });

        this.$rules = $('.snake-container-wrap .rules');
        this.$rules.on('click', 'button', function() {
            cookie.set('snake_played', 'true', {
                expires: 14
            });
            self.$rules.hide();
            _Controller.startGame.call(self);
        });

        this.currentScoreEl = document.getElementById('current-score');
        this.totalScoreEl = document.getElementById('total-score');
        this.controlButton = document.getElementById('control');
        this.controlButton.onclick = function() {
            if (!self.game) {
                return _Controller.startGame.call(self);
            }

            switch (self.game.status) {
                case Game.OVER:
                    _Controller.startGame.call(self);
                    break;
                case Game.PAUSED:
                    _Controller.resume.call(self);
                    break;
                case Game.PLAYING:
                    _Controller.pause.call(self);
                    break;
                default:
                    console.error('invlaid status', self.game.status);
            }
        };
        _Controller.setupKeyBindings.call(this);

        api.info(function(err, data) {
            if (self.rounds > 1 || (self.game && self.game.isOver())) {
                return;
            }

            if (err) {
                return console.error(err);
            }

            self.user = data;
            self.showTotalScore(self.user.score);
        });
    },

    showTotalScore: function(totalScore) {
        this.totalScoreEl.innerHTML = totalScore;
    }
};

var foodImage = null;
var foodSprites = null;
var snakeImage = null;
var snakeSprites = null;

function loadSpriteImages(callback) {
    var images = ["images/snake.png", "images/foods.png"];
    async.each(images, function(item, cb) {
        var image = new Image();
        image.onload = function() {
            if (item === "images/snake.png") {
                snakeImage = image;
            } else if (item == "images/foods.png") {
                foodImage = image;
            }
            cb(null, image);
        };

        image.onerror = function() {
            cb('fail to load image:' + item);
        };

        image.src = item;
    }, function(err, results) {
        if (err) {
            return callback(err);
        }

        callback(null, results);
    });
}

function loadSpriteMeta(callback) {
    async.each(["json/snake.json", "json/foods.json"], function(item, cb) {
        $.get(item, "json").success(function(sprites) {
            if (item === "json/snake.json") {
                snakeSprites = sprites;
            } else {
                foodSprites = sprites;
            }
            cb(null, sprites);
        }).error(function() {
            cb('fail to load sprites: ' + item);
        });
    }, function(err, results) {
        if (err) {
            return callback(err);
        }

        callback(null, results);
    });
}


var controller = new Controller();

$(function() {
    canvas = document.getElementById("snake");
    if (!canvas.getContext) {
        G_vmlCanvasManager.initElement(canvas);
    }

    function loadResImages(callback) {
        var src = "images/resources.png";
        var image = new Image();
        image.onload = function() {
            callback(null, image);
        };

        image.onerror = function() {
            callback('fail to load image:' + src);
        };

        image.src = src;
    }

    async.parallel([loadSpriteImages, loadSpriteMeta, loadResImages],
        //u.delay(2 * 1000,
        function(err) {
            if (err) {
                return conosle.error(err);
            }

            controller.onload(canvas);
        }
        //)
    );
});

;

})();
