var assertStreamNotEnded = function (stream) {
    if (stream.end.get()) {
        throw new Error("invalid operation attempted on ended stream " + stream);
    }
};
export default assertStreamNotEnded;
