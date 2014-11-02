
function queuedFn(fn, paramArray) {

    var chainedQueues = [];

    var privateExternalCallbacks = [];
    var privateMethod = fn;
    var privateParamArray = paramArray || [];

    function addExternalCallback(fn) {
        privateExternalCallbacks.push(fn);
        return publicInterface;
    }

    function invoke(callback, executionContext) {

        var internalCallback = function() {
            var args = Array.prototype.slice.call(arguments);
            if (args.length) {
                executionContext.resultStack.push(arguments);
            }
            args.push(executionContext);
            privateInvokeExternalCallback(args, executionContext);

            //exeute any chaned queues
            if (chainedQueues.length) {
                executeChainedQueues(executionContext, callback);
            }
            else {
                callback();
            }
        };

        privateParamArray.push(internalCallback);
        privateParamArray.push(executionContext);
        privateMethod.apply(this, privateParamArray);
    }

    function executeChainedQueues(executionContext, callback) {
        var len = chainedQueues.length;
        var completeCount = 0;

        var completeCallback = function(execCtx) {
            //TODO: merge the chained context in to the main context

            completeCount++;
            if (completeCount === len) {
                callback();
            }
        };

        for (var i = 0; i < len; i++) {
            chainedQueues[i].callback(completeCallback);
            chainedQueues[i].execute(executionContext);
        }
    }

    function privateInvokeExternalCallback(args, executionContext) {
        var len = privateExternalCallbacks.length;
        for (var i = 0; i < len; i++) {
            if (typeof privateExternalCallbacks[i] === 'function') {
                var result = privateExternalCallbacks[i].apply(this, args);
                if (result) {
                    executionContext.resultStack.push(result);
                }
            }
        }
    }

    function addChainedQueue(mq) {
        chainedQueues.push(mq);
        return publicInterface;
    }


    var publicInterface = {
        callback: addExternalCallback,
        subQueue: addChainedQueue,
        invoke: invoke
    };

    return publicInterface;

}

module.exports = queuedFn;