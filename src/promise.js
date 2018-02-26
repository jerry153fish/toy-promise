// Promise status
const STATUS = {
    PENDING: 0,
    FULFILLED: 1,
    REJECTED: 2
}

// check nodejs or browser
const nextTick = typeof process !== 'undefined' && process.nextTick ? process.nextTick : setTimeout
// use symbol for private members
const _status = Symbol('status')
const _value = Symbol('value')
// callback arrays for 
const _onFulfilledCallbacks = Symbol('onFulfilledCallbacks')
const _onRejectedCallbacks= Symbol('onRejectedCallbacks')

module.exports = class Promise {
    constructor(exec) {
        // this context bind
        let self = this

        self[_status] = STATUS.PENDING
        self[_value] = undefined
        self[_onFulfilledCallbacks] = []
        self[_onRejectedCallbacks] = []
        // resolve
        // change status and invoke callbacks
        function resolve(value) {
            nextTick(() => {
                if (self[_status] === STATUS.PENDING) {
                    self[_status] = STATUS.FULFILLED
                    self[_value] = value
                    self[_onFulfilledCallbacks].map(cb => cb(self[_value]))
                }
            })
        }
        // reject
        function reject(reason) {
            nextTick(() => {
                if (self[_status] === STATUS.PENDING) {
                    self[_status] = STATUS.REJECTED
                    self[_value] = reason
                    self[_onRejectedCallbacks].map(cb => cb(self[_value]))
                }
            })
        }

        try {
            exec(resolve, reject)
        } catch(e) {
            reject(e)
        }
    }
    // then implementation
    then(onResolved, onRejected) {
        onResolved = typeof (onResolved) === 'function' ? onResolved : v => v
        onRejected = typeof (onRejected) === 'function' ? onRejected : r => { throw r }

        let promise2, self = this
        // fulfilled status
        if (self[_status] === STATUS.FULFILLED) {
            return promise2 = new Promise((resolve, reject) => {
                nextTick(() => {
                    try {
                        let x = onResolved(self[_value])
                        resolver(promise2, x, resolve, reject)
                    } catch(e) {
                        reject(e)
                    }
                })
            })
        }
        // rejected
        if (self[_status] === STATUS.REJECTED) {
            return promise2 = new Promise((resolve, reject) => {
                nextTick(() => {
                    try {
                        let x = onRejected(self[_value])
                        resolver(promise2, x, resolve, reject)
                    } catch(e) {
                        reject(e)
                    }
                })
            })
        }
        // pending
        if (self[_status] === STATUS.PENDING) {
            return promise2 = new Promise((resolve, reject) => {
                self[_onFulfilledCallbacks].push((value) => {
                    try {
                        let x = onResolved(self[_value])
                        resolver(promise2, x, resolve, reject)
                    } catch(e) {
                        reject(e)
                    }
                })

                self[_onRejectedCallbacks].push((value) => {
                    try {
                        let x = onRejected(self[_value])
                        resolver(promise2, x, resolve, reject)
                    } catch(e) {
                        reject(e)
                    }                    
                })
            })
        }
        // resolver implementation for 2.3.3
        function resolver(promise, x, resolve, reject) {
            let then, thenCalledOrThrow = false

            if (promise === x) {
                return reject(new TypeError('Same Promises'))
            }

            if (x instanceof Promise) {
                if (x[_status] === STATUS.PENDING) {
                    x.then(v => resolver(promise, v, resolve, reject), reject)
                } else {
                    x.then(resolve, reject)
                }
            } 
            
            if ((x !== null) && (typeof (x) === 'object' || typeof (x) === 'function')) {
                try {
                    then = x.then
                    if (typeof (then) === 'function') {
                        then.call(x, s => {
                            if (thenCalledOrThrow) return
                            thenCalledOrThrow = true
                            return resolver(promise, s, resolve, reject)
                        }, r => {
                            if (thenCalledOrThrow) return
                            thenCalledOrThrow = true
                            return reject(r)
                        })
                    } else {
                        return resolve(x)
                    }
                } catch (e) {
                    if (thenCalledOrThrow) return
                    thenCalledOrThrow = true
                    return reject(e)
                }
            } else {
                return resolve(x)
            }
        }
    }
    // catch
    catch(onRejected) {
        return this.then(undefined, onRejected)
    }
    // test case adapter for Promise A++ Test Suit 
    static deferred() {
        let dfd = {}
        dfd.promise = new Promise((resolve, reject) => {
            dfd.resolve = resolve
            dfd.reject = reject
        })
        return dfd
    }
}