var toDependantMap = function (graph) { return graph.reduce(function (map, _a) {
    var node = _a[0], dependants = _a[1];
    map.set(node, dependants);
    return map;
}, new Map()); };
var depthFirstTopologicalSort = function (inputGraph) {
    var graph = inputGraph.slice(0);
    var dependantMap = toDependantMap(graph);
    var sortedNodes = [];
    function visit(node, dependants) {
        if (sortedNodes.includes(node)) {
            return;
        }
        if (graph.includes(node)) {
            throw new Error('Graph has a cycle - graph is not a DAG.');
        }
        dependants && dependants.forEach(function (dependant) { return visit(dependant, dependantMap.get(dependant)); });
        sortedNodes.unshift(node);
    }
    while (graph.length) {
        var _a = graph.shift(), node = _a[0], dependants = _a[1];
        visit(node, dependants);
    }
    return sortedNodes;
};
export default depthFirstTopologicalSort;
