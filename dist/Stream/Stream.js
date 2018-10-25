import canGetSet from './canGetSet';
import canPropagate from './canPropagate';
import Emitter from 'better-emitter';
import { TYPE_STREAM } from '../constants';
import EndStream from './EndStream';
import assertStreamNotEnded from '../util/assertStreamNotEnded';
// TODO: can probably ditch the event emitting stuff altogether
// dependant.onSet = () => { dependant.onSet = noop etc }
// call stream.propagate() in set()
function Stream(value) {
    var _a;
    function stream(value) {
        assertStreamNotEnded(stream);
        getterSetter.set(value);
        stream.propagate();
    }
    var getterSetter = canGetSet(stream);
    var end = EndStream();
    return Object.assign(stream, getterSetter, canPropagate(Emitter(stream)), (_a = {
            value: value,
            initialized: arguments.length > 0,
            set: stream,
            end: end
        },
        _a[Symbol.toStringTag] = TYPE_STREAM,
        _a));
}
export default Stream;
