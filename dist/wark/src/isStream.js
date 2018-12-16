import { TYPE_STREAM, TYPE_END_STREAM } from './constants';
var isStream = function (value) { return value
    && (value[Symbol.toStringTag] === TYPE_STREAM
        || value[Symbol.toStringTag] === TYPE_END_STREAM); };
export default isStream;
