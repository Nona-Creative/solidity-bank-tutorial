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
      assert.includeMembers(Object.keys(instance.methods), [
        'createAccountFee',
        'createAccount',
        'myBalance',
        'deposit',
        'withdraw',
        'transfer',
      ])
    }))

    it('should not expose private properties and methods', contract('Bank', async ({ accounts, instance }) => {
      assert.notIncludeMembers(Object.keys(instance.methods), [
        'accounts',
        'balances',
        'incBalance',
        'decBalance',
        'activateAccount',
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
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
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
      assert.equal(AccountCreatedEvents[0].accountAddress.toLowerCase(), accounts[0])
    }))

    it('should reject as expected if we create account with incorrect fee', contract('Bank', async ({ accounts, instance }) => {
      // when ... we create an account with the incorrect fee
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.createAccount(),
          { from: accounts[0], value: Web3.utils.toHex(0) },
          true,
        ),
        Error,
        /Please provide the correct account creation fee/,
      )
    }))
  })

  describe('myBalance', () => {
    it('should return the balance of the our account', contract('Bank', async ({ accounts, instance }) => {
      // given
      // ... an active account exists for address 0 with a balance of 123
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
        true,
      )
      await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[0], value: Web3.utils.toHex(123) },
        true,
      )
      // when
      // ... we check the balance for the account owned by address 0
      const balance = await ContractUtils.call(
        instance.methods.myBalance(),
        { from: accounts[0] },
      )

      // then ... should return the correct balance
      assert.equal(balance, 123)
    }))

    it('should reject as expected if we attempt to check our account balance when we do not have an account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we check the balance for the address 0's account
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.myBalance(),
          { from: accounts[0] },
          true,
        ),
        Error,
        /Please create an account first/,
      )
    }))
  })

  describe('deposit', () => {
    it('should increment the balance of our account as expected', contract('Bank', async ({ web3, accounts, instance }) => {
      // given ... an active account exists for address 0 with a balance of 0
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
        true,
      )

      // when ... we deposit 123 Ether into the address 0's account
      const account0BalanceBefore = new BigNumber(await web3.eth.getBalance(accounts[0]))
      const tx = await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[0], value: Web3.utils.toHex(123) },
        true,
      )

      // then
      // ... should have cost address 0 123 wei after gas fees
      const account0BalanceAfter = new BigNumber(await web3.eth.getBalance(accounts[0]))
      const txGasPriceWei = Web3.utils.toWei('6.2', 'gwei')
      const txGasCost = tx.cumulativeGasUsed * txGasPriceWei
      const account0BalanceDiff = account0BalanceBefore.minus(account0BalanceAfter).minus(txGasCost).toNumber()
      assert.equal(account0BalanceDiff, 123)

      // ... should have incremented address 0's account balance as expected
      const balance = await ContractUtils.call(
        instance.methods.myBalance(),
        { from: accounts[0] },
      )
      assert.equal(balance, 123)

      // ... should have emitted a Deposit event with expected values
      assert.hasAllKeys(tx.events, ['Deposit'])
      const DepositEvents = ContractUtils.events('Deposit', tx)
      assert.equal(DepositEvents.length, 1)
      assert.equal(DepositEvents[0].accountAddress.toLowerCase(), accounts[0])
      assert.equal(DepositEvents[0].amount, '123')
      assert.equal(DepositEvents[0].balance, '123')
    }))

    it('should reject as expected if we attempt to deposit without an active account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we deposit 123 Eth into address 0's account
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.deposit(),
          { from: accounts[0], value: Web3.utils.toHex(123) },
          true,
        ),
        Error,
        /Please create an account first/,
      )
    }))
  })

  describe('withdraw', () => {
    it('should decrement the balance of our account as expected', contract('Bank', async ({ web3, accounts, instance }) => {
      // given ... an active account exists for address 0 with a balance of 123
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
        true,
      )
      await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[0], value: Web3.utils.toHex(123) },
        true,
      )

      // when ... we withdraw 24 Ether from address 0's account
      const account0BalanceBefore = new BigNumber(await web3.eth.getBalance(accounts[0]))
      const tx = await ContractUtils.send(
        instance.methods.withdraw(24),
        { from: accounts[0] },
        true,
      )

      // then
      // ... should have credited address 0's with 123 wei excluding transaction gas fees
      const account0BalanceAfter = new BigNumber(await web3.eth.getBalance(accounts[0]))
      const txGasPriceWei = Web3.utils.toWei('6.2', 'gwei')
      const txGasCost = tx.cumulativeGasUsed * txGasPriceWei
      const account0BalanceDiff = account0BalanceBefore.minus(account0BalanceAfter).minus(txGasCost).toNumber()
      assert.equal(account0BalanceDiff, -24)

      // ... should have decremented address 0's account balance as expected
      const balance = await ContractUtils.call(
        instance.methods.myBalance(),
        { from: accounts[0] },
      )
      assert.equal(balance, 99)

      // ... should have emitted a Withdraw event with expected values
      assert.hasAllKeys(tx.events, ['Withdraw'])
      const WithdrawEvents = ContractUtils.events('Withdraw', tx)
      assert.equal(WithdrawEvents.length, 1)
      assert.equal(WithdrawEvents[0].accountAddress.toLowerCase(), accounts[0])
      assert.equal(WithdrawEvents[0].amount, '24')
      assert.equal(WithdrawEvents[0].balance, '99')
    }))

    it('should reject as expected if we attempt to withdraw without an active account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we withdraw 24 Eth from address 0's account
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.withdraw(24),
          { from: accounts[0] },
          true,
        ),
        Error,
        /Please create an account first/,
      )
    }))

    it('should reject as expected if we attempt to withdraw more funds than are available', contract('Bank', async ({ accounts, instance }) => {
      // given ... an active account exists for address 0 with a 27 Eth balance
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
        true,
      )
      await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[0], value: Web3.utils.toHex(27) },
        true,
      )

      // when ... we withdraw 30 Eth from address 0's account
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.withdraw(30),
          { from: accounts[0] },
          true,
        ),
        Error,
        /Insufficient funds/,
      )
    }))
  })

  describe('transfer', () => {
    it('should transfer requested Eth amount from our account to target account', contract('Bank', async ({ web3, accounts, instance }) => {
      // given
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      // ... an active account exists for address 0 with a balance of 123
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
        true,
      )
      await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[0], value: Web3.utils.toHex(123) },
        true,
      )
      // ... and an active account exists for address 2 with a balance of 10
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[2], value: Web3.utils.toHex(createAccountFee) },
        true,
      )
      await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[2], value: Web3.utils.toHex(10) },
        true,
      )

      // when ... we transfer 24 Ether from address 0's account to address 1's account
      const tx = await ContractUtils.send(
        instance.methods.transfer(accounts[2], 24),
        { from: accounts[0] },
        true,
      )

      // then
      // ... should have decremented address 0's account balance as expected
      const account0Balance = await ContractUtils.call(
        instance.methods.myBalance(),
        { from: accounts[0] },
      )
      assert.equal(account0Balance, 99)

      // ... should have incremented address 2's account balance as expected
      const account2Balance = await ContractUtils.call(
        instance.methods.myBalance(),
        { from: accounts[2] },
      )
      assert.equal(account2Balance, 34)

      // ... should have emitted a Transfer event with expected values
      assert.hasAllKeys(tx.events, ['Transfer'])
      const TransferEvents = ContractUtils.events('Transfer', tx)
      assert.equal(TransferEvents.length, 1)
      assert.equal(TransferEvents[0].fromAccountAddress.toLowerCase(), accounts[0])
      assert.equal(TransferEvents[0].toAccountAddress.toLowerCase(), accounts[2])
      assert.equal(TransferEvents[0].amount, '24')
      assert.equal(TransferEvents[0].balance, '99')
    }))

    it('should reject as expected if we attempt to transfer without an active account', contract('Bank', async ({ accounts, instance }) => {
      // given ... no / or inactive account exists for address 0
      // when ... we transfer 24 Eth from address 0's account to anywhere
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.transfer(accounts[2], 24),
          { from: accounts[0] },
          true,
        ),
        Error,
        /Please create an account first/,
      )
    }))

    it('should reject as expected if we attempt to transfer more funds than are available', contract('Bank', async ({ accounts, instance }) => {
      // given
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      // ... an active account exists for address 0 with a 27 Eth balance
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
        true,
      )
      await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[0], value: Web3.utils.toHex(27) },
        true,
      )
      // ... and an active account exists for address 2 with a zero balance
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[2], value: Web3.utils.toHex(createAccountFee) },
        true,
      )

      // when ... we attempt to transfer 30 Eth from address 0's account
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.transfer(accounts[2], 30),
          { from: accounts[0] },
          true,
        ),
        Error,
        /Insufficient funds/,
      )
    }))

    it('should reject as expected if we attempt to transfer funds to a non-existing / inactive account', contract('Bank', async ({ accounts, instance }) => {
      // given
      // ... an active account exists for address 0 with a 123 Eth balance
      const createAccountFee = await ContractUtils.call(
        instance.methods.createAccountFee(),
        { from: accounts[2] },
      )
      await ContractUtils.send(
        instance.methods.createAccount(),
        { from: accounts[0], value: Web3.utils.toHex(createAccountFee) },
        true,
      )
      await ContractUtils.send(
        instance.methods.deposit(),
        { from: accounts[0], value: Web3.utils.toHex(123) },
        true,
      )
      // ... but no active account exists for address 2

      // when ... we attempt to transfer 30 Eth from address 0's account to address 2's account
      // then ... should reject as expected
      await assert.isRejected(
        ContractUtils.send(
          instance.methods.transfer(accounts[2], 30),
          { from: accounts[0] },
          true,
        ),
        Error,
        /Invalid target account/,
      )
    }))
  })
})
