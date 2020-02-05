var noop = function () { return; };
var identity = function (v) { return v; };
var pipe = function (fns) { return fns.reduce(function (acc, fn) { return function (v) { return acc(fn(v)); }; }); };
var add = function (a) { return function (b) { return a + b; }; };
var isPromise = function (v) { return typeof v.then === 'function'; };
export { noop, identity, pipe, add, isPromise };
