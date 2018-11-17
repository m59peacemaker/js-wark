import { TYPE_END_STREAM } from '../constants';
import canGet from './canGet';
import canSet from './canSet';
import canPropagate from './canPropagate';
import assertStreamNotEnded from '../util/assertStreamNotEnded';
var EndStream = function () {
    var _a;
    function endStream() {
        assertStreamNotEnded(endStream);
        setter.set(true);
        propagator.propagate();
    }
    var setter = canSet(endStream);
    var propagator = canPropagate(endStream);
    return Object.assign(endStream, canGet(endStream), setter, (_a = {
            value: false,
            initialized: false,
            set: endStream,
            dependants: new Set(),
            registerDependant: propagator.registerDependant,
            end: endStream
        },
        _a[Symbol.toStringTag] = TYPE_END_STREAM,
        _a));
};
export default EndStream;
