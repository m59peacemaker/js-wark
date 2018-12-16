import test from 'zora';
import { Stream, combine } from './';
var doubleFn = function (_a) {
    var x = _a[0];
    return x.get() * 2;
};
test('combine', function (t) {
    t.test('computeFn is passed an array of dependencies', function (t) {
        var a$;
        var b$;
        combine(function (_a) {
            var a = _a[0], b = _a[1];
            a$ = a;
            b$ = b;
        })([Stream(4), Stream(3)]);
        t.equal(a$.get(), 4);
        t.equal(b$.get(), 3);
    });
    t.test('basic combine', function (t) {
        var a = Stream();
        var b = combine(function (_a) {
            var x = _a[0];
            return x.get() + 1;
        })([a]);
        t.equal(b.get(), undefined);
        a.set(1);
        t.equal(b.get(), 2);
    });
    t.test('computeFn is called immediately if dependencies are initialized', function (t) {
        var result = 0;
        combine(function () { return ++result; })([Stream(0)]);
        t.equal(result, 1);
    });
    t.test('computeFn is not called immediately if dependencies are not initialized', function (t) {
        var result = 0;
        combine(function () { return ++result; })([Stream(0), Stream()]);
        t.equal(result, 0);
    });
    t.test('stream is initially computed when dependencies are initialized', function (t) {
        var a = Stream(1);
        var b = Stream(2);
        var c = combine(function (_a) {
            var a = _a[0], b = _a[1];
            return a.get() + b.get();
        })([a, b]);
        t.ok(a.initialized);
        t.ok(b.initialized);
        t.ok(c.initialized);
        t.equal(c.get(), 3);
    });
    t.test('stream is not initially computed if any dependencies are not initialized', function (t) {
        var a = Stream(1);
        var b = Stream();
        var c = combine(function (_a) {
            var a = _a[0], b = _a[1];
            return a.get() + b.get();
        })([a, b]);
        t.ok(a.initialized);
        t.notOk(b.initialized);
        t.notOk(c.initialized);
        t.equal(c.get(), undefined);
    });
    t.test('stream recomputes when dependency changes', function (t) {
        var a = Stream(1);
        var b = Stream(2);
        var c = combine(function (_a) {
            var a = _a[0], b = _a[1];
            return a.get() + b.get();
        })([a, b]);
        t.equal(c.get(), 3);
        a.set(20);
        t.equal(c.get(), 22);
    });
    t.test('one source change leads to one graph - updates are atomic', function (t) {
        var dUpdateCount = 0;
        var a = Stream(1);
        var b = combine(function (_a) {
            var a = _a[0];
            return a.get() + 1;
        })([a]);
        var c = combine(function (_a) {
            var a = _a[0];
            return a.get() + 10;
        })([a]);
        var d = combine(function (_a) {
            var b = _a[0], c = _a[1];
            ++dUpdateCount;
            return b.get() + c.get();
        })([b, c]);
        t.equal(a.get(), 1);
        t.equal(b.get(), 2);
        t.equal(c.get(), 11);
        t.equal(d.get(), 13);
        t.equal(dUpdateCount, 1);
        a.set(2);
        t.equal(b.get(), 3);
        t.equal(c.get(), 12);
        t.equal(d.get(), 15);
        t.equal(dUpdateCount, 2, 'a updated, so b and c updated, and d that depends on b and c updated only once');
    });
    t.test('creating and combining streams inside of a stream body', function (t) {
        var n = Stream(1);
        var nPlus = combine(function (_a) {
            var n = _a[0];
            return n.get() + 100;
        })([n]);
        t.equal(nPlus.get(), 101);
        combine(function () {
            var n = Stream(1);
            var nPlus = combine(function (_a) {
                var n = _a[0];
                return n.get() + 100;
            })([n]);
            t.equal(nPlus.get(), 101);
        })([Stream(1)]);
    });
    t.test('setting another stream within computeFn', function (t) {
        var x = Stream(4);
        var y = Stream(3);
        var z = Stream(1);
        var doubleX = combine(doubleFn)([x]);
        var setAndSum = combine(function (_a) {
            var y = _a[0], z = _a[1];
            x.set(3);
            return z.get() + y.get();
        })([y, z]);
        z.set(4);
        t.equal(setAndSum.get(), 7);
        t.equal(doubleX.get(), 6);
    });
    t.test('setting dependency within computeFn', function (t) {
        var bCount = 0;
        var cCount = 0;
        var a = Stream();
        var b = combine(function (_a) {
            var a = _a[0];
            ++bCount;
            if (a.get() === 10) {
                a.set(11);
            }
            return a.get() + 2;
        })([a]);
        var c = combine(function () {
            ++cCount;
        })([b]);
        t.equal(bCount, 0);
        t.equal(cCount, 0);
        a.set(10);
        t.equal(b.get(), 13);
        t.equal(bCount, 2, '"b" called twice');
        t.equal(cCount, 2, '"c" called twice');
    });
    // flyd says this should be [ 1, 2 ], but I don't see that as a good thing
    // commented out lines show the comparison to flyd
    // t.test('executes to the end before handlers are triggered', t => {
    t.test('execution order when setting another stream in a computeFn', function (t) {
        var order = [];
        var x = Stream(4);
        var y = Stream(3);
        var z = combine(function (_a) {
            var x = _a[0];
            if (x.get() === 3) {
                order.push(2); // executes when x.set(3) in the next combine
            }
            return x.get() * 2;
        })([x]);
        t.equal(z.get(), 8);
        combine(function (_a) {
            var y = _a[0];
            x.set(3); // triggers combine function above, flyd says it should wait
            order.push(1);
        })([y]);
        // t.deepEqual(order, [ 1, 2 ])
        t.deepEqual(order, [2, 1]);
    });
    // TODO:
    return;
    t.test('combining end streams', function (t) {
        var a = Stream();
        var b = Stream();
        var c = combine(function (_a) {
            var aEnd = _a[0], bEnd = _a[1];
            return 123;
        })([a.end, b.end]);
        endsOn([c])(c);
        t.equal(c.get(), undefined);
        t["false"](c.end.get());
        a.end();
        t.equal(c.get(), undefined);
        t["false"](c.end.get());
        b.end();
        t.equal(c.get(), 123);
        t["true"](c.end.get());
    });
});
