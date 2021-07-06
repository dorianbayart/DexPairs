
const NETWORK = {
  ETHEREUM: 'ETHEREUM',
  POLYGON: 'POLYGON',
  BSC: 'BSC'
}
const REQUESTS = {
  ETHEREUM: {
    name: 'Ethereum',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/ethereum-icon.svg',
    rpc: 'https://cloudflare-eth.com',
    tokentx: 'https://api.etherscan.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  POLYGON: {
    name: 'Polygon/Matic',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/polygon-icon.svg',
    rpc: 'https://rpc-mainnet.maticvigil.com',
    tokentx: 'https://api.polygonscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  BSC : {
    name: 'Binance Smart Chain',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/bsc-icon.svg',
    rpc: 'https://bsc-dataseed.binance.org',
    tokentx: 'https://api.bscscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  }
}

const minABI = [
       // balanceOf
       {
         "constant":true,
         "inputs":[{"name":"_owner","type":"address"}],
         "name":"balanceOf",
         "outputs":[{"name":"balance","type":"uint256"}],
         "type":"function"
       },
       // decimals
       {
         "constant":true,
         "inputs":[],
         "name":"decimals",
         "outputs":[{"name":"","type":"uint8"}],
         "type":"function"
       }
     ]

let web3_ethereum = null
let web3_polygon = null
let web3_bsc = null
let walletAddress = ''
let wallet = {}


const Web3 = require(['./lib/web3.min.js'], function(Web3) {
  web3_ethereum = new Web3(REQUESTS.ETHEREUM.rpc)
  web3_polygon = new Web3(REQUESTS.POLYGON.rpc)
  web3_bsc = new Web3(REQUESTS.BSC.rpc)
  
  web3_ethereum.eth.getGasPrice().then(gas => {
    console.log('Gas Price on Ethereum: ' + web3_ethereum.utils.fromWei(gas, 'gwei'))
  })
  web3_polygon.eth.getGasPrice().then(gas => {
    console.log('Gas Price on Polygon: ' + web3_polygon.utils.fromWei(gas, 'gwei'))
  })
  web3_bsc.eth.getGasPrice().then(gas => {
    console.log('Gas Price on BSC: ' + web3_bsc.utils.fromWei(gas, 'gwei'))
  })
})



// defines event on search field
document.getElementById('input-wallet').addEventListener("keyup", function(e) {
  let inputAddress = e.target.value
  configureWallet(inputAddress)
  e.target.blur()
})

// search transactions / tokens for the specified wallet address
function configureWallet(inputAddress) {
  const inputContainer = document.getElementById('input-wallet-container')
  inputContainer.classList.remove('margin-top')
  if(inputAddress === walletAddress) { return }
  
  if(!web3_ethereum) {
    setTimeout(function(){ configureWallet(inputAddress) }, 500)
    return
  }

  if(web3_ethereum.utils.isAddress(inputAddress)) {
    if(sessionStorage.getItem('walletAddress') === inputAddress) {
      wallet = sessionStorage.getItem('wallet') ? JSON.parse(sessionStorage.getItem('wallet')) : {}
      displayWallet()
    }

    Object.keys(wallet).forEach(address => {
      wallet[address].upToDate = false
    })

    walletAddress = inputAddress

    getTokenTx(NETWORK.ETHEREUM)
    getTokenTx(NETWORK.POLYGON)
    getTokenTx(NETWORK.BSC)
    sessionStorage.setItem('walletAddress', walletAddress)
  } else if (!inputContainer.classList.contains('margin-top')) {
    inputContainer.classList.add('margin-top')
  }
}



// get token transactions list
function getTokenTx(network) {
  var xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      const tokentx = data.result
      sessionStorage.setItem('tokentx-' + network, JSON.stringify(tokentx))

      searchTokens(network)
    }
  }
  xmlhttp.open("GET", REQUESTS[network].tokentx.replace('WALLET_ADDRESS', walletAddress), true)
  xmlhttp.send()
}


// get token balance - Not used
function getTokenBalance(contractAddress, network) {
  if(wallet[contractAddress].upToDate) {
    return
  }

  var xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status == 200 && this.responseText) {

      var data = JSON.parse(this.responseText)
      if(data.status !== '1') {
        return
      }
      const tokenValue = data.result

      wallet[contractAddress].value = tokenValue
      wallet[contractAddress].upToDate = true

      sessionStorage.setItem('wallet', JSON.stringify(wallet))

      changeProgress()
    }
  }
  xmlhttp.open("GET", REQUESTS[network].tokenbalance.replace('WALLET_ADDRESS', walletAddress).replace('CONTRACT_ADDRESS', contractAddress), true)
  xmlhttp.send()
}

