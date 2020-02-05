import * as Emitter from '../Emitter';
import { noop, identity, pipe, add, isPromise } from '../utils';
/* observable contract:
    emits pendingChange (when its change is pending, which is when any of its dependencies emit pendingChange)
    maybe emits changeOpportunity (when all dependencies resolved, if dependencies have changed since pending)
        maybe emits the change (if the change occurred)
    and then emits pendingChangeResolution
*/
var create = function (initialValue) {
    var value = initialValue;
    var observable = Emitter.create();
    var emitters = {
        changeOpportunity: Emitter.create(),
        pendingChange: Emitter.create(),
        pendingChangeResolution: Emitter.create()
    };
    var get = function () { return value; };
    var change = function (newValue) {
        value = newValue;
        observable.emit(value);
    };
    var observe = function (observerFn) {
        observerFn(get());
        return observable.subscribe(observerFn);
    };
    var unsubscribeFromDependencies = noop;
    var stopDepending = function () { return unsubscribeFromDependencies(); };
    var dependOn = function (dependencies) {
        stopDepending();
        var dependencyChange = Emitter.combine(dependencies);
        var dependencyPendingChange = Emitter.combine(dependencies.map(function (dependency) { return dependency.emitters.pendingChange; }));
        var dependencyPendingChangeResolution = Emitter.combine(dependencies.map(function (dependency) { return dependency.emitters.pendingChangeResolution; }));
        var pendingChangeCount = Emitter.scan(add)(0)(Emitter.combine([
            Emitter.constant(1)(dependencyPendingChange),
            Emitter.constant(-1)(dependencyPendingChangeResolution)
        ]));
        var allDependenciesResolved = Emitter.filter(function (value) { return value === 0; })(pendingChangeCount);
        var canChange = Emitter.filter(function (dependencyChanges) { return dependencyChanges.length > 0; })(Emitter.bufferTo(allDependenciesResolved)(dependencyChange));
        unsubscribeFromDependencies = pipe([
            Emitter.map(emitters.pendingChange.emit)(dependencyPendingChange),
            Emitter.map(function () {
                emitters.changeOpportunity.emit(change);
                emitters.pendingChangeResolution.emit();
            })(canChange)
        ]);
        return observable;
    };
    Object.assign(observable, {
        observe: observe,
        get: get,
        emitters: emitters,
        dependOn: dependOn
    });
    return observable;
};
var observablizeEmitter = function (emitter) {
    var observablized = Emitter.from(emitter);
    return Object.assign(observablized, {
        get: noop,
        observe: observablized.subscribe,
        emitters: {
            changeOpportunity: observablized,
            pendingChange: observablized,
            pendingChangeResolution: observablized
        }
    });
};
var fromEmitter = function (initialValue) { return function (source) {
    var o = create(initialValue).dependOn([observablizeEmitter(source)]);
    var value;
    source.subscribe(function (newValue) { return value = newValue; });
    o.emitters.changeOpportunity.subscribe(function (change) { return change(value); });
    return o;
}; };
var fromObservable = function (initialValue) { return function (source) { return create(initialValue).dependOn([source]); }; };
var fromPromise = function (initialValue) { return function (promise) { return fromEmitter(initialValue)(Emitter.fromPromise(promise)); }; };
var from = function (initialValue) { return function (source) {
    return (Emitter.isEmitter(source)
        ? fromEmitter
        : isPromise(source)
            ? fromPromise
            : fromObservable)(initialValue)(source);
}; };
var of = function (value) { return create({ initialValue: value }); };
var constant = of;
var filter = function (predicate) { return function (source) {
    var filtered = fromObservable(source.get())(source);
    filtered.emitters.changeOpportunity.subscribe(function (change) {
        if (predicate(source.get())) {
            change(source.get());
        }
    });
    return filtered;
}; };
var lift = function (fn) { return function (observables) {
    var getValue = function () { return fn.apply(void 0, observables.map(function (o) { return o.get(); })); };
    var observable = create(getValue()).dependOn(observables);
    observable.emitters.changeOpportunity.subscribe(function (change) { return change(getValue()); });
    return observable;
}; };
var lift2 = function (fn) { return function (a) { return function (b) { return lift(fn)([a, b]); }; }; };
var lift3 = function (fn) { return function (a) { return function (b) { return function (c) { return lift(fn)([a, b, c]); }; }; }; };
var map = function (fn) { return function (observable) { return lift(fn)([observable]); }; };
var ap = function (observableOfFn) { return function (observable) { return lift(identity)([observableOfFn, observable]); }; };
var get = function (observable) { return observable.get(); };
var flatten = function (source) {
    var getValue = source.get().get();
    var observable = of(getValue());
    var dependencyEmitter = Emitter.scan(function (v) { return function (acc) { return acc.concat(v); }; })([source])(source);
    map(observable.dependOn)(dependencyEmitter);
    observable.emitters.changeOpportunity.subscribe(function (change) { return change(getValue()); });
    return observable;
};
var switchTo = function (source) {
    var getValue = source.get().get();
    var observable = of(getValue());
    var dependencyEmitter = Emitter.scan(function (v) { return function (acc) { return [source, v]; }; })([source])(source);
    map(observable.dependOn)(dependencyEmitter);
    observable.emitters.changeOpportunity.subscribe(function (change) { return change(getValue()); });
    return observable;
};
var flatMap = function (source) { return flatten(map(source)); };
var chain = flatMap;
var switchMap = function (source) { return switchTo(map(source)); };
export { ap, chain, create, filter, flatMap, flatten, from, fromObservable, fromPromise, fromEmitter, lift, lift2, lift3, map, of, switchMap, switchTo };
