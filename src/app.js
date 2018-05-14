const createApp = (breaker, dependency) => {
    let totals = { succeeded: 0, errors: 0, tripped: 0 }

    return {
        getTotals: () => totals,
        resetTotals: () => totals = { succeeded: 0, errors: 0, tripped: 0 },
        handleTraffic: (traffic) => {
            let result = breaker.execute(dependency)
            totals.succeeded += result.result ? 1 : 0
            totals.errors += result.error ? 1 : 0
            totals.tripped += result.tripped ? 1 : 0
        },
        breaker
    }
}

module.exports = {
    createApp
}
