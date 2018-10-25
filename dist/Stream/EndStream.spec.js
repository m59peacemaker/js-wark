import test from 'zora';
import EndStream from './EndStream';
test('EndStream', function (t) {
    t.test('value is initially false', function (t) {
        t.equal(EndStream().get(), false);
    });
    t.test('value is always set to true with endStream.set(arg)', function (t) {
        var endStream = EndStream();
        endStream.set(123);
        t.equal(endStream.get(), true);
    });
    t.test('value is always set to true with endStream.set()', function (t) {
        var endStream = EndStream();
        endStream.set();
        t.equal(endStream.get(), true);
    });
    t.test('value is always set to true with endStream(arg)', function (t) {
        var endStream = EndStream();
        endStream(123);
        t.equal(endStream.get(), true);
    });
    t.test('value is always set to true with endStream()', function (t) {
        var endStream = EndStream();
        endStream();
        t.equal(endStream.get(), true);
    });
    t.test('endStream.end is a self reference', function (t) {
        var endStream = EndStream();
        t.ok(Object.is(endStream, endStream.end));
    });
    t.test('throws if set after ended', function (t) {
        var endStream = EndStream();
        endStream();
        t.throws(endStream.set);
    });
    t.test('toStringTag', function (t) {
        var endStream = EndStream();
        t.equal(Object.prototype.toString.call(endStream), '[object WarkEndStream]');
    });
    t.test('toString', function (t) {
        var endStream = EndStream();
        t.equal(endStream.toString(), 'WarkEndStream(false)');
    });
    t.test('toJSON', function (t) {
        var endStream = EndStream();
        t.equal(JSON.stringify({ foo: endStream }), "{\"foo\":false}");
    });
});