// Get token balance
function getTokenBalanceWeb3(contractAddress, network) {
  // Get ERC20 Token contract instance
  let contract = getContract(contractAddress, network)

  // Call balanceOf function
  contract.methods.balanceOf(walletAddress).call((error, value) => {
    wallet[contractAddress].value = value
    wallet[contractAddress].upToDate = true

    changeProgress()
  })
}


function searchTokens(network) {
  const tokentx = JSON.parse(sessionStorage.getItem('tokentx-' + network))
  tokentx.forEach((item, i) => {
    wallet[item.contractAddress] = {
      network: network,
      tokenSymbol: item.tokenSymbol,
      tokenName: item.tokenName,
      tokenDecimal: item.tokenDecimal,
      value: '0'
    }
  })
  
  Object.keys(wallet).filter(contractAddress => wallet[contractAddress].network === network).forEach((contractAddress, i) => {
    setTimeout(function(){ getTokenBalanceWeb3(contractAddress, network) }, (i+1) * 300)
  })
}


// Display Wallet
function displayWallet() {
  document.getElementById('wallet').innerHTML = null;
  ul = document.createElement('ul')
  filteredWallet()
    .sort(function(a, b) {
      if(a.network === NETWORK.ETHEREUM && b.network !== NETWORK.ETHEREUM
        || a.network === NETWORK.POLYGON && b.network === NETWORK.BSC) return -1
      if(a.network === NETWORK.POLYGON && b.network === NETWORK.ETHEREUM
        || a.network === NETWORK.BSC && b.network === NETWORK.POLYGON) return 1
      return 0
    })
    .forEach(function (token) {
    let li = document.createElement('li')
    li.title = wallet[token.address].tokenName

    let spanNetwork = document.createElement('span')
    spanNetwork.classList.add('network')
    spanNetwork.appendChild(createNetworkImg(wallet[token.address].network))
    li.appendChild(spanNetwork)

    let spanSymbol = document.createElement('span')
    spanSymbol.innerHTML = wallet[token.address].tokenSymbol
    spanSymbol.classList.add('symbol')
    li.appendChild(spanSymbol)

    let spanBalance = document.createElement('span')
    spanBalance.innerHTML = displayBalance(wallet[token.address].value, wallet[token.address].tokenDecimal)
    spanBalance.classList.add('balance')
    li.appendChild(spanBalance)
    
    let spanValue = document.createElement('span')
    spanValue.innerHTML = displayBalance(wallet[token.address].value, wallet[token.address].tokenDecimal)
    spanValue.classList.add('value')
    li.appendChild(spanBalance)

    ul.appendChild(li)

    li.addEventListener("click", function(e) {

    })
  })
  document.getElementById('wallet').appendChild(ul)
}



/* MAIN */
initializeHTML()




function initializeHTML() {
  if(sessionStorage.getItem('walletAddress')) {
    const address = sessionStorage.getItem('walletAddress')
    document.getElementById('input-wallet').value = address
    configureWallet(address)
  }
}


/* Utils - Return the web3 to use depending on the network */
const getWeb3 = (network) => {
  switch (network) {
      case NETWORK.ETHEREUM:
        return web3_ethereum
      case NETWORK.POLYGON:
        return web3_polygon
      case NETWORK.BSC:
        return web3_bsc
      default:
        return
    }
}

/* Utils - Return the Contract depending on the network */
const getContract = (contractAddress, network) => {
  switch (network) {
      case NETWORK.ETHEREUM:
        return new web3_ethereum.eth.Contract(minABI, contractAddress)
      case NETWORK.POLYGON:
        return new web3_polygon.eth.Contract(minABI, contractAddress)
      case NETWORK.BSC:
        return new web3_bsc.eth.Contract(minABI, contractAddress)
      default:
        return
    }
}


/* Utils - Create a document network img tag */
const createNetworkImg = (network) => {
  let img = document.createElement('img')
  img.src = REQUESTS[network].img
  img.alt = REQUESTS[network].name
  img.title = img.alt
  img.classList.add('network')
  return img
}

/* Utils - Progress Bar */
const changeProgress = () => {
  const progressbar = document.getElementById('progress-bar');
  const width = Object.keys(wallet).filter(address => wallet[address].upToDate).length / Object.keys(wallet).length * 100
  progressbar.style.width = `${width}%`

  displayWallet()
};

/* Utils - Wallet with not null value token */
const filteredWallet = () => {
  const filtered = Object.keys(wallet)
    .filter(address => wallet[address].value !== '0')
    .map(
      address => ({ address: address, ...wallet[address] })
    )
  return filtered
}

/* Utils - Display balance from value */
const displayBalance = (value, decimal) => {
  return precise(value * Math.pow(10, -decimal))
}

// Round number
const precise = (x) => {
  if(x > 9999) { return Math.round(x) }
  else if(x > 0.0001) { return Number.parseFloat(x).toPrecision(5) }
  return Number.parseFloat(x).toPrecision(2)
}
