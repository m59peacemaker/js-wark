import test from 'tape';
import * as Emitter from './';
test('Emitter.create can emit/subscribe', function (t) {
    t.plan(2);
    var emitter = Emitter.create();
    emitter.subscribe(function (v) { return t.equal(v, 123); });
    t.equal(t.assertCount, 0);
    emitter.emit(123);
});
test('emitter.subscribe returns unsubscribe that unsubscribes', function (t) {
    t.plan(1);
    var emitter = Emitter.create();
    var unsubscribe = emitter.subscribe(function (v) { return t.equal(v, 123); });
    emitter.emit(123);
    unsubscribe();
    emitter.emit(456);
});
test('emitter.unsubscribeAll unsubscribes all', function (t) {
    t.plan(2);
    var emitter = Emitter.create();
    emitter.subscribe(function (v) { return t.equal(v, 123); });
    emitter.subscribe(function (v) { return t.equal(v, 123); });
    emitter.emit(123);
    emitter.unsubscribeAll();
    emitter.emit(456);
});
test('emitter() can be used to emit', function (t) {
    t.plan(1);
    var emitter = Emitter.create();
    emitter.subscribe(function (v) { return t.equal(v, 123); });
    emitter(123);
});
test('Emitter.map emits with mapped value', function (t) {
    var expected = [4, 9];
    t.plan(expected.length);
    var n = Emitter.create();
    var nSquared = Emitter.map(function (n) { return n * n; })(n);
    nSquared.subscribe(function (value) { return t.equal(value, expected.shift()); });
    n.emit(2);
    n.emit(3);
});
test('Emitter.alt makes an emitter that emits when either given emitter emits', function (t) {
    var expected = ['foo', 'bar'];
    t.plan(expected.length);
    var a = Emitter.create();
    var b = Emitter.create();
    var c = Emitter.alt(a)(b);
    c.subscribe(function (value) { return t.equal(value, expected.shift()); });
    b.emit('foo');
    a.emit('bar');
});
test('Emitter.combine makes an emitter that emits when any of the given emitters emit', function (t) {
    var expected = ['foo', 'bar', 'baz', 'qux'];
    t.plan(expected.length);
    var a = Emitter.create();
    var b = Emitter.create();
    var c = Emitter.create();
    var d = Emitter.combine([a, b, c]);
    d.subscribe(function (value) { return t.equal(value, expected.shift()); });
    b.emit('foo');
    a.emit('bar');
    c.emit('baz');
    a.emit('qux');
});
test('Emitter.combine returns new emitter even if given only one emitter', function (t) {
    var a = Emitter.create();
    var d = Emitter.combine([a]);
    t["false"](Object.is(a, d));
    t.end();
});
test('Emitter.combine returns new emitter even if given empty array', function (t) {
    var expected = [123];
    t.plan(expected.length);
    var d = Emitter.combine([]);
    d.subscribe(function (value) { return t.equal(value, expected.shift()); });
    d.emit(123);
});
test('Emitter.filter makes an emitter that emits when then given emitter emits with a value passing the given predicate', function (t) {
    var expected = ['foo', 'bar'];
    t.plan(expected.length);
    var word = Emitter.create();
    var shortWord = Emitter.filter(function (v) { return v.length <= 3; })(word);
    shortWord.subscribe(function (value) { return t.equal(value, expected.shift()); });
    word.emit('things');
    word.emit('stuff');
    word.emit('foo');
    word.emit('whatever');
    word.emit('bar');
});
test('Emitter.flatten makes an emitter that emits when emitters emited from the given emitter (inner emitters) emit', function (t) {
    var expected = ['foo', 'bar', 'baz', 'qux', 'fooz', 'fooz'];
    t.plan(expected.length);
    var emitterEmitter = Emitter.create();
    var a = Emitter.create();
    var b = Emitter.create();
    var flattenedEmitter = Emitter.flatten(emitterEmitter);
    flattenedEmitter.subscribe(function (value) { return t.equal(value, expected.shift()); });
    emitterEmitter.emit(a);
    a.emit('foo');
    emitterEmitter.emit(b);
    a.emit('bar');
    b.emit('baz');
    a.emit('qux');
    emitterEmitter.emit(a);
    a.emit('fooz');
});
test('Emitter.chain maps and flattens', function (t) {
    var expected = ['foo', 'bar', 'baz', 'qux', 'fooz', 'fooz'];
    t.plan(expected.length);
    var emitterNameEmitter = Emitter.create();
    var a = Emitter.create();
    var b = Emitter.create();
    var emitters = { a: a, b: b };
    var flattenedEmitter = Emitter.chain(function (name) { return emitters[name]; })(emitterNameEmitter);
    flattenedEmitter.subscribe(function (value) { return t.equal(value, expected.shift()); });
    emitterNameEmitter.emit('a');
    a.emit('foo');
    emitterNameEmitter.emit('b');
    a.emit('bar');
    b.emit('baz');
    a.emit('qux');
    emitterNameEmitter.emit('a');
    a.emit('fooz');
});
test('Emitter.scan accumulates', function (t) {
    var expected = [
        [1],
        [1, 2],
        [1, 2, 3]
    ];
    t.plan(expected.length);
    var a = Emitter.create();
    var b = Emitter.scan(function (v) { return function (acc) { return acc.concat(v); }; })([])(a);
    b.subscribe(function (value) { return t.deepEqual(value, expected.shift()); });
    a.emit(1);
    a.emit(2);
    a.emit(3);
});
