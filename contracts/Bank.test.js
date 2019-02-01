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
      // INSERT TEST HERE
    }))
  })

  describe('isMyAccountActive', () => {
    it('should return false if sender account does not exist', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))
  })

  describe('createAccount', () => {
    it('should create an activated account for sender', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we create account with incorrect fee', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))
  })

  describe('myBalance', () => {
    it('should return the balance of the our account', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to check our account balance when we do not have an account', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))
  })

  describe('deposit', () => {
    it('should increment the balance of our account as expected', contract('Bank', async ({ web3, accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to deposit without an active account', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))
  })

  describe('withdraw', () => {
    it('should decrement the balance of our account as expected', contract('Bank', async ({ web3, accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to withdraw without an active account', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to withdraw more funds than are available', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))
  })

  describe('transfer', () => {
    it('should transfer requested Eth amount from our account to target account', contract('Bank', async ({ web3, accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to transfer without an active account', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to transfer more funds than are available', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))

    it('should reject as expected if we attempt to transfer funds to a non-existing / inactive account', contract('Bank', async ({ accounts, instance }) => {
      // INSERT TEST HERE
    }))
  })
})
