


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
    } else {
      wallet = {}
    }

    Object.keys(wallet).forEach(address => {
      wallet[address].upToDate = false
    })

    walletAddress = inputAddress

    Object.keys(NETWORK).forEach((network, i) => {
      getTokenTx(NETWORK[network].enum)
    });

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
  xmlhttp.open("GET", NETWORK[network].tokentx.replace('WALLET_ADDRESS', walletAddress), true)
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
  xmlhttp.open("GET", NETWORK[network].tokenbalance.replace('WALLET_ADDRESS', walletAddress).replace('CONTRACT_ADDRESS', contractAddress), true)
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

    sessionStorage.setItem('wallet', JSON.stringify(wallet))

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
      value: (wallet[item.contractAddress] && wallet[item.contractAddress].value) ? wallet[item.contractAddress].value : '0'
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
    li.title = (wallet[token.address].tokenName && wallet[token.address].tokenName !== '') ? wallet[token.address].tokenName : wallet[token.address].tokenSymbol

    let spanNetwork = document.createElement('span')
    spanNetwork.classList.add('network')
    spanNetwork.appendChild(createNetworkImg(wallet[token.address].network))
    li.appendChild(spanNetwork)

    let spanSymbol = document.createElement('span')
    spanSymbol.innerHTML = (wallet[token.address].tokenName && wallet[token.address].tokenName !== '') ? wallet[token.address].tokenName : wallet[token.address].tokenSymbol
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


/* Utils - Return the Contract depending on the network */
const getContract = (contractAddress, network) => {
  switch (network) {
      case NETWORK.ETHEREUM.enum:
        return new web3_ethereum.eth.Contract(minABI, contractAddress)
      case NETWORK.POLYGON.enum:
        return new web3_polygon.eth.Contract(minABI, contractAddress)
      case NETWORK.FANTOM.enum:
        return new web3_fantom.eth.Contract(minABI, contractAddress)
      case NETWORK.XDAI.enum:
        return new web3_xdai.eth.Contract(minABI, contractAddress)
      case NETWORK.BSC.enum:
        return new web3_bsc.eth.Contract(minABI, contractAddress)
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
    .filter(address => wallet[address].value && wallet[address].value !== '0')
    .map(
      address => ({ address: address, ...wallet[address] })
    )
  return filtered
}

/* Utils - Display balance from value */
const displayBalance = (value, decimal) => {
  if(value && value > 0) {
    return precise(value * Math.pow(10, -decimal))
  } else {
    return 0
  }
}
