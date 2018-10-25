import canGetSet from './canGetSet';
import canPropagate from './canPropagate';
import Emitter from 'better-emitter';
import { TYPE_END_STREAM } from '../constants';
import assertStreamNotEnded from '../util/assertStreamNotEnded';
var EndStream = function () {
    var _a;
    function endStream() {
        assertStreamNotEnded(endStream);
        getterSetter.set(true);
        endStream.propagate();
    }
    var getterSetter = canGetSet(endStream);
    return Object.assign(endStream, getterSetter, canPropagate(Emitter(endStream)), (_a = {
            value: false,
            initialized: false,
            set: endStream,
            end: endStream
        },
        _a[Symbol.toStringTag] = TYPE_END_STREAM,
        _a));
};
export default EndStream;
