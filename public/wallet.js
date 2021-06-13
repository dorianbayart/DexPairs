
const NETWORK = {
  ETHEREUM: 'ETHEREUM',
  POLYGON: 'POLYGON',
  BSC: 'BSC'
}
const REQUESTS = {
  ETHEREUM: {
    tokentx: 'https://api.etherscan.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  POLYGON: {
    tokentx: 'https://api.polygonscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  BSC : {
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

let web3 = null
let walletAddress = ''
let wallet = {}
let upToDate = false


const Web3 = require(['./web3.min.js'], function(Web3) {
  web3 = new Web3("https://cloudflare-eth.com")
  /*
  web3.eth.getBalance(walletAddress).then(balance => {
    console.log('ETH: ' + web3.utils.fromWei(balance, 'ether'))
  })
  */
  web3.eth.getGasPrice().then(gas => {
    console.log('Gas Price: ' + web3.utils.fromWei(gas, 'gwei'))
  })

})





// defines event on search field
document.getElementById('input-wallet').addEventListener("keyup", function(e) {
  const inputContainer = document.getElementById('input-wallet-container')
  let walletValue = e.target.value

  if(web3.utils.isAddress(walletValue)) {
    inputContainer.classList.remove('margin-top')
    walletAddress = walletValue
    sessionStorage.setItem('walletAddress', JSON.stringify(walletAddress))
    if(!upToDate || walletAddress !== JSON.parse(sessionStorage.getItem('walletAddress'))) {
      getTokenTx(NETWORK.ETHEREUM)
      getTokenTx(NETWORK.POLYGON)
      getTokenTx(NETWORK.BSC)
    }
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

      upToDate = true
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

      changeProgress()
    }
  }
  xmlhttp.open("GET", REQUESTS[network].tokenbalance.replace('WALLET_ADDRESS', walletAddress).replace('CONTRACT_ADDRESS', contractAddress), true)
  xmlhttp.send()
}

function getTokenBalanceWeb3(contractAddress, network) {
  // Get ERC20 Token contract instance
  let contract = new web3.eth.Contract(minABI, contractAddress)

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
      balance: 0,
      value: 0
    }
  })
  Object.keys(wallet).filter(contractAddress => wallet[contractAddress].network === network).forEach((contractAddress, i) => {
    switch (network) {
      case NETWORK.ETHEREUM:
        setTimeout(function(){ getTokenBalanceWeb3(contractAddress, network) }, (i+1) * 250)
        break;
      case NETWORK.POLYGON:
        setTimeout(function(){ getTokenBalance(contractAddress, network) }, (i+1) * 400)
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
  filteredWallet().forEach(function (token) {
    let li = document.createElement('li')
    ul.appendChild(li)

    li.innerHTML += wallet[token.address].network + ' ' + wallet[token.address].tokenSymbol + ' ' + displayBalance(wallet[token.address].value, wallet[token.address].tokenDecimal)
    li.addEventListener("click", function(e) {

    })
  })
  document.getElementById('wallet').appendChild(ul)
}



/* Utils - Progress Bar */
const changeProgress = () => {
  const progressbar = document.getElementById('progress-bar');
  const increment = 100 / Object.keys(wallet).length
  if(progressbar.style.width && progressbar.style.width.length > 0) {
    progressbar.style.width = `calc(${progressbar.style.width} + ${increment}%)`
  } else {
    progressbar.style.width = `${increment}%`
  }

  displayWallet()
};

/* Utils - Wallet with not null value token */
const filteredWallet = () => {
  const filtered = Object.keys(wallet).filter(address => wallet[address].upToDate && wallet[address].value !== '0').map(
    address =>
    ({ address: address, ...wallet[address] })
  )
  return filtered
}

/* Utils - Display balance from value */
const displayBalance = (value, decimal) => {
  return value * Math.pow(10, -decimal)
}
