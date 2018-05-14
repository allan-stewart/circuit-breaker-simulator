const balancer = require('../src/balancer')
const assert = require('assert')

describe('balancer', () => {
    it('balances traffic exactly evenly when possible', () => assert.deepEqual(balancer.servers(5).balance(10), [2, 2, 2, 2, 2]))
    it('balances traffic approximately evenly when uneven', () => assert.deepEqual(balancer.servers(3).balance(13), [5, 4, 4]))
})
