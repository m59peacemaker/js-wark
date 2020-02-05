import { noop, identity } from '../utils';
var IncrementalIndex = function () {
    var nextIndex = 0;
    return {
        next: function () { return nextIndex++; },
        reset: function () { return nextIndex = 0; }
    };
};
var create = function () {
    var subscribers = new Map();
    var subscriberIds = IncrementalIndex();
    function emitter(value) { return emit(value); }
    var emit = function (value) { return Array.from(subscribers.values()).forEach(function (subscriber) { return subscriber(value); }); };
    var subscribe = function (subscriber) {
        var subscriberId = subscriberIds.next();
        subscribers.set(subscriberId, subscriber);
        return function () { return subscribers["delete"](subscriberId); };
    };
    var unsubscribeAll = function () {
        subscribers.clear();
        subscriberIds.reset();
    };
    return Object.assign(emitter, {
        emit: emit,
        subscribe: subscribe,
        unsubscribeAll: unsubscribeAll
    });
};
var of = create;
var map = function (fn) { return function (emitter) {
    var mappedEmitter = create();
    emitter.subscribe(function (value) { return mappedEmitter.emit(fn(value)); });
    return mappedEmitter;
}; };
var from = map(identity);
var scan = function (reducer) { return function (initialValue) { return function (emitter) {
    var acc = initialValue;
    return map(function (value) {
        acc = reducer(value)(acc);
        return acc;
    })(emitter);
}; }; };
var flatten = function (emitter) {
    var flattenedEmitter = create();
    map(function (value) { return value.subscribe(flattenedEmitter.emit); })(emitter);
    return flattenedEmitter;
};
var flatMap = function (fn) { return function (emitter) { return flatten(map(fn)(emitter)); }; };
var chain = flatMap;
var filter = function (predicate) { return function (emitter) {
    var filteredEmitter = create();
    map(function (value) {
        if (predicate(value)) {
            filteredEmitter.emit(value);
        }
    })(emitter);
    return filteredEmitter;
}; };
var alt = function (a) { return function (b) {
    var emitter = create();
    [a, b].map(function (e) { return e.subscribe(emitter.emit); });
    return emitter;
}; };
var combine = function (emitters) { return emitters.reduce(function (acc, emitter) { return alt(acc)(emitter); }, create(), create()); };
var fromPromise = function (promise) {
    var emitter = create();
    promise.then(emitter.emit);
    return emitter;
};
var switchTo = function (emitter) {
    var switchingEmitter = create();
    var unsubscribe = noop;
    map(function (value) {
        unsubscribe();
        unsubscribe = value.subscribe(switchingEmitter.emit);
    })(emitter);
    return switchingEmitter;
};
var switchMap = function (fn) { return function (emitter) { return switchTo(map(fn)(emitter)); }; };
var constant = function (v) { return map(function (_) { return v; }); };
var bufferTo = function (notifier) { return function (source) {
    var bufferedValues = [];
    map(function (v) { return bufferedValues.push(v); })(source);
    return map(function () {
        var values = bufferedValues.slice();
        bufferedValues = [];
        return values;
    })(notifier);
}; };
var bufferN = function (n) { return function (startEvery) { return function (source) {
    var maxBufferLength = Math.max(n, startEvery);
    return filter(function (buffer) { return buffer.length === n; })(scan(function (v) { return function (buffer) {
        buffer = buffer.length === maxBufferLength
            ? buffer.slice(startEvery)
            : buffer;
        return buffer.concat([v]);
    }; })([])(source));
}; }; };
var pairwise = bufferN(2)(1);
export { alt, chain, combine, constant, create, filter, flatMap, flatten, from, fromPromise, map, scan, switchMap, switchTo, bufferN, bufferTo, pairwise };
