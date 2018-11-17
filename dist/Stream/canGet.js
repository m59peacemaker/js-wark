var canGet = function (stream) {
    var get = function () { return stream.value; };
    function toString() {
        return stream[Symbol.toStringTag] + "(" + stream.value + ")";
    }
    return {
        get: get,
        toJSON: get,
        toString: toString
    };
};
export default canGet;
