import test from 'zora';
import { sortGraph } from './Propagator';
var toLabels = function (streams) { return streams.map(function (stream) { return stream.label; }); };
test('sortGraph', function (t) {
    var d = {
        label: 'd',
        getDependants: function () { return []; }
    };
    var c = {
        label: 'c',
        getDependants: function () { return [d]; }
    };
    var b = {
        label: 'b',
        getDependants: function () { return [d]; }
    };
    var a = {
        label: 'a',
        getDependants: function () { return [b, c]; }
    };
    var sortedGraph = sortGraph(a);
    // make sure it's has the correct nodes
    t.deepEqual(toLabels(sortedGraph).sort(), ['b', 'c', 'd']);
    // make sure dependencies come before dependants
    t.ok(sortedGraph.indexOf(b) < sortedGraph.indexOf(d));
    t.ok(sortedGraph.indexOf(c) < sortedGraph.indexOf(d));
});
