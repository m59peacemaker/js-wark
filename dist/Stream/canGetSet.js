var canGetSet = function (stream) {
    var set = function (value) {
        stream.initialized = true;
        stream.value = value;
        // TODO: maybe just use ComputedStream.onSet or something
        stream.emit('set', stream.value);
    };
    var get = function () { return stream.value; };
    function toString() {
        return stream[Symbol.toStringTag] + "(" + stream.value + ")";
    }
    return {
        set: set,
        get: get,
        toJSON: get,
        toString: toString
    };
};
export default canGetSet;
