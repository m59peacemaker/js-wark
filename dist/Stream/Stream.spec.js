import test from 'zora';
import Stream from './Stream';
test('Stream', function (t) {
    t.test('new stream is not initialized', function (t) {
        var stream = Stream();
        t.equal(stream.initialized, false);
    });
    t.test('stream is initialized after calling set()', function (t) {
        var stream = Stream();
        stream.set();
        t.equal(stream.initialized, true);
    });
    t.test('stream.get() returns initialValue', function (t) {
        var n = Stream(0);
        t.equal(n.get(), 0);
    });
    t.test('stream.set() updates value', function (t) {
        var n = Stream(0);
        n.set(10);
        t.equal(n.get(), 10);
        n.set(30);
        t.equal(n.get(), 30);
        n.set(undefined);
        t.equal(n.get(), undefined);
        n.set(null);
        t.equal(n.get(), null);
        n.set(false);
        t.equal(n.get(), false);
    });
    // TODO: not sure I will keep the emitting stuff
    /* t.test('emits "set" when set', t => { */
    /*   const stream = Stream(0) */
    /* let total = 0 */
    /*   stream.on('set', v => total += v) */
    /*   stream.set(74) */
    /* stream.set(6) */
    /* t.equal(total, 80) */
    /* }) */
    t.test('throws if set after ended', function (t) {
        var stream = Stream();
        stream.end();
        t.throws(stream);
        t.throws(stream.set);
    });
});
