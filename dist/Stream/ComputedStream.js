import canGetSet from './canGetSet';
import canPropagate from './canPropagate';
import Emitter from 'better-emitter';
import { TYPE_STREAM } from '../constants';
import EndStream from './EndStream';
import assertStreamNotEnded from '../util/assertStreamNotEnded';
function ComputedStream(combineFn, dependencies) {
    var _a;
    var inPropagation = false;
    var calledSetDuringThisPropagation = false;
    var queuedValues = [];
    var computedStream = function (value) {
        if (calledSetDuringThisPropagation) {
            queuedValues.push(value);
            return;
        }
        if (inPropagation) {
            calledSetDuringThisPropagation = true;
        }
        assertStreamNotEnded(computedStream);
        getterSetter.set(value);
        computedStream.propagate();
    };
    var compute = function (updatedDependencies) {
        if (updatedDependencies === void 0) { updatedDependencies = []; }
        return combineFn(computedStream, dependencies, updatedDependencies);
    };
    var maybeBecomeActive = function () {
        return computedStream.active = computedStream.active || dependencies.every(function (dependency) { return dependency.initialized; });
    };
    var computeIfActive = function (updatedDependencies) {
        maybeBecomeActive();
        computedStream.active && compute(updatedDependencies);
    };
    var onPropagation = function (_a) {
        var updatedStreams = _a.updatedStreams;
        inPropagation = true;
        var updatedDependencies = dependencies.filter(function (dependency) { return updatedStreams.includes(dependency); });
        if (updatedDependencies.length) {
            maybeBecomeActive();
            computeIfActive(updatedDependencies);
        }
    };
    var onPropagationComplete = function () {
        console.log(computedStream.label, 'onPropagationComplete()', queuedValues);
        inPropagation = false;
        calledSetDuringThisPropagation = false;
        queuedValues.forEach(function (value) { return computedStream(value); });
        queuedValues = [];
    };
    var getterSetter = canGetSet(computedStream);
    var end = EndStream();
    return Object.assign(computedStream, getterSetter, canPropagate(Emitter(computedStream)), (_a = {
            compute: compute,
            computeIfActive: computeIfActive,
            onPropagation: onPropagation,
            onPropagationComplete: onPropagationComplete,
            set: computedStream,
            end: end
        },
        // TODO: TYPE_COMPUTED_STREAM ?
        _a[Symbol.toStringTag] = TYPE_STREAM,
        _a));
}
export default ComputedStream;
