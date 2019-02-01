const chai = require('chai')
const { ContractUtils } = require('ethereum-utils')
const chaiAsPromised = require('chai-as-promised')
const Web3 = require('web3')
const BigNumber = require('bignumber.js')

const { Contract } = require('../src/common/utils/ethereum-test-utils')

chai.use(chaiAsPromised)

const { assert } = chai
const { create: contract } = Contract(['Bank'])

describe('Bank', () => {
  describe('access', () => {
    it('should expose public properties and methods', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should not expose private properties and methods', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))
  })

  describe('createAccountFee', () => {
    it('should return expected value when called', contract('Bank', async ({ accounts, instance }) => {
      // when ... we get the create account fee
      // INSERT TEST HERE

      // then ... should return expected value
      // INSERT TEST HERE
    }))
  })

  describe('isMyAccountActive', () => {
    it('should return false if sender account does not exist', contract('Bank', async ({ accounts, instance }) => {
      // given ... no active account exists for address 0
      // when ... we check if account for address 0 is active
      // INSERT TEST HERE

      // then ... should return false
      // INSERT TEST HERE
    }))
  })

  describe('createAccount', () => {
    it('should create an activated account for sender', contract('Bank', async ({ accounts, instance }) => {
      // given
      // ... no active account exists for address 0
      // when
      // ... we create a new account as address 0
      // INSERT TEST HERE

      // then
      // ... should create an activated account for address 0
      // INSERT TEST HERE
      // ... and emit an AccountCreated event with expected values
      // INSERT TEST HERE
    }))

    it('should reject as expected if we create account with incorrect fee', contract('Bank', async ({ accounts, instance }) => {
      // when ... we create an account with the incorrect fee
      // then ... should reject as expected
      // INSERT TEST HERE
    }))
  })

  describe('myBalance', () => {
    it('should return the balance of the our account', contract('Bank', async ({ accounts, instance }) => {
      // given
      // ... an active account exists for address 0 with a balance of 123
      // INSERT TEST HERE

      // when
      // ... we check the balance for the account owned by address 0
      // INSERT TEST HERE

      // then ... should return the correct balance
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to check our account balance when we do not have an account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we check the balance for the address 0's account
      // then ... should reject as expected
      // INSERT TEST HERE
    }))
  })

  describe('deposit', () => {
    it('should increment the balance of our account as expected', contract('Bank', async ({ web3, accounts, instance }) => {
      // given ... an active account exists for address 0 with a balance of 0
      // INSERT TEST HERE

      // when ... we deposit 123 Ether into the address 0's account
      // INSERT TEST HERE

      // then
      // ... should have cost address 0 123 wei after gas fees
      // INSERT TEST HERE

      // ... should have incremented address 0's account balance as expected
      // INSERT TEST HERE

      // ... should have emitted a Deposit event with expected values
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to deposit without an active account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we deposit 123 Eth into address 0's account
      // then ... should reject as expected
      // INSERT TEST HERE
    }))
  })

  describe('withdraw', () => {
    it('should decrement the balance of our account as expected', contract('Bank', async ({ web3, accounts, instance }) => {
      // given ... an active account exists for address 0 with a balance of 123
      // INSERT TEST HERE

      // when ... we withdraw 24 Ether from address 0's account
      // INSERT TEST HERE

      // then
      // ... should have credited address 0's with 123 wei excluding transaction gas fees
      // INSERT TEST HERE

      // ... should have decremented address 0's account balance as expected
      // INSERT TEST HERE

      // ... should have emitted a Withdraw event with expected values
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to withdraw without an active account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we withdraw 24 Eth from address 0's account
      // then ... should reject as expected
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to withdraw more funds than are available', contract('Bank', async ({ accounts, instance }) => {
      // given ... an active account exists for address 0 with a 27 Eth balance
      // INSERT TEST HERE

      // when ... we withdraw 30 Eth from address 0's account
      // then ... should reject as expected
      // INSERT TEST HERE
    }))
  })

  describe('transfer', () => {
    it('should transfer requested Eth amount from our account to target account', contract('Bank', async ({ web3, accounts, instance }) => {
      // given
      // ... an active account exists for address 0 with a balance of 123
      // INSERT TEST HERE
      // ... and an active account exists for address 2 with a balance of 10
      // INSERT TEST HERE

      // when ... we transfer 24 Ether from address 0's account to address 1's account
      // INSERT TEST HERE

      // then
      // ... should have decremented address 0's account balance as expected
      // INSERT TEST HERE

      // ... should have incremented address 2's account balance as expected
      // INSERT TEST HERE

      // ... should have emitted a Transfer event with expected values
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to transfer without an active account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we transfer 24 Eth from address 0's account to anywhere
      // then ... should reject as expected
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to transfer more funds than are available', contract('Bank', async ({ accounts, instance }) => {
      // given
      // ... an active account exists for address 0 with a 27 Eth balance
      // INSERT TEST HERE
      // ... and an active account exists for address 2 with a zero balance
      // INSERT TEST HERE

      // when ... we attempt to transfer 30 Eth from address 0's account
      // then ... should reject as expected
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to transfer funds to a non-existing / inactive account', contract('Bank', async ({ accounts, instance }) => {
      // given
      // ... an active account exists for address 0 with a 123 Eth balance
      // INSERT TEST HERE
      // ... but no active account exists for address 2

      // when ... we attempt to transfer 30 Eth from address 0's account to address 2's account
      // then ... should reject as expected
      // INSERT TEST HERE
    }))
  })
})
