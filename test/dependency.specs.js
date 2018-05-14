const dependencies = require('../src/dependency')
const assert = require('assert')

describe('dependency', () => {
    let dependency

    beforeEach(() => {
        dependency = dependencies.createDependency({failureRate: 0})
    })

    describe('query', () => {
        it('should be successful on the first query', () => {
            let result = dependency.query()
            assert.equal(result, 'Dependency success!')
            assert.deepEqual(dependency.stats(), {ramp: 25, requestsThisTick: 1, errorsThisTick: 0})
        })

        it('should fail sometimes, based on failure rate', () => {
            dependency = dependencies.createDependency({failureRate: 1})
            try {
                dependency.query()
            } catch (error) {
                assert.equal(error.message, 'Dependency failure!')
                return
            }
            assert.fail('no exception thrown!')
        })

        it('should fail if you make too many requests at once', () => {
            for (let i = 0; i < 11; i++) {
                try {
                    dependency.query()
                } catch (error) {
                    assert.equal(error.message, 'Too many requests!')
                    assert.equal(i, 10, 'Failed too early!')
                }
            }
        })
    })

    describe('tick', () => {
        const makeQueries = (n) => {
            while (n > 0) {
                n--;
                try {
                    dependency.query()
                } catch (error) {

                }
            }
        }

        it('resets the number of requests', () => {
            makeQueries(3)
            assert.equal(dependency.stats().requestsThisTick, 3)
            dependency.tick()
            assert.equal(dependency.stats().requestsThisTick, 0)
        })

        it('resets the error count', () => {
            makeQueries(30)
            assert.equal(dependency.stats().errorsThisTick >= 5, true)
            dependency.tick()
            assert.equal(dependency.stats().errorsThisTick, 0)
        })

        it('increases the ramp-up if there have not been too many requests', () => {
            makeQueries(10)
            dependency.tick()
            assert.equal(dependency.stats().ramp, 50)
        })

        it('halves the ramp-up if there were too many errors', () => {
            makeQueries(51)
            dependency.tick()
            assert.equal(dependency.stats().ramp, 12)
        })

        it('increments the ramp-up if there were too many requests, but not too many errors', () => {
            makeQueries(27)
            dependency.tick()
            assert.equal(dependency.stats().ramp, 26)
        })
    })
}) 
