pragma solidity ^0.4.24;

import "./common/libs/SafeMath.sol";


contract Bank {
  using SafeMath for uint256;

  // ------------------------------------------
  // properties
  // ------------------------------------------

  mapping(address => bool) private accounts;
  mapping(address => uint256) private balances;
  uint256 public createAccountFee = 1000;

  // ------------------------------------------
  // events
  // ------------------------------------------

  event AccountCreated(address accountAddress);
  event Deposit(address accountAddress, uint256 amount, uint256 balance);
  event Withdraw(address accountAddress, uint256 amount, uint256 balance);
  event Transfer(address fromAccountAddress, address toAccountAddress, uint256 amount, uint256 balance);

  // ------------------------------------------
  // external API
  // ------------------------------------------

  function isMyAccountActive() external view returns (bool) {
    return accounts[msg.sender];
  }

  function createAccount() external payable {
    require(msg.value == createAccountFee, "Please provide the correct account creation fee");
    activateAccount(msg.sender); // activate account
    emit AccountCreated(msg.sender);
  }

  function myBalance() external view returns (uint256) {
    require(accounts[msg.sender], "Please create an account first");
    return balances[msg.sender];
  }

  function deposit() external payable {
    require(accounts[msg.sender], "Please create an account first");
    incBalance(msg.sender, msg.value);
    emit Deposit(msg.sender, msg.value, balances[msg.sender]);
  }

  // NOTE: All the fees of a transaction (including any internal transactions it triggers)
  // are paid by the transaction sender. Contracts cannot pay gas fees.
  function withdraw(uint256 amount) external {
    require(accounts[msg.sender], "Please create an account first");
    require(balances[msg.sender] >= amount, "Insufficient funds");
    msg.sender.transfer(amount);
    decBalance(msg.sender, amount);
    emit Withdraw(msg.sender, amount, balances[msg.sender]);
  }

  function transfer(address toAccount, uint256 amount) external {
    require(accounts[msg.sender], "Please create an account first");
    require(balances[msg.sender] >= amount, "Insufficient funds");
    require(accounts[toAccount], "Invalid target account");
    incBalance(toAccount, amount);
    decBalance(msg.sender, amount);
    emit Transfer(msg.sender, toAccount, amount, balances[msg.sender]);
  }

  // ------------------------------------------
  // internal utilities
  // ------------------------------------------

  function incBalance(address account, uint256 amount) internal {
    balances[account] = balances[account].add(amount);
  }

  function decBalance(address account, uint256 amount) internal {
    balances[account] = balances[account].sub(amount);
  }

  function activateAccount(address account) internal {
    accounts[account] = true;
  }
}
