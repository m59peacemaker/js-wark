import ComputedStream from './Stream/ComputedStream';
var combine = function (combineFn) { return function (dependencies) {
    var computedStream = ComputedStream(combineFn, dependencies);
    dependencies.forEach(function (dependency) { return dependency.registerDependant(computedStream); });
    computedStream.computeIfActive();
    return computedStream;
}; };
export default combine;
