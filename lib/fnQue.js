var queuedFn = require('./queuedFn.js');

//var fq = new fnQue(async[, completeCallback[, limit[, shareEventLoop]);
function fnQue(async) {

    var currentExecutionIndex;
    var completeCount = -1;
    var executionContext;
    var completeCallbacks = [];
    var asyncExecutionLimit = 0; //0 = unlimited
    var activeExecutionCount = 0;
    var shareEventLoop = false;

    //set up internal vars based on optional params
    if (arguments.length > 1) {
        if (typeof arguments[1] === 'function') {
            completeCallbacks.push(arguments[1]);
        }
        else if (!isNaN(arguments[1])) {
            //this must be the limit param becasue it's not a function
            asyncExecutionLimit = arguments[1];
        }
        else {
            shareEventLoop = arguments[1];
        }
    }
    if (arguments.length > 2) {
        if (!isNaN(arguments[2])) {
            asyncExecutionLimit = arguments[2];
        }
        else {
            shareEventLoop = arguments[2];
        }
    }
    if (arguments.length > 3) {
        shareEventLoop = arguments[3];
    }

    var queue = [];

    function addFunction(fn, paramArray) {
        var qm = queuedFn(fn, paramArray);
        queue.push(qm);
        qm.add = addFunction;
        return qm;
    }

    function addCompleteCallback(fn) {
        completeCallbacks.push(fn);
    }

    //initExecutionContext([execCtx])
    function initExecutionContext(execCtx){
        if (execCtx){
            executionContext = execCtx;
            if (!executionContext.resultStack){
                executionContext.resultStack = [];
            }
        }
        else{
             executionContext = {
                resultStack: []
            };
        }
    }

    //execute([execCtx])
    function execute(execCtx) {

        initExecutionContext(execCtx);

        if (async) {
            currentExecutionIndex = -1;
            completeCount = 0;
            activeExecutionCount = 0;
            asyncExecuteNext();
        }
        else {
            completeCount = -1;
            currentExecutionIndex = -1;
            executeNext();
        }

    }

    function asyncExecuteComplete() {
        completeCount++;
        activeExecutionCount--;
        if (completeCount === queue.length) {
            var len = completeCallbacks.length;
            for (var i = 0; i < len; i++) {
                if (typeof completeCallbacks[i] === 'function') {
                    completeCallbacks[i](executionContext);
                }
            }
        }
        if (shareEventLoop) {
            setTimeout(asyncExecuteNext, 0);
        }
        else {
            asyncExecuteNext();
        }
    }

    function asyncExecuteNext() {
        if ((asyncExecutionLimit === 0 || (asyncExecutionLimit && asyncExecutionLimit > activeExecutionCount)) && currentExecutionIndex < queue.length - 1) {
            currentExecutionIndex++;
            activeExecutionCount++;
            queue[currentExecutionIndex].invoke(asyncExecuteComplete, executionContext);
            asyncExecuteNext();
        }
    }

    function executeNext() {
        currentExecutionIndex++;
        completeCount++;

        if (currentExecutionIndex < queue.length) {
            //add this 'executeNext' function as the callback so we know when to execute the next function in the queue
            if (shareEventLoop) {
                setTimeout(function() {
                    queue[currentExecutionIndex].invoke(executeNext, executionContext);
                }, 0);
            }
            else {
                queue[currentExecutionIndex].invoke(executeNext, executionContext);
            }
        }
        else {
            var len = completeCallbacks.length;
            for (var i = 0; i < len; i++) {
                if (typeof completeCallbacks[i] === 'function') {
                    completeCallbacks[i](executionContext);
                }
            }
        }

    }


    var publicInterface = {
        add: addFunction,
        callback: addCompleteCallback,
        execute: execute
    };
    return publicInterface;
}

module.exports = fnQue;