const { Web3Utils } = require('ethereum-utils')

module.exports = {
  web3: Web3Utils.getWeb3(),
  accounts: [
    process.env.ACCOUNT1_ADDRESS,
    process.env.ACCOUNT2_ADDRESS,
    process.env.ACCOUNT3_ADDRESS,
  ],
  accountPKs: [
    process.env.ACCOUNT1_PK,
    process.env.ACCOUNT2_PK,
    process.env.ACCOUNT3_PK,
  ],
  contracts: {
    'Bank': 'Bank.sol:Bank',
  }
}
