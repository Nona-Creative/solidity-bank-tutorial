const chai = require('chai')
const { ContractUtils } = require('ethereum-utils')
const chaiAsPromised = require('chai-as-promised')

const { Contract } = require('../src/common/utils/ethereum-test-utils')

chai.use(chaiAsPromised)

const { assert } = chai
const { create: contract } = Contract(['Bank'])

describe('Bank', () => {
  describe('???', () => {
    it('should ...', contract('Bank', async ({ accounts, instance }) => {
      // ...
    }))
  })
})
