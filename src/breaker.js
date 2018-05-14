const createBreaker = (options) => {
    options = options || {}
    let tripThreshold = options.tripThreshold || .5
    let closeThreshold = options.closeThreshold || .1
    let easing = options.easingFunction || easingFunctions.sine
    let maxThrottle = options.maxThrottle || .9
    const windowSize = options.windowSize || 50
    const errors = new Array(windowSize).fill(0)
    let state = 'closed'
    let errorPercentage = 0

    const push = (value) => {
        errors.push(value)
        while (errors.length > windowSize) errors.shift()
        errorPercentage = errors.reduce((total, value) => total + value, 0) / windowSize
    }

    const shouldShortCircuit = () => {
        if (state == 'disabled') return false
        if (state == 'open') return true

        if (state == 'closed') {
            if (errorPercentage >= tripThreshold) {
                state = 'tripped'
                return true
            }
            return false
        }

        if (state == 'tripped') {
            const easedPercentage = easing(errorPercentage)
            if (easedPercentage < closeThreshold) {
                state = 'closed'
                return false
            }
            return !(Math.random() > Math.min(easedPercentage, maxThrottle))
        }
        
        throw new Error(`Unexpected breaker state: ${state}`)
    }

    const execute = (delegate) => {
        if (shouldShortCircuit()) {
            return { result: null, error: null, tripped: true }
        }
        try {
            let result = delegate()
            push(0)
            return { result, error: null, tripped: false }
        }
        catch (error) {
            push(1)
            return { result: null, error, tripped: false }
        }
    }

    return {
        execute,
        open: () => state = 'open', 
        close: () => state = 'closed',
        trip: () => state = 'tripped',
        disable: () => state = 'disabled',
        state: () => state,
        errorPercentage: () => errorPercentage,
        easing: () => easing,
        setTripThreshold: (v) => tripThreshold = v,
        setCloseThreshold: (v) => closeThreshold = v,
        setEasing: (v) => easing = v,
        setMaxThrottle: (v) => maxThrottle = v
    }
}

const halfPi = Math.PI / 2

const easingFunctions = {
    linear: (percentFailed) => percentFailed,
    sine: (percentFailed) => Math.sin(halfPi * percentFailed)
}

module.exports = {
    createBreaker,
    easingFunctions
}
