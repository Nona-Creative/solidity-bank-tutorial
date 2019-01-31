Bank Contract : TDD
===


Setup
---

Clone [this repo](https://github.com/Nona-Creative/solidity-bank-tutorial) as a starting point, it will include an empty Bank contract and test:

```
contracts/Bank.sol
contracts/Bank.test.js
```

Test will look something like this:

```
const chai = require('chai')
const { ContractUtils } = require('ethereum-utils')
const chaiAsPromised = require('chai-as-promised')

const { Contract } = require('../src/common/utils/ethereum-test-utils')

chai.use(chaiAsPromised)

const { assert } = chai
const { create: contract } = Contract(['Bank'])

describe('Bank', () => {
  // ... tests go here ...
})
```

And contract something like this:

```
pragma solidity ^0.4.24;  


contract Bank {
  // ... contract properties, methods and events etc go here ....
}
```


Test utils
---

When testing our contract, we will not use Truffle, instead we will interact with it using a few utilities (included in the repo mentioned above).

We will interact with methods on our contract that do not result in Ethereum transactions (ie. pure and view functions) using ``ContractUtils.call``, which takes two arguments:
 1. the method we want to invoke
 2. and a config object (including sender address)

We will interact with methods that result in Ethereum transactions using ``ContractUtils.send``, which three arguments:
 1. the method invocation
 2. a config object (including sender address)
 3. and lastly, whether or not it should wait for the transaction to complete before resolving
If we tell this method to wait for the transaction to complete, then we will receive the entire transaction receipt.
If on the other hand we tell it not to wait for the transaction to complete, then we will instead receive only a transaction hash, and would then have to poll the chain with that hash to retrieve the transaction receipt.
This last approach is what we will need to do in the wild, as our transaction may take an indefinite time to mine.
But for testing purposes, waiting for the transaction to complete is very convenient.


Test structure
---

We will be using a BDD style approach to our testing, and so will will endevour to test the overall behaviours (the what our functions do) of our functions as opposed to implementation details (the how our functions do it).

We will ideally test a single behaviour per test, describing this behaviour in the "should ..." form, optionally parametrizing the test to cover multiple scenarios for that behaviour.

We will also group the body of our tests under given, when and then comments, in that order and never repeating unless we are describing a sequence of events.
 - the ``given`` comments will describe the state of the world prior to our test being run
 - the ``when`` comments will describe the call to the function we are testing or SUT (system under test)
 - and finally the ``then`` comments will decribe the expected behaviours we are asserting on


So let's get started TDD'ing our Bank Smart Contract.


Storage properties
---

First we will need some storage properties to maintain our bank contract's state, so let's start with these two:
 - ``accounts`` - a mapping of all the accounts in our bank, with each key being the user's Ethereum address and the value being whether or not the account is active.
 - ``balances`` - another mapping for each account with the user's Ethereum address as the key, but this time the values will be the balances for each account.

These properties will both be private, so let's begin by writing tests to ensure our contract does not expose them directly:

```
describe('access', () => {
  it('should not expose private properties and methods', contract('Bank', async ({ accounts, instance }) => {
    assert.notIncludeMembers(Object.keys(instance.methods), [
      'accounts',
      'balances',
    ])
  }))
})
```

> We'll add to this test as we add more private properties and methods.


Now if we run that it will give us a false positive, so let's being by adding these properties as public properties so we can see the test fail, before we move onto to making it pass properly:

```
mapping(address => bool) public accounts;  
mapping(address => uint256) public balances;
```

We can then make the test pass by simply changing the properties to private:

```
mapping(address => bool) private accounts;  
mapping(address => uint256) private balances;
```

and we should have our first green (pass).


Utility methods
---

We will often find that we need to create various utility methods in order to assert on our contract's state, in the ``given`` and/or ``then`` sections of our tests.
This is fine so long as these methods contribute to the contract's desired functionality and we are happy exposing the functionality the provide.
We will test these methods in stages, initially testing their basic behaviour in isolation, and then further testing additional behaviours as part of the other tests they facilitate, this will make more sense when we write the tests.


Is account active?
---

The first useful bit of functionality we'll add to our contract is one of the utility methods, just described.
This method will allow us to check if an account exists and is active (at this point they are the same).

So let's being by writting the test:

```
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
```

This will initially fail with a type error:

```
TypeError: instance.methods.isMyAccountActive is not a function
```

So let's add the method to the contract, but hardcode a return value of ``true`` to force a more useful failure (red) state:

```
function isMyAccountActive() external pure returns (bool) {  
  return true;  
}
```

Now it fails with an assertion error:

```
AssertionError: expected true to be false
```

So let's make it pass (green):

```
function isMyAccountActive() external view returns (bool) {  
  return accounts[msg.sender];  
}
```

Even though this does not yet cover all possible behaviour for this method, it's as far as we can go at this point, so we'll test the rest of this utility method's behaviour as part of other tests.

Once we're done with all the other contract methods we will return to the ``isMyAccountActive`` tests and add additional tests for completeness, which is important, as we intend for our test to act as documentation for each method's behaviours.


Account creation
---

Now let's get onto account creation.

To begin with we will allow anyone to create an account for free and we will also activate the account immediately upon creation.

And to achieve this we will need a publicly accessible method that updates the ``accounts`` property, by creating a mapping from the sender's address to ``true``.

So let's start with a test that:
 - first checks that no active account exists for the sender.
 - then invokes a ``createAccount`` method with ``ContractUtils.send``.
 - and finally asserts that an account was created / activated.

The account activation checks will be done by invoking the ``isMyAccountActive`` method with ``ContractUtils.call``.

NOTE: we are not doing a "sanity check" ie. invoking ``isMyAccountActive`` prior to invoking ``createAccount`` to check if no account exists, because we are confident that each test is performed on a clean contract state  (thanks to our testing utilities).
That said, from a documentation perspective, it is still usefull to describe this expected state in a ``given`` comment eg.

```
// given ... no active account exists for address 0
```

So here's our test:

```
describe('createAccount', () => {
  it('should create an activated account for sender', contract('Bank', async ({ accounts, instance }) => {
    // given ... no active account exists for address 0
    // when ... we create a new account as address 0
    const tx = await ContractUtils.send(
      instance.methods.createAccount(),
      { from: accounts[0] },
      true,
    )

    // then ... should create an activated account for address 0
    const isActive = await ContractUtils.call(
      instance.methods.isMyAccountActive(),
      { from: accounts[0] },
    )
    assert.isTrue(isActive)
  }))
})
```

So now our test once again fails with a type error because the method we're testing does not exist yet, so let's make it "fail properly":

```
function createAccount() external pure {}
```

Now we have a method that just does nothing, so our test fails, because even though we have called an existing method correctly, it does not behave as expected ie. it does not create an activated account.

And we can easily remedy this as follows:

```
function createAccount() external {  
  accounts[msg.sender] = true; // create and activate account  
}
```

Awesome we are once again at green.


Account creation fee
---

Next let's update our contract so that users need to pay a fee to create an account.

First we'll add a public property to store the amount we'll charge for new accounts, which gives us the opportunity to add a test for access to public properties and methods.

```
describe('access', () => {
  it('should expose public properties and methods', contract('Bank', async ({ accounts, instance }) => {
    assert.includeMembers(Object.keys(instance.methods), [
      'createAccountFee',
    ])
  }))
  
  it('should not expose private properties and methods ...

```

Which fails, so let's make it pass by adding the property to our contract:

```
uint256 public createAccountFee;
```

Next we'll add a dedicated test to assert on it's value:

```
describe('createAccountFee', () => {
  it('should return expected value when called', contract('Bank', async ({ accounts, instance }) => {
    // when ... we get the create account fee
    const result = await ContractUtils.call(
      instance.methods.createAccountFee(),
      { from: accounts[0] },
    )
    // then ... should return expected value
    assert.equal(result, 1000)
  }))
})
```

Which fails because our property has no value so returns 0, so let's add the expected value:

```
uint256 public createAccountFee = 1000;
```

Which should have us back at green.


Require fee for account creation
---

Now let's implement our fee requirement.

First we'll add a test to the ``createAccount`` describe block, to assert that we reject any attempts to create an account without providing the correct fee:

```
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
  )
}))
```

Let's try and get it to green by implementing this requirement:

```
function createAccount() external {
  require(msg.value == createAccountFee);
  accounts[msg.sender] = true; // create and activate account
}
```

Now it still fails, but with the following (very useful) message:

```
Warning: "msg.value" used in non-payable function. Do you want to add the "payable" modifier to this function?
```

Yes, thank you useful error message, we do want to add the "payable" modifier, infact we'll do that right now:

```
function createAccount() external payable {
  ...
```

Now our function is allowed to receive Ether payments, provided as the ``value`` property of our ``ContractUtils.send`` invocation.
And this change now makes our ``should reject ...`` pass, but has the unfortunate side effect of breaking our ``should create an activated account for sender ...`` test.
But this is an easy fix, all we need to do is update that test as follows:

```
it('should create an activated account for sender', contract('Bank', async ({ accounts, instance }) => {
  // given
  // ... no active account exists for address 0
  // when
  // ... we create a new account as address 0
  // ... providing the correct account creation fee
  const createAccountFee = await ContractUtils.call(
    instance.methods.createAccountFee(),
    { from: accounts[0] },
  )
  const tx = await ContractUtils.send(
    instance.methods.createAccount(),
    { from: accounts[0], value: createAccountFee },
    true,
  )
  
  ... the rest stays the same
```

And we're good.

But what did we do there?
 - we added a ``when`` comment
 - reformatted the ``given`` and ``when`` comments
 - fetched the ``createAccountFee`` value
   and passed it along with the ``createAccount`` invocation as: ``value: createAccountFee``

simple.

Moving on, let's add a more useful error message, so that a user attempting to create an account in an invalid way, knows exactly why their attempt failed.

To do this we will first update our ``should reject as expected if we create account with incorrect fee`` test by adding an expected error message to our expected rejection:

```
await assert.isRejected(
  ContractUtils.send(
    instance.methods.createAccount(),
    { from: accounts\[0\], value: 0 },
    true,
  ),
  Error,
  /provide the correct account creation fee/, // <-- add this line
)
```

Which will fail, but we then make it pass by adding the message to our ``require`` like this:

```
require(msg.value == createAccountFee, "Please provide the correct account creation fee");
```

And just like that we're back to green.


Account creation event
---

At this point we can check if an account exists (and is active) by invoking our ``isMyAccountActive`` method.
But this only tells the owner of an account if their specific account exists (and is active), so only constitutes a portion of the total functionality we'll need before we can call this a Bank.

We'll want to keep a history of all the accounts created, and we'll want this to be easily publically accessible, and to do this we will need to emit an event whenver a new account is created.

So let's add a ``AccountCreated`` event and emit it when an account is successfully created.

First we will update our ``should create an activated account for sender`` test by adding the following to the end of it's ``then`` section:

```
// ... and emit an AccountCreated event with expected values
assert.hasAllKeys(tx.events, ['AccountCreated'])
const AccountCreatedEvents = ContractUtils.events('AccountCreated', tx)
assert.equal(AccountCreatedEvents.length, 1)
assert.property(AccountCreatedEvents[0], 'accountAddress')
```

And make it pass by first adding the event definition:

```
event AccountCreated(address accountAddress);
```

and then emitting the event within the method:

```
function createAccount() external payable {
  ...
  emit AccountCreated(msg.sender);
}
```

And that's that.


Conclusion
---

If you've followed along correctly, then your test and contract should look like those in the solutions branch, go ahead and check that out and compare it with what you've got.

So that out of the way we will move onto some challenges:


Challenge 1
---

So you should now have all the tools you need to finish this contract off.

Have a go and see if you can TDD the following methods into the Bank contract:

 - ``myAccountBalance`` - allows an account owner to check the balance of their account
 - ``deposit`` - allows an account owner to deposit Ether into their account
 - ``withdraw`` - allows an account owner to withdraw Ether from their account
 - ``transfer`` - allows an account owner to transfer Ether to another existing account within the Bank

Use the following process:

 1. write a test for the desired functionality, optionally including assertions on the expected events
 2. then add the business logic and event emissions to make it pass
 3. write tests that assert on rejections for invalid invocations (like the account creation fee requirement)
 4. then make them pass by adding the necessary ``require`` statements before your business logic
 5. if need be, update any broken tests, to meet the more stringint requirements you added in step 4

and repeat ...


Challenge 2
---

When creating an application that interacts within an Ethereum smart contract there are 2 things you'll likely need to know how to do:

### 1. How to get a transaction receipt using a transaction hash 

To do this you'll need to poll with the following:

```
await web3.eth.getTransactionReceipt(transactionHash)
```

If not yet available it will return ``null``, 
otherwise it will return a receipt object containing a ``transactionHash`` property.

### 2. How to get all events of a specific type for a specific contract

For example, we can get all the past ``AccountCreated`` events for our contract as follows:

```
const events = await instance.getPastEvents('AccountCreated', { fromBlock: 0, toBlock: 'latest' })
```

### putting them together

Try writing a test that does a ``send`` to ``createAccount`` but with the "wait for transaction to complete" argument set to false.

Then using the transaction hash returned by ``createAccount`` poll for the receipt, and once you have it check that the receipt's ``status`` property is true and that the account has been created (as we did in the ``should create an activated account for sender`` test)

Then use ``getPastEvents`` to find the event that was emitted during the account creation, assert that there is only one and that it was emitted with the correct values.
