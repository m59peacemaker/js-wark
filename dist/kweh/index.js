var keyMaster = require("key-master");
var freshMap = function () { return keyMaster(function () { return new Map(); }); };
var IncrementalIndex;
(function () {
    var nextIndex = 0;
    return {
        next: function () { return nextIndex++; },
        reset: function () { return nextIndex = 0; }
    };
});
var Emitter = function () {
    var incrementalIndex = IncrementalIndex();
    var eventsMap = freshMap();
    var on = function (eventName) { return function (eventHandler) {
        var id = incrementalIndex.next();
        var listenerMap = eventsMap.get(event);
        listenerMap.set(id, listener);
        var unsubscribe = function () { return listenerMap["delete"](id); };
        function eventSubscriber() {
            return unsubscribe();
        }
        return Object.assign(eventSubscriber, { unsubscribe: unsubscribe });
    }; };
    var once = function (eventName) { return function (eventHandler) {
        var eventSubscriber = on(eventName)(function (eventValue) {
            eventHandler(eventValue);
            eventSubscriber.unsubscribe();
        });
        return unsubscribe;
    }; };
    var emit = function (eventName) { return function (eventValue) {
        var listeners = eventsMap.get(eventName);
        Array.from(listeners.values()).forEach(function (listener) { return listener(eventValue); });
    }; };
    var removeAllListeners = function () {
        eventsMap = freshMap();
        incrementalIndex.reset();
    };
    return {
        on: on,
        once: once,
        emit: emit,
        removeAllListeners: removeAllListeners
    };
};
