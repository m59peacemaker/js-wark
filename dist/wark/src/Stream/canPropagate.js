import depthFirstTopologicalSort from '../depth-first-topological-sort';
import ComputedStream from './ComputedStream';
var flatMap = function (fn) { return function (array) { return array.reduce(function (acc, x) { return acc.concat(fn(x)); }, []); }; };
var removeDuplicates = function (array) { return Array.from(new Set(array)); };
var getDependants = function (stream) { return Array.from(stream.dependants); };
var getDeepDependants = function (stream) { return flatMap(function (dependant) { return [dependant].concat(getDependants(dependant)); })(getDependants(stream)); };
var sortGraph = function (sourceStream) {
    var dependantStreams = removeDuplicates(getDeepDependants(sourceStream));
    var graph = dependantStreams.map(function (stream) { return [stream, getDependants(stream)]; });
    var sortedGraph = depthFirstTopologicalSort(graph);
    return sortedGraph;
};
/*
Remember that the flat graph of nodes and their dependants from a source node
is not the same as the list of nodes and their dependencies,
which would only be the case if all dependencies of a node happened to depend on the source node or a dependant of it, such that anytime the node changes, it's because all of its dependencies changed. That isn't usually the case.
*/
var canPropagate = function (stream) {
    var resortRequired = false;
    var sortedGraph = [];
    var registerDependant = function (dependant) {
        resortRequired = true;
        stream.dependants.add(dependant);
    };
    var propagate = function () {
        if (resortRequired) {
            sortedGraph = sortGraph(stream);
            resortRequired = false;
        }
        sortedGraph.reduce(function (updatedStreams, dependant) {
            var updatedDependencies = dependant.dependencies.filter(function (dependency) { return updatedStreams.includes(dependency); });
            if (updatedDependencies.length) {
                var value = dependant.compute(updatedDependencies);
                if (value !== ComputedStream.noUpdate) {
                    updatedStreams.push(dependant);
                }
            }
            return updatedStreams;
        }, [stream]);
    };
    return {
        registerDependant: registerDependant,
        propagate: propagate
    };
};
export default canPropagate;
export { getDeepDependants, sortGraph };
