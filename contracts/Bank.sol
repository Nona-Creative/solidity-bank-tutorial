pragma solidity ^0.4.24;


contract Bank {
  mapping(address => bool) private accounts;
  mapping(address => uint256) private balances;
  uint256 public createAccountFee = 1000;

  event AccountCreated(address accountAddress);

  function isMyAccountActive() external view returns (bool) {
    return accounts[msg.sender];
  }

  function createAccount() external payable {
    require(msg.value == createAccountFee, "Please provide the correct account creation fee");
    accounts[msg.sender] = true; // create and activate account
    emit AccountCreated(msg.sender);
  }
}
