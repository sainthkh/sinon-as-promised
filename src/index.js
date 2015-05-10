'use strict'

var Promise = require('native-promise-only')
var sinon = require('sinon')

function ensure (actual, expected) {
  expected.forEach(function (method) {
    if (actual.indexOf(method) === -1) actual.push(method)
  })
  return actual
}

function thenable (promiseFactory) {
  return ensure(Object.getOwnPropertyNames(Promise.prototype), ['catch', 'finally'])
    .filter(function (method) {
      return method !== 'then'
    })
    .reduce(function (thenable, method) {
      thenable[method] = function () {
        var args = arguments
        var promise = this.then()
        return promise[method].apply(promise, args)
      }
      return thenable
    },
    {
      then: function (/*onFulfill, onReject*/) {
        var promise = promiseFactory()
        return promise.then.apply(promise, arguments)
      }
    })
}

function resolves (value) {
  /*jshint validthis:true */
  return this.returns(thenable(function () {
    return new Promise(function (resolve) {
      resolve(value)
    })
  }))
}

sinon.stub.resolves = resolves
sinon.behavior.resolves = resolves

function rejects (err) {
  if (typeof err === 'string') {
    err = new Error(err)
  }
  /*jshint validthis:true */
  return this.returns(thenable(function () {
    return new Promise(function (resolve, reject) {
      reject(err)
    })
  }))
}

sinon.stub.rejects = rejects
sinon.behavior.rejects = rejects

module.exports = function (_Promise_) {
  if (typeof _Promise_ !== 'function') {
    throw new Error('A Promise constructor must be provided')
  } else {
    Promise = _Promise_
  }
  return sinon
}
