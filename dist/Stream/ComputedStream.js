var _a;
import { TYPE_COMPUTED_STREAM } from '../constants';
import canGet from './canGet';
import canSet from './canSet';
import EndStream from './EndStream';
import assertStreamNotEnded from '../util/assertStreamNotEnded';
var noUpdate = (_a = {}, _a["@@" + TYPE_COMPUTED_STREAM + "/noUpdate"] = true, _a);
var ComputedStream = function (computeFn) {
    var _a;
    var dependencies = [];
    var computedStream = (_a = {
            value: undefined,
            initialized: false,
            active: false,
            dependants: new Set(),
            end: EndStream()
        },
        _a[Symbol.toStringTag] = TYPE_COMPUTED_STREAM,
        _a);
    var getter = canGet(computedStream);
    var setter = canSet(computedStream);
    var allDependenciesInitialized = function () { return dependencies.every(function (dependency) { return dependency.initialized; }); };
    var compute = function (updatedDependencies) {
        if (updatedDependencies === void 0) { updatedDependencies = []; }
        assertStreamNotEnded(computedStream);
        computedStream.active = computedStream.active || allDependenciesInitialized();
        if (!computedStream.active) {
            return noUpdate;
        }
        var value = computeFn(dependencies, updatedDependencies);
        if (value !== noUpdate) {
            setter.set(value);
        }
        return value;
    };
    var dependsOn = function (newDependencies) {
        dependencies = newDependencies;
    };
    Object.assign(computedStream, getter, {
        compute: compute,
        dependsOn: dependsOn
    });
    compute();
    return computedStream;
};
ComputedStream.noUpdate = noUpdate;
export default ComputedStream;
