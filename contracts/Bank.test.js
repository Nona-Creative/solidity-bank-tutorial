const chai = require('chai')
const { ContractUtils } = require('ethereum-utils')
const chaiAsPromised = require('chai-as-promised')

const { Contract } = require('../src/common/utils/ethereum-test-utils')

chai.use(chaiAsPromised)

const { assert } = chai
const { create: contract } = Contract(['Bank'])

describe('Bank', () => {
  describe('access', () => {
    it('should expose public properties and methods', contract('Bank', async ({ accounts, instance }) => {
      assert.includeMembers(Object.keys(instance.methods), [
        'createAccountFee',
      ])
    }))

    it('should not expose private properties and methods', contract('Bank', async ({ accounts, instance }) => {
      assert.notIncludeMembers(Object.keys(instance.methods), [
        'accounts',
        'balances',
      ])
    }))
  })

  describe('createAccountFee', () => {
    it('should return expected value when called', contract('Bank', async ({ accounts, instance }) => {
      // when ... we get the create account fee
      const result = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      // then ... should return expected value
      assert.equal(result, 1000)
    }))
  })

  describe('isMyAccountActive', () => {
    it('should return false if sender account does not exist', contract('Bank', async ({ accounts, instance }) => {
      // given ... no active account exists for address 0
      // when ... we check if account for address 0 is active
      const check1 = await ContractUtils.call(
        instance.methods.isMyAccountActive(),
        { from: accounts[0] },
      )

      // then ... should return false
      assert.isFalse(check1)
    }))
  })

  describe('createAccount', () => {
    it('should create an activated account for sender', contract('Bank', async ({ accounts, instance }) => {
      // given
      // ... no active account exists for address 0
      // when
      // ... we create a new account as address 0
      // ... providing the correct account creation fee
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      const tx = await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: createAccountFee },
        true,
      )

      // then
      // ... should create an activated account for address 0
      // assert.match(tx.transactionHash, /0x[a-z0-9]{64}/)
      const isActive = await ContractUtils.call(
        instance.methods.isMyAccountActive(),
        { from: accounts[0] },
      )
      assert.isTrue(isActive)
      // ... and emit an AccountCreated event with expected values
      assert.hasAllKeys(tx.events, ['AccountCreated'])
      const AccountCreatedEvents = ContractUtils.events('AccountCreated', tx)
      assert.equal(AccountCreatedEvents.length, 1)
      assert.property(AccountCreatedEvents[0], 'accountAddress')
    }))

    it('should reject as expected if we create account with incorrect fee', contract('Bank', async ({ accounts, instance }) => {
      // when ... we create an account with the incorrect fee
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.createAccount(),
          { from: accounts[0], value: 0 },
          true,
        ),
        Error,
        /Please provide the correct account creation fee/,
      )
    }))
  })
})
