const balancer = {
    servers: (count) => {
        return {
            balance: (traffic) => {
                const min = Math.floor(traffic / count)
                const remainder = traffic % count
                const result = []
                for (let i = 0; i < count; i++) {
                    result.push(min + (i < remainder ? 1 : 0))
                }
                return result
            }
        }
    }
}

module.exports = balancer