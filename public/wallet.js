
const NETWORK = {
  ETHEREUM: 'ETHEREUM',
  POLYGON: 'POLYGON',
  BSC: 'BSC'
}
const REQUESTS = {
  ETHEREUM: {
    rpc: 'https://cloudflare-eth.com',
    tokentx: 'https://api.etherscan.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  POLYGON: {
    tokentx: 'https://api.polygonscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  BSC : {
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
  //web3_polygon = new Web3(REQUESTS.POLYGON.rpc)
  web3_bsc = new Web3(REQUESTS.BSC.rpc)
  /*
  web3_ethereum.eth.getBalance(walletAddress).then(balance => {
    console.log('ETH: ' + web3.utils.fromWei(balance, 'ether'))
  })
  */
  web3_ethereum.eth.getGasPrice().then(gas => {
    console.log('Gas Price on Ethereum: ' + web3_ethereum.utils.fromWei(gas, 'gwei'))
  })
  /*web3_polygon.eth.getGasPrice().then(gas => {
    console.log('Gas Price on Polygon: ' + web3_polygon.utils.fromWei(gas, 'gwei'))
  })*/
  web3_bsc.eth.getGasPrice().then(gas => {
    console.log('Gas Price on BSC: ' + web3_bsc.utils.fromWei(gas, 'gwei'))
  })

})





// defines event on search field
document.getElementById('input-wallet').addEventListener("keyup", function(e) {
  const inputContainer = document.getElementById('input-wallet-container')
  let walletValue = e.target.value

  if(walletValue === walletAddress) { return }

  if(web3_ethereum.utils.isAddress(walletValue)) {
    inputContainer.classList.remove('margin-top')

    if(JSON.parse(sessionStorage.getItem('walletAddress')) === walletValue) {
      wallet = sessionStorage.getItem('wallet') ? JSON.parse(sessionStorage.getItem('wallet')) : {}
      displayWallet()
    }

    Object.keys(wallet).forEach(address => {
      wallet[address].upToDate = false
    })

    walletAddress = walletValue
    //if(walletAddress !== JSON.parse(sessionStorage.getItem('walletAddress'))) {
      getTokenTx(NETWORK.ETHEREUM)
      getTokenTx(NETWORK.POLYGON)
      getTokenTx(NETWORK.BSC)
      sessionStorage.setItem('walletAddress', JSON.stringify(walletAddress))
    //}
    e.target.blur()
  } else if (!inputContainer.classList.contains('margin-top')) {
    inputContainer.classList.add('margin-top')
  }

})




// get token transactions list
function getTokenTx(network) {
  var xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      if(data.status !== '1') {
        setTimeout(function(){ getTokenTx(network) }, 5250)
        return
      }
      const tokentx = data.result
      sessionStorage.setItem('tokentx-' + network, JSON.stringify(tokentx))

      searchTokens(network)
    }
  }
  xmlhttp.open("GET", REQUESTS[network].tokentx.replace('WALLET_ADDRESS', walletAddress), true)
  xmlhttp.send()
}


// get token balance
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

      if(wallet[contractAddress].value !== '0') {
        console.log(
          wallet[contractAddress].network,
          wallet[contractAddress].tokenSymbol,
          displayBalance(wallet[contractAddress].value, wallet[contractAddress].tokenDecimal)
        )
      }

      sessionStorage.setItem('wallet', JSON.stringify(wallet))

      changeProgress()
    }
  }
  xmlhttp.open("GET", REQUESTS[network].tokenbalance.replace('WALLET_ADDRESS', walletAddress).replace('CONTRACT_ADDRESS', contractAddress), true)
  xmlhttp.send()
}

function getTokenBalanceWeb3(contractAddress, network) {
  // Get ERC20 Token contract instance
  let contract = null;
  
  new getWeb3(network).eth.Contract(minABI, contractAddress)

  // Call balanceOf function
  contract.methods.balanceOf(walletAddress).call((error, value) => {
    wallet[contractAddress].value = value
    wallet[contractAddress].upToDate = true

    if(wallet[contractAddress].value !== '0') {
      console.log(
        wallet[contractAddress].network,
        wallet[contractAddress].tokenSymbol,
        displayBalance(wallet[contractAddress].value, wallet[contractAddress].tokenDecimal)
      )
    }

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
    switch (network) {
      case NETWORK.ETHEREUM:
        setTimeout(function(){ getTokenBalanceWeb3(contractAddress, network) }, (i+1) * 400)
        break;
      case NETWORK.POLYGON:
        setTimeout(function(){ getTokenBalance(contractAddress, network) }, (i+1) * 400)
        break;
      case NETWORK.BSC:
        setTimeout(function(){ getTokenBalanceWeb3(contractAddress, network) }, (i+1) * 400)
        break;
      default:
        setTimeout(function(){ getTokenBalance(contractAddress, network) }, (i+1) * 5250)
    }
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

    let spanNetwork = document.createElement('span')
    spanNetwork.innerHTML = wallet[token.address].network
    spanNetwork.classList.add('network')
    li.appendChild(spanNetwork)

    let spanSymbol = document.createElement('span')
    spanSymbol.innerHTML = wallet[token.address].tokenSymbol
    spanSymbol.classList.add('symbol')
    li.appendChild(spanSymbol)

    let spanBalance = document.createElement('span')
    spanBalance.innerHTML = displayBalance(wallet[token.address].value, wallet[token.address].tokenDecimal)
    spanBalance.classList.add('balance')
    li.appendChild(spanBalance)

    ul.appendChild(li)

    li.addEventListener("click", function(e) {

    })
  })
  document.getElementById('wallet').appendChild(ul)
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
