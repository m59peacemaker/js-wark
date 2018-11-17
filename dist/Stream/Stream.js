import Emitter from 'better-emitter';
import { TYPE_STREAM } from '../constants';
import canGet from './canGet';
import canSet from './canSet';
import EndStream from './EndStream';
import assertStreamNotEnded from '../util/assertStreamNotEnded';
function Stream(value) {
    var _a;
    function stream(value) {
        assertStreamNotEnded(stream);
        setter.set(value);
        stream.emit('propagation');
    }
    var setter = canSet(stream);
    var end = EndStream();
    return Object.assign(stream, canGet(stream), setter, Emitter(), (_a = {
            value: value,
            initialized: arguments.length > 0,
            set: stream,
            end: end
        },
        _a[Symbol.toStringTag] = TYPE_STREAM,
        _a));
}
export default Stream;
