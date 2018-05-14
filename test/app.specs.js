const app = require('../src/app')
const breaker = require('../src/breaker')
const assert = require('assert')

describe('app', () => {

    describe('getTotals', () => {
        it('returns initial values if no traffic has been run', () => {
            const instance = app.createApp(() => 'breaker', () => 'delegate')
            const result = instance.getTotals()
            assert.deepEqual(result, {succeeded: 0, errors: 0, tripped: 0})
        })
    })

    describe('handleTraffic', () => {
        it('calls the dependency via the breaker and updates the totals', () => {
            let i = 0
            let breakerInstance = breaker.createBreaker({easingFunction: breaker.easingFunctions.zero})
            const instance = app.createApp(breakerInstance, () => {
                i++
                if (i > 7) {
                    breakerInstance.open()
                }
                if (i > 5) {
                    throw new Error('error')
                }
                return 'success'
            })
            for (let i = 0; i < 10; i++) {
                instance.handleTraffic()
            }

            const result = instance.getTotals()
            assert.deepEqual(result, {succeeded: 5, errors: 3, tripped: 2})
        })
    })

    describe('resetTotals', () => {
        it('should reset the totals back to 0', () => {
            let breakerInstance = breaker.createBreaker()
            let instance = app.createApp(breakerInstance, () => 'dependency')
            instance.handleTraffic()
            instance.resetTotals()
            assert.deepEqual(instance.getTotals(), {succeeded: 0, errors: 0, tripped: 0})
        })
    })
})
