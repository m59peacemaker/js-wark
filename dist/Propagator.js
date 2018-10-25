import depthFirstTopologicalSort from './depth-first-topological-sort';
var flatMap = function (fn) { return function (array) { return array.reduce(function (acc, x) { return acc.concat(fn(x)); }, []); }; };
var removeDuplicates = function (array) { return Array.from(new Set(array)); };
var getDeepDependants = function (stream) { return flatMap(function (stream) { return [stream].concat(stream.getDependants()); })(stream.getDependants()); };
var sortGraph = function (sourceStream) {
    var dependantStreams = removeDuplicates(getDeepDependants(sourceStream));
    // @ts-ignore
    var graph = dependantStreams.map(function (stream) { return [stream, stream.getDependants()]; });
    var sortedGraph = depthFirstTopologicalSort(graph);
    return sortedGraph;
};
/*
to avoid great waste of brain power,
it is imperative to remember that the flat graph of nodes and their dependants from a source node
is not the same as the list of nodes and their dependencies,
which would only be the case if all dependencies of a node happened to depend on the source node or a dependant of it, such that anytime the node changes, it's because all of its dependencies changed. That isn't usually the case.
*/
var Propagator = function (stream) {
    Object.assign(stream, {
        propagationEnabled: true,
        dependants: new Set()
    });
    var resortRequired = false;
    var sortedGraph = [];
    var registerDependant = function (dependant) {
        resortRequired = true;
        stream.dependants.add(dependant);
    };
    var getDependants = function () { return Array.from(stream.state.dependants); };
    var propagate = function () {
        if (!stream.propagationEnabled) {
            return;
        }
        if (resortRequired) {
            sortedGraph = sortGraph(stream);
            resortRequired = false;
        }
        sortedGraph.reduce(function (propagationState, dependant) {
            dependant.propagationEnabled = false;
            var unsubscribe = dependant.once('set', function () { return propagationState.updatedStreams.push(stream); });
            dependant.emit('propagation', propagationState);
            unsubscribe();
            dependant.propagationEnabled = true;
            return propagationState;
        }, { updatedStreams: [stream] });
    };
    return {
        registerDependant: registerDependant,
        getDependants: getDependants,
        propagate: propagate
    };
};
export default Propagator;
export { sortGraph };
