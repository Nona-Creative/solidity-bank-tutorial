const path = require('path')
const fs = require('fs')
const solc = require('solc')
const R = require('ramda')
const find = require('find')

require('dotenv').config()

//-----------------------------------------
// findImports
//-----------------------------------------

// returns the path of the first match for provided file path from provided base dir
const findFirstPathRecursively = (filePath, base) => {
  const predicate = R.compose(R.head, R.match(new RegExp(`${filePath}$`)))
  return R.compose(
    R.head,
    R.filter(predicate),
    find.fileSync,
  )(base)
}

module.exports.findFirstPathRecursively = R.curry(findFirstPathRecursively)

// find missing imports for SolC
// takes a path and returns the contents of the found file in an object {contents: ...}
const findImports = _path => (
  R.compose(
    contents => ({contents}),
    R.tryCatch(x => fs.readFileSync(x, 'utf8'), R.always('')),
    module.exports.findFirstPathRecursively(_path),
  )(path.resolve(process.cwd(), 'contracts'))
)

module.exports.findImports = findImports

//-----------------------------------------
// compile
//-----------------------------------------

const _compilePrepareSourcesKey = R.compose(
  R.last,
  R.split('/'),
  x => `${x}.sol`,
)

const _compilePrepareSourcesValue = R.compose(
  R.tryCatch(x => fs.readFileSync(x, 'utf8'), R.always('')),
  x => path.resolve(process.cwd(), 'contracts', ...x),
  R.split('/'),
  x => `${x}.sol`,
)

// takes a list of paths and returns an object
// with the filenames as keys
// and file contents as values
const prepareSourcesForCompile = R.converge(
  R.zipObj,
  [
    R.map(_compilePrepareSourcesKey),
    R.map(_compilePrepareSourcesValue),
  ],
)

module.exports.prepareSourcesForCompile = prepareSourcesForCompile

const compile = async (contractImports) => {
  const sources = prepareSourcesForCompile(contractImports)
  const {errors, contracts} = solc.compile({sources}, 1, findImports)

  if (errors) {
    console.log("compilation failed")
    throw Error(errors)
  }

  return contracts
}

module.exports.compile = compile

//-----------------------------------------
// deploy
//-----------------------------------------

// deploy single compiled contracts
const deploy = async (web3, account, compiledContract) => {
  // build contract
  const abi = JSON.parse(compiledContract.interface)
  const bytecode = compiledContract.bytecode
  const _contract = new web3.eth.Contract(abi).deploy({data: bytecode})

  // skip contracts that did not build (they are probably interfaces)
  if (_contract === null) {
    return
  }

  // deploy
  const gas = await _contract.estimateGas()
  return await _contract.send({from: account, gas})
}

module.exports.deploy = deploy

// deploy multiple compiled contracts
const deployAll = async (web3, account, contracts) => {
  // prepare provided contracts
  const promises = R.map(
    async x => await deploy(web3, account, x),
    Object.values(contracts),
  )

  // deploy provided contracts
  const values = await Promise.all(promises)

  // return those that compiled and deployed (are not null)
  return R.filter(
    R.compose(R.not, R.equals(null)),
    R.zipObj(R.keys(contracts), values),
  )
}

module.exports.deployAll = deployAll

//-----------------------------------------
// build (compile & deploy)
//-----------------------------------------

// instantiate Web3,
// compile contract (if not already done),
// deploy it to the current web3 network,
// and return web3, accounts and contract instance
const build = (web3, managerAccount, filePaths) => {
  // caches
  let compileCache = {}

  return async contractKey => {
    // compile
    if (Object.keys(compileCache).length === 0) {
      compileCache = R.mergeDeepRight(compileCache, await compile(filePaths, contractKey))
    }

    // deploy
    const instances = await deployAll(web3, managerAccount, compileCache, arguments)

    return instances[contractKey]
  }
}

module.exports.build = build
