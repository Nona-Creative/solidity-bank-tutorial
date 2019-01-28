const R = require('ramda')
const path = require('path')
const { Web3Utils } = require('ethereum-utils')

const ContractTestUtils = require('../utils/contract-test-utils')

// -----------------------------
// generic utils
// -----------------------------

const getFunctionArgNames = (f) => {
  // match everything inside the function argument parens
  // TODO: handle no match
  const args = f.toString().match(/.*?\(([^)]*)\)/)[1]

  // split the arguments string into an array comma delimited
  return args
    .split(',')
    // ensure no inline comments are parsed and trim the whitespace
    .map((arg) => arg.replace(/\/\*.*\*\//, '').trim())
    // ensure no undefined values are added
    .filter(x => x)
}

// -----------------------------
// test utils
// -----------------------------

const testWrapper = (f, g) => (
  getFunctionArgNames(f).includes('done')
    ? () => new Promise(res => g(res))
    : () => g()
)

// -----------------------------
// eth test utils
// -----------------------------

const buildConfig = R.applySpec({
  web3: R.propOr(Web3Utils.getWeb3(), 'web3'),
  accounts: R.propOr([], 'accounts'),
  contracts: R.propOr({}, 'contracts'),
})

const Contract = (contracts) => {
  let config

  try {
    config = require(path.join(process.cwd(), 'ethereum-tests.js'))
  } catch (e) {
    throw new Error('ethereum-test-utils : contract : please create a config: ethereum-tests.js')
  }

  config = buildConfig(config)

  if (config.accounts.length === 0) {
    throw new Error('ethereum-test-utils : contract : please provide at least one account in config: ethereum-tests.js')
  }

  const ownerAccount = R.head(R.prop('accounts', config))

  const builder = ContractTestUtils.build(R.prop('web3', config), ownerAccount, contracts)

  return {
    create: (name, f) => {
      if (name === undefined || f === undefined) {
        throw new Error('ethereum-test-utils : contract : please provide contract name and test function')
      }

      return testWrapper(f, async (...args) => {
        const contractId = R.pathOr(null, ['contracts', name], config)

        if (contractId === null) {
          throw new Error(`ethereum-test-utils : contract : requested contract ${name} does not exist in config: ethereum-tests.js`)
        }

        const instance = await builder(contractId)

        return f({
          name,
          instance,
          ...R.pick(['web3', 'accounts'], config),
        }, ...args)
      })
    }
  }
}

module.exports.Contract = Contract
