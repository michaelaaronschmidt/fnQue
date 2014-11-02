var queuedFn = require('./../lib/queuedFn.js');

var chai = require('chai');
chai.Assertion.includeStack = true; // defaults to false

var should = chai.should();
var expect = chai.expect;

var executionContext = {
    resultStack: []    
}

describe('queuedFn.invoke', function(){

    it('should callback when invoked', function(done){
        var queuedFunction = function(callback){
            callback();
        };
        var qf = queuedFn(queuedFunction);
            
        qf.invoke(done, executionContext);
    });

    it('should callback with params returned from queued function', function(done){
        var queuedFunction = function(callback){
            callback('retVal 1', 'retVal 2');   
        }; 
        var qf = queuedFn(queuedFunction)
            .callback(function(param1, param2){
                param1.should.equal('retVal 1');
                param2.should.equal('retVal 2');
            });
        
        qf.invoke(
            function(){
                executionContext.resultStack[0][0].should.equal('retVal 1');
                executionContext.resultStack[0][1].should.equal('retVal 2');
                done();
            }, 
            executionContext
        );
        
    });


});