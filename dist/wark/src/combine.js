import ComputedStream from './Stream/ComputedStream';
var combine = function (computeFn) { return function (dependencies) {
    var stream = ComputedStream(computeFn);
    stream.dependsOn(dependencies);
    return stream;
}; };
export default combine;
