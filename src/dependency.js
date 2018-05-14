const createDependency = (options) => {
    options = options || {}
    let failureRate = options.failureRate === undefined ? .05 : options.failureRate
    let rampUpRPS = options.rampUpRPS || 25 // requests per second
    let maxRPS = options.maxRPS || 1000
    let requestsThisTick = 0
    let ramp = rampUpRPS
    let errorsThisTick = 0

    return {
        query: () => {
            requestsThisTick++
            if (requestsThisTick > ramp) {
                errorsThisTick++
                throw new Error('Too many requests!')
            }
            if (Math.random() < failureRate) {
                errorsThisTick++
                throw new Error('Dependency failure!')
            }
            return 'Dependency success!'
        },
        tick: () => {
            if (requestsThisTick <= ramp) {
                ramp = Math.min(ramp + rampUpRPS, maxRPS)
            } else if (errorsThisTick > ramp) {
                ramp = Math.max(Math.floor(ramp / 2), 1)
            } else {
                ramp++
            }
            requestsThisTick = 0
            errorsThisTick = 0
        },
        stats: () => {
            return {
                requestsThisTick,
                ramp,
                errorsThisTick
            }
        },
        setFailureRate: (v) => failureRate = v,
        setRampUpRPS: (v) => rampUpRPS = v,
        setMaxRPS: (v) => maxRPS = v,
        reset: () => {
            ramp = rampUpRPS
        }
    }
}

module.exports = {
    createDependency
}