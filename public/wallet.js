
let globalChart = null
let walletValue = 0



// defines event on search field
document.getElementById('input-wallet').addEventListener("change", function(e) {
  let inputAddress = e.target.value
  configureWallet(inputAddress)
})

// search transactions / tokens for the specified wallet address
function configureWallet(inputAddress) {
  const inputContainer = document.getElementById('input-wallet-container')
  const globalInforationContainer = document.getElementById('global')

  if(inputAddress.length > 0 && inputAddress === walletAddress) { return }

  if(!web3_ethereum) {
    setTimeout(function(){ configureWallet(inputAddress) }, 400)
    return
  }

  if(!web3_ethereum.utils.isAddress(inputAddress)) {
    if (!inputContainer.classList.contains('margin-top')) {
      inputContainer.classList.add('margin-top')
    }
    if (!globalInforationContainer.classList.contains('none')) {
      globalInforationContainer.classList.add('none')
    }
    const urlParams = new URLSearchParams(window.location.search)
    if(urlParams.has('address') && window.history.replaceState) {
      window.history.replaceState(null, document.title, window.location.href.split("?")[0]);
    }

    walletAddress = null
    sessionStorage.removeItem('walletAddress', walletAddress)
    wallet = {}
    displayWallet()

    return
  }

  inputContainer.classList.remove('margin-top')
  globalInforationContainer.classList.remove('none')

  if(sessionStorage.getItem('walletAddress') === inputAddress) {
    wallet = sessionStorage.getItem('wallet') ? JSON.parse(sessionStorage.getItem('wallet')) : {}
    displayWallet()
  } else {
    wallet = {}
  }

  Object.keys(wallet).forEach(id => {
    wallet[id].upToDate = false
  })

  walletAddress = inputAddress

  const urlParams = new URLSearchParams(window.location.search)
  if(!urlParams.has('address') && window.history.replaceState) {
    window.history.replaceState(null, walletAddress, window.location + '?address=' + walletAddress);
  }

  Object.keys(NETWORK).forEach((network, i) => {
    getNetworkBalance(NETWORK[network].enum)
    getTokenTx(NETWORK[network].enum)
  });

  sessionStorage.setItem('walletAddress', walletAddress)
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


// Get token balance
function getTokenBalanceWeb3(contractAddress, network) {
  if(contractAddress === '0x0') return

  const id = getId(contractAddress, network)
  // Get ERC20 Token contract instance
  let contract = getContract(contractAddress, network)

  // Call balanceOf function
  contract.methods.balanceOf(walletAddress).call((error, value) => {
    wallet[id].value = value
    wallet[id].price = getPriceByAddressNetwork(contractAddress, wallet[id].network)
    wallet[id].upToDate = true

    sessionStorage.setItem('wallet', JSON.stringify(wallet))

    displayWallet()
  })
}


function searchTokens(network) {
  const tokentx = JSON.parse(sessionStorage.getItem('tokentx-' + network))
  tokentx.forEach((item, i) => {
    const id = getId(item.contractAddress, network)
    wallet[id] = {
      network: network,
      contract: item.contractAddress,
      tokenSymbol: item.tokenSymbol,
      tokenName: item.tokenName,
      tokenDecimal: item.tokenDecimal,
      value: (wallet[id] && wallet[id].value) ? wallet[id].value : '0',
      price: wallet[id] ? wallet[id].price : null
    }
  })

  Object.keys(wallet).filter(id => wallet[id].network === network).forEach((id, i) => {
    setTimeout(function(){ getTokenBalanceWeb3(wallet[id].contract, network) }, (i+1) * 100)
  })
}

function getNetworkBalance(network) {
  getWeb3(network).eth.getBalance(walletAddress).then(balance => {
    const address = NETWORK[network].tokenContract
    wallet[getId(address, network)] = {
      network: network,
      contract: address,
      tokenSymbol: NETWORK[network].tokenSymbol,
      tokenName: NETWORK[network].tokenName,
      tokenDecimal: NETWORK[network].tokenDecimal,
      value: balance,
      price: getPriceByAddressNetwork(NETWORK[network].tokenPriceContract, network)
    }
  })
}


// Display Wallet
function displayWallet() {
  document.getElementById('wallet').innerHTML = null;
  ul = document.createElement('ul')
  const tokens = filteredWallet().sort(sortWallet)

  tokens.forEach(function (id) {
    let li = document.createElement('li')
    li.title = (wallet[id].tokenName && wallet[id].tokenName !== '') ? wallet[id].tokenName : wallet[id].tokenSymbol

    let spanNetwork = document.createElement('span')
    spanNetwork.classList.add('network')
    spanNetwork.appendChild(createNetworkImg(wallet[id].network))
    li.appendChild(spanNetwork)

    let spanSymbol = document.createElement('span')
    spanSymbol.innerHTML = (wallet[id].tokenName && wallet[id].tokenName !== '') ? wallet[id].tokenName : wallet[id].tokenSymbol
    spanSymbol.classList.add('symbol')
    li.appendChild(spanSymbol)

    let spanBalance = document.createElement('span')
    spanBalance.innerHTML = displayBalance(wallet[id].value, wallet[id].tokenDecimal)
    spanBalance.classList.add('balance')
    li.appendChild(spanBalance)

    let spanValue = document.createElement('span')
    let price = wallet[id].price
    spanValue.innerHTML = price ? '$'+displayBalance(wallet[id].value * price, wallet[id].tokenDecimal) : '-'
    spanValue.classList.add('value')
    li.appendChild(spanValue)

    ul.appendChild(li)

    li.addEventListener("click", function(e) {

    })
  })

  if(tokens.length > 0) {
    document.getElementById('wallet').appendChild(ul)
  }

  updateGlobalPrice()
  updateGlobalChart()

}

// Update & Display the total wallet value
function updateGlobalPrice() {
  walletValue = 0
  filteredWallet().forEach(function (id) {
    let price = wallet[id].price
    if(price) {
      walletValue += Number.parseFloat(displayBalance(wallet[id].value * price, wallet[id].tokenDecimal))
    }
  })

  document.getElementById('wallet-value').innerHTML = walletValue > 0 ? '$' + Math.round(walletValue) : null

}

function displayChartTooltip(e) {
  const value = e.tooltip.dataPoints[0].raw
  if(e.tooltip.opacity > 0) { // display tooltip
    document.getElementById('wallet-value-tooltip').innerHTML = value > 0 ? '$' + Math.round(value) : null
  } else { // hide tooltip
    document.getElementById('wallet-value-tooltip').innerHTML = null
  }
}



/* MAIN */
initializeHTML()
simpleDataTimers()




function initializeHTML() {
  const urlParams = new URLSearchParams(window.location.search)
  let address = null
  if(urlParams.has('address')) {
    address = urlParams.get('address')
  }
  else if(sessionStorage.getItem('walletAddress')) {
    address = sessionStorage.getItem('walletAddress')
  }

  if(address) {
    document.getElementById('input-wallet').value = address
    configureWallet(address)
  }
}

function simpleDataTimers() {
  Object.keys(NETWORK).forEach((network, i) => {
    setTimeout(function(){ getSimpleData(NETWORK[network].enum, displayWallet) }, (i+1) * 500)
  })
  setTimeout(function(){ simpleDataTimers() }, 60000)
}


function updateGlobalChart() {
  if(!walletAddress || walletValue === 0) {
    if(globalChart) {
      globalChart.destroy()
      globalChart = null
    }
    return
  }
  const network = NETWORK.ETHEREUM.enum
  const address = NETWORK.ETHEREUM.tokenPriceContract
  let chart = JSON.parse(sessionStorage.getItem(network + '-' + address))

  if(!chart || (chart && !chart.chart_often) || (chart && chart.chart_often && chart.chart_often.length < 1)) {
    getChartsByAddress(NETWORK.ETHEREUM.tokenPriceContract, NETWORK.ETHEREUM.enum, updateGlobalChart)
    return
  }

  chart = extract24hChart(chart.chart_often)

  const last_price = chart[chart.length - 1].p

  const timeData = chart.map(coords => new Date(coords.t))
  const tokenData = chart.map(coords => coords.p * walletValue / last_price)

  const ctx = document.getElementById('wallet-chart').getContext('2d')
  if(globalChart) {
    globalChart.data.labels = timeData
    globalChart.data.datasets[0].data = tokenData
    globalChart.update()
  } else {
    globalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeData,
        datasets: [{
          data: tokenData,
          backgroundColor: '#0000FF88',
          borderColor: '#0000FF88',
          //fill: '#0000FF44',
          radius: 0,
          tension: 0.3,
          borderWidth: 1,
        }]
      },
      options: {
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: false,
            intersect: false,
            external: displayChartTooltip
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        //aspectRatio: 3,
        scaleShowLabels: false,
        tooltipEvents: [],
        pointDot: false,
        scaleShowGridLines: true,
        scales: {
          x: {
            type: 'time',
            display: false
          },
          y: {
            display: false
          }
        }
      }
    })
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

/* Utils - sort the wallet */
const sortWallet = (id_a, id_b) => {
  let a = wallet[id_a]
  let b = wallet[id_b]
  // sort by network
  if(NETWORK[a.network].order < NETWORK[b.network].order) return -1
  if(NETWORK[a.network].order > NETWORK[b.network].order) return 1
  // then sort by token network (eg: Ethereum, Matic, etc are first)
  if(NETWORK[a.network].tokenContract === a.contract) return -1
  if(NETWORK[b.network].tokenContract === b.contract) return 1
  // then sort by price value
  if(a.value * a.price > b.value * b.price) return -1
  if(a.value * a.price < b.value * b.price) return 1
  // then sort by name
  return a.tokenName.localeCompare(b.tokenName)
}

/* Utils - getId from Address and Network */
const getId = (address, network) => {
  return network + '-' + address
}

/* Utils - Wallet with not null value token */
const filteredWallet = () => {
  const filtered = Object.keys(wallet)
    .filter(id => wallet[id].value && wallet[id].value !== '0')
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
