var canSet = function (stream) {
    var set = function (value) {
        stream.initialized = true;
        stream.value = value;
    };
    return {
        set: set
    };
};
export default canSet;
