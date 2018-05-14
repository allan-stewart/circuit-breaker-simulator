const circuitBreakers = require('../src/breaker')
const assert = require('assert')

describe('breaker', () => {
    let breaker, breakerResult
    let errorDelegate = () => { throw new Error('Delegate test error') }

    beforeEach(() => breaker = circuitBreakers.createBreaker({windowSize: 10}))

    describe('when the breaker is closed', () => {
        beforeEach(() => {breakerResult = breaker.execute(() => 'success')})
        it('should return the result', () => assert.deepEqual(breakerResult, { result: 'success', error: null, tripped: false }))
    })

    describe('when the delegate throws', () => {
        const error = new Error('test error')
        beforeEach(() => breakerResult = breaker.execute(() => { throw error } ))
        it('should return the error', () => assert.deepEqual(breakerResult, {result: null, error, tripped: false }))
    })

    describe('when the breaker is manually opened', () => {
        let wasDelegateCalled = false
        beforeEach(() => {
            breaker.open()
            breakerResult = breaker.execute(() => { wasDelegateCalled = true })
        })
        it('should return a tripped result', () => assert.deepEqual(breakerResult, {result: null, error: null, tripped: true}))
        it('should not call the delegate', () => assert.equal(wasDelegateCalled, false))
        it('should report open', () => assert.equal(breaker.state(), 'open'))
    })

    describe('when the delegate keeps failing it should trip', () => {
        it('should trip when the error rate reaches the threshold', () => {
            let result
            for (let i = 1; i <= 6; i++) {
                result = breaker.execute(errorDelegate)
                assert.equal(result.tripped, i > 5, `unexpected result at ${i}`)
            }
        })
    })

    describe('when the breaker is tripped and the delegate keeps failing', () => {
        let percentTripped = 0
        
        beforeEach(() => {
            breaker.trip()
            let tripped = 0
            let totalRuns = 1000
            for (let i = 0; i < totalRuns; i++) {
                breakerResult = breaker.execute(errorDelegate)
                tripped += breakerResult.tripped ? 1 : 0
            }
            percentTripped = tripped / totalRuns
        })

        it('should not be tripped more than 92% of the time', () => assert(percentTripped <= .92, `percent tripped over 92%: ${percentTripped}`))
        it('should be tripped more than 85% of the time', () => assert(percentTripped >= .75, `percent tripped under 85%: ${percentTripped}`))
    })

    describe('when the breaker is tripped and the delegate recovers', () => {
        let finalState, recoverCount

        beforeEach(() => {
            breaker.trip()
            for (let i = 0; i < 10; i++) {
                breaker.execute(errorDelegate)
            }

            let count = 0
            recoverCount = 0
            while (count < 1000 && breaker.state() == 'tripped') {
                count++
                let result = breaker.execute(() => 'success')
                if (!result.tripped) {
                    recoverCount++
                }
                
            }

            finalState = breaker.state()
        })

        it('should no longer be tripped', () => assert.equal(finalState, 'closed'))
        it('should recover within the windowSize', () => assert.equal(recoverCount, 11))
    })

    describe('when the breaker is disabled', () => {
        let percentTripped = 0
        
        beforeEach(() => {
            breaker.disable()
            let tripped = 0
            let totalRuns = 1000
            for (let i = 0; i < totalRuns; i++) {
                breakerResult = breaker.execute(errorDelegate)
                tripped += breakerResult.tripped ? 1 : 0
            }
            percentTripped = tripped / totalRuns
        })

        it('should not trip at all', () => assert(percentTripped <= 0, `percent tripped over 0%: ${percentTripped}`))
    })

    describe('easingFunctions', () => {
        describe('the linear function', () => {
            it('should always return the input percentage', () => {
                for (let i = 0; i <= 100; i++) {
                    let val = i / 100
                    assert.equal(circuitBreakers.easingFunctions.linear(val), val)
                }
            })
        })
    
        describe('the sine function', () => {
            it('should return > 50% when there are 50% failures', () => assert(circuitBreakers.easingFunctions.sine(.5) > .5))
        })
    })
})
