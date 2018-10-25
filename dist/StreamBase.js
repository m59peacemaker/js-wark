import Emitter from 'better-emitter';
import Propagator from './Propagator';
import extend from './util/extend';
var StreamBase = function (streamType, state) {
    var _a;
    extend(state, {
        initialized: false
    });
    var set = function stream(value) {
        var isInitial = !state.initialized;
        state.initialized = true;
        state.value = value;
        self.emit('set', state.value);
        isInitial && self.emit('initialized', state.value);
    };
    var get = function () { return state.value; };
    var toString = function () { return streamType + " (" + state.value + ")"; };
    var self = Propagator(Emitter(Object.assign(set, (_a = {
            state: state,
            set: set,
            get: get,
            toJSON: get,
            toString: toString
        },
        _a[Symbol.toStringTag] = streamType,
        _a))));
    return self;
};
export default StreamBase;
