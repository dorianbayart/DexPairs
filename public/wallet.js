
let globalChart = null
let walletValue = 0
let loading = false
let timerGetTokenTx = {}
let timerGetERC721Tx = {}
let timerGetNetworkBalance = {}
let walletOptions = {
  menu: {
    tokens: {
      name: 'Tokens',
      hash: '#tokens',
      isActive: true
    },
    nfts: {
      name: 'NFTs',
      hash: '#nfts',
      isActive: false
    },
    transactions: {
      name: 'Transactions',
      hash: '#transactions',
      isActive: false
    }
  },
  hideSmallBalance: true
}



// defines event on search field
document.getElementById('input-wallet').addEventListener("change", function(e) {
  let inputAddress = e.target.value
  configureWallet(inputAddress)
})

document.getElementById('connect-wallet').addEventListener('click', function(e) {
  if (window.ethereum) {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(addresses => {
      document.getElementById('input-wallet').value = addresses[0]
      configureWallet(addresses[0])
    })
  } else {
    alert('Connection is only supported through Metamask extension')
  }
})

// search transactions / tokens for the specified wallet address
function configureWallet(inputAddress) {
  const inputContainer = document.getElementById('input-wallet-container')
  const globalInforationContainer = document.getElementById('global')
  const stateContainer = document.getElementById('state')
  const connectDemoContainer = document.getElementById('connect-demo-container')
  const walletOptionsContainer = document.getElementById('wallet-options')

  Object.keys(timerGetTokenTx).forEach(network => {
    clearTimeout(timerGetTokenTx[network])
  })
  Object.keys(timerGetNetworkBalance).forEach(network => {
    clearTimeout(timerGetNetworkBalance[network])
  })

  if(inputAddress.length === 0 || inputAddress.length > 0 && inputAddress === walletAddress) {
    stateContainer.innerHTML = null
    stateContainer.classList.remove('shadow-white')

    inputContainer.classList.toggle('margin-top', true)
    globalInforationContainer.classList.toggle('none', true)
    connectDemoContainer.classList.toggle('none', true)
    walletOptionsContainer.classList.remove('none')

    const urlParams = new URLSearchParams(window.location.search)
    if(urlParams.has('address') && window.history.replaceState) {
      window.history.replaceState(null, DOMAIN_NAME + ' | Wallet', window.location.href.split("?")[0])
      document.querySelector('meta[property="og:title"]').setAttribute("content", DOMAIN_NAME + ' | Wallet')
    }

    walletAddress = null
    sessionStorage.removeItem('walletAddress', walletAddress)
    wallet = {}
    wallet_NFT = {}
    loading = false
    displayWallet()

    walletOptionsContainer.classList.toggle('none', true)

    return
  }

  if(!web3_ethereum) {
    setTimeout(() => configureWallet(inputAddress), 1000)
    return
  }

  if(!web3_ethereum.utils.isAddress(inputAddress)) {
    inputContainer.classList.toggle('margin-top', true)
    globalInforationContainer.classList.toggle('none', true)

    const urlParams = new URLSearchParams(window.location.search)
    if(urlParams.has('address') && window.history.replaceState) {
      window.history.replaceState(null, DOMAIN_NAME + ' | Wallet', window.location.href.split("?")[0])
      document.querySelector('meta[property="og:title"]').setAttribute("content", DOMAIN_NAME + ' | Wallet')
    }

    walletAddress = null
    sessionStorage.removeItem('walletAddress', walletAddress)
    wallet = {}
    wallet_NFT = {}
    loading = false
    displayWallet()

    stateContainer.innerHTML = 'This is not a valid address, checksum cannot be verified'
    stateContainer.classList.toggle('shadow-white', true)
    walletOptionsContainer.classList.toggle('none', true)

    return
  }

  loading = true
  stateContainer.innerHTML = 'Searching for transactions and tokens ...'
  stateContainer.classList.toggle('shadow-white', true)
  walletOptionsContainer.classList.remove('none')

  if(sessionStorage.getItem('walletAddress') === inputAddress) {
    wallet = sessionStorage.getItem('wallet') ? JSON.parse(sessionStorage.getItem('wallet')) : {}
    displayWallet()
  } else {
    sessionStorage.removeItem('wallet')
    wallet = {}
    wallet_NFT = {}
  }

  Object.keys(wallet).forEach(id => {
    wallet[id].upToDate = false
  })

  walletAddress = inputAddress

  const urlParams = new URLSearchParams(window.location.search)
  if(window.history.replaceState && (!urlParams.has('address') || urlParams.has('address') && urlParams.get('address') !== walletAddress)) {
    document.title = DOMAIN_NAME + ' | ' + walletAddress
    window.history.replaceState(null, document.title, window.location.href.split("?")[0] + '?address=' + walletAddress)
    document.querySelector('meta[property="og:title"]').setAttribute("content", document.title)
  }

  Object.keys(NETWORK).forEach((network, i) => {
    sessionStorage.removeItem('latest-block-' + NETWORK[network].enum)
    getNetworkBalance(NETWORK[network].enum)
    setTimeout(() => getTokenTx(NETWORK[network].enum), walletOptions.menu.tokens.isActive ? 50 : 750)
    setTimeout(() => getERC721Tx(NETWORK[network].enum), walletOptions.menu.nfts.isActive ? 50 : 750)
  });

  sessionStorage.setItem('walletAddress', walletAddress)
}



// get token transactions list
function getTokenTx(network) {
  if(!walletAddress) {
    return
  }
  let xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText)
      const tokentx = data.result
      sessionStorage.setItem('tokentx-' + network, JSON.stringify(tokentx))

      searchTokens(network)

      timerGetTokenTx[network] = setTimeout(() => getTokenTx(network), (Math.round(Math.random() * 15) + 45) * 1000 * (tokentx.length > 0 ? 1 : 3))
    } else if(this.response && this.response.includes("Max rate limit reached")) {
      clearTimeout(timerGetTokenTx[network])
      setTimeout(() => getTokenTx(network), 750)
    }
  }
  xmlhttp.onerror = function() {
    console.log('getTokenTx', this)
  }
  xmlhttp.open("GET", NETWORK[network].tokentx.replace('WALLET_ADDRESS', walletAddress), true)
  xmlhttp.send()
}

// get ERC-721 (NFT) transactions list
function getERC721Tx(network) {
  if(!walletAddress) {
    return
  }
  let xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText)
      const erc721tx = data.result
      sessionStorage.setItem('erc721tx-' + network, JSON.stringify(erc721tx))

      searchNFTs(network)

      timerGetERC721Tx[network] = setTimeout(() => getERC721Tx(network), 100000 * (erc721tx.length > 0 ? 1 : 3))
    } else if(this.response && this.response.includes("Max rate limit reached")) {
      clearTimeout(timerGetERC721Tx[network])
      setTimeout(() => getERC721Tx(network), 750)
    }
  }
  xmlhttp.onerror = function() {
    console.log('getERC721Tx', this)
  }
  xmlhttp.open("GET", NETWORK[network].erc721tx.replace('WALLET_ADDRESS', walletAddress), true)
  xmlhttp.send()
}


// Get token balance
function getTokenBalanceWeb3(contractAddress, network) {
  if(contractAddress === '0x0' || !walletAddress) return

  const id = getId(contractAddress, network)
  // Get ERC20 Token contract instance
  let contract = getContract(contractAddress, network)

  // Call balanceOf function
  contract.methods.balanceOf(walletAddress).call((error, value) => {
    if(!wallet[id] && !wallet_NFT[id]) {
      return
    }

    if(error) {
      console.log('getTokenBalanceWeb3', error)
      setTimeout(() => getTokenBalanceWeb3(contractAddress, network), 10000)
    } else {
      if(Object.keys(wallet).includes(id)) { // ERC-20
        wallet[id].value = value
        wallet[id].upToDate = true
      } else if (Object.keys(wallet_NFT).includes(id)) { // ERC-721
        wallet_NFT[id].number = value
        // Loop over each NFT hold on this Contract by the WalletAddress
        for (var i = 0; i < wallet_NFT[id].number; i++) {
          contract.methods.tokenOfOwnerByIndex(wallet_NFT[id].walletAddress, i).call((error, indexId) => {
            if(error) { return }
            contract.methods.tokenURI(indexId).call((error, tokenURI) => {
              if(error) { return }
              wallet_NFT[id].tokens.push({ id: indexId, tokenURI: tokenURI })
              readNFTMetadata(id, indexId, tokenURI)
            })
          })
        }
      }
    }

    if(Object.keys(wallet).includes(id)) { // ERC-20
      wallet[id].price = getPriceByAddressNetwork(contractAddress, wallet[id].network)
      sessionStorage.setItem('wallet', JSON.stringify(wallet))
    } else if (Object.keys(wallet_NFT).includes(id)) { // ERC-721
      sessionStorage.setItem('wallet-NFT', JSON.stringify(wallet_NFT))

      if(Object.keys(wallet_NFT).some(id => wallet_NFT[id].number > 0)) {
        document.getElementById('menu-nfts').classList.remove('none')
      } else {
        document.getElementById('menu-nfts').classList.toggle('none', true)
      }
    }

    displayWallet()
  })
}

function readNFTMetadata(id, indexId, tokenURI) {
  const tokenIndex = Object.keys(wallet_NFT[id]).findIndex(id => wallet_NFT[id].tokens.id === indexId)
  if(tokenURI && tokenURI.includes('http')) {
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(tokenURI)}`)
      .then(res => res.json())
      .then(json => {
        const data = JSON.parse(json.contents)
        wallet_NFT[id].tokens[tokenIndex].metadata = data
        if(data && data.image) {
          wallet_NFT[id].tokens[tokenIndex].image = data.image
        } else if (data && data.image_url) {
          wallet_NFT[id].tokens[tokenIndex].image = data.image_url
        } else if (data && data.imageUrl) {
          wallet_NFT[id].tokens[tokenIndex].image = data.imageUrl
        } else {
          wallet_NFT[id].tokens[tokenIndex].image = tokenURI
        }
        displayWallet()
      })
      .catch(error => {
        wallet_NFT[id].tokens[tokenIndex].image = tokenURI
        displayWallet()
      })
  }

}


function searchTokens(network) {
  let tokentx = JSON.parse(sessionStorage.getItem('tokentx-' + network))
  const latestBlock = sessionStorage.getItem('latest-block-' + network)

  if(!tokentx || typeof tokentx === 'string' || tokentx.length === 0) {
    return
  }

  loading = false

  if(latestBlock) {
    tokentx = tokentx.filter(tx => tx.blockNumber > latestBlock)
  }

  // search tokens only in received transactions
  tokentx = tokentx.filter(tx => tx.to.toLowerCase() === walletAddress.toLowerCase())

  if(tokentx.length > 0) {
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
      setTimeout(function() {
        if(wallet[id]) {
          getTokenBalanceWeb3(wallet[id].contract, network)
        }
      }, (i+1) * 75)
    })

    sessionStorage.setItem('latest-block-' + network, tokentx[0].blockNumber)
  }
}

function searchNFTs(network) {
  let erc721tx = JSON.parse(sessionStorage.getItem('erc721tx-' + network))
  const latestBlock = sessionStorage.getItem('latest-erc721-block-' + network)

  if(!erc721tx || typeof erc721tx === 'string' || erc721tx.length === 0) {
    return
  }

  loading = false

  if(latestBlock) {
    //erc721tx = erc721tx.filter(tx => tx.blockNumber > latestBlock)
  }

  // search tokens only in received transactions
  erc721tx = erc721tx.filter(tx => tx.to.toLowerCase() === walletAddress.toLowerCase())

  if(erc721tx.length > 0) {
    erc721tx.forEach((item, i) => {
      const id = getId(item.contractAddress, network)
      wallet_NFT[id] = {
        network: network,
        contract: item.contractAddress,
        tokens: [],
        tokenSymbol: item.tokenSymbol,
        tokenName: item.tokenName,
        tokenDecimal: item.tokenDecimal
      }
    })

    Object.keys(wallet_NFT).filter(id => wallet_NFT[id].network === network).forEach((id, i) => {
      setTimeout(function() {
        if(wallet_NFT[id]) {
          getTokenBalanceWeb3(wallet_NFT[id].contract, network)
        }
      }, (i+1) * 75)
    })

    sessionStorage.setItem('latest-erc721-block-' + network, erc721tx[0].blockNumber)
  }
}

function getNetworkBalance(network) {
  const web3 = getWeb3(network)
  if(!web3 || !walletAddress || !web3.utils.isAddress(walletAddress)) {
    return
  }

  const address = NETWORK[network].tokenContract
  let sessionWallet = JSON.parse(sessionStorage.getItem('wallet'))
  if(sessionWallet && sessionWallet[getId(address, network)]) {
    wallet[getId(address, network)] = sessionWallet[getId(address, network)]
  } else {
    wallet[getId(address, network)] = {
      network: network,
      contract: address,
      tokenSymbol: NETWORK[network].tokenSymbol,
      tokenName: NETWORK[network].tokenName,
      tokenDecimal: NETWORK[network].tokenDecimal
    }
  }
  wallet[getId(address, network)].price = getPriceByAddressNetwork(NETWORK[network].tokenPriceContract, network)


  web3.eth.getBalance(walletAddress).then(balance => {
    wallet[getId(address, network)].value = balance
    wallet[getId(address, network)].upToDate = true

    displayWallet()

    timerGetNetworkBalance[network] = setTimeout(() => getNetworkBalance(network), (Math.round(Math.random() * 15) + 25) * 1000)

  }, error => {
    console.log('getNetworkBalance', network, error)
    wallet[getId(address, network)].upToDate = false
    clearTimeout(timerGetNetworkBalance[network])
    timerGetNetworkBalance[network] = setTimeout(() => getNetworkBalance(network), 10000)
  })


}


function displayWallet() {
  if(walletOptions.menu.tokens.isActive) {
    displayTokens()
  } else if(walletOptions.menu.nfts.isActive) {
    displayNFTs()
  } else if(walletOptions.menu.transactions.isActive) {
    displayTransactions()
  }
  updateGlobalPrice()
  updateGlobalChart()
}

// Display Wallet Tokens
function displayTokens() {
  let listLi = document.getElementById('wallet').querySelectorAll('li')
  const tokens = filteredWallet().sort(sortWallet)

  if(listLi.length === 0 || listLi.length !== tokens.length || tokens.length === Object.keys(wallet_NFT).length) {
    document.getElementById('wallet').innerHTML = null
    if(tokens.length > 0) {
      let ul = document.createElement('ul')
      ul.id = 'wallet-ul'
      document.getElementById('wallet').appendChild(ul)
    }
    listLi = []
  }

  tokens.forEach(function (id) {
    let element = Array.from(listLi).find(el => el.id === id)
    let price = wallet[id].price

    if(element) {

      element.querySelector('span.price').innerHTML = price ? '$' + precise(price) : '-'
      element.querySelector('span.value').innerHTML = price ? displayValue(wallet[id].value, price, wallet[id].tokenDecimal) : '-'
      element.querySelector('span.balance').innerHTML = displayBalance(wallet[id].value, wallet[id].tokenDecimal)

    } else {

      let li = document.createElement('li')
      li.title = ''
      li.id = id

      let spanNetwork = document.createElement('span')
      spanNetwork.classList.add('network')
      spanNetwork.appendChild(createNetworkImg(wallet[id].network))
      li.appendChild(spanNetwork)

      let spanNameSymbol = document.createElement('span')
      spanNameSymbol.classList.add('nameSymbol')
      li.appendChild(spanNameSymbol)

      let spanSymbol = document.createElement('span')
      spanSymbol.innerHTML = wallet[id].tokenSymbol
      spanSymbol.classList.add('symbol')
      spanNameSymbol.appendChild(spanSymbol)
      let spanName = document.createElement('span')
      spanName.innerHTML = wallet[id].tokenName
      spanName.classList.add('name')
      spanNameSymbol.appendChild(spanName)

      let spanPrice = document.createElement('span')
      spanPrice.innerHTML = price ? '$' + precise(price) : '-'
      spanPrice.classList.add('price')
      li.appendChild(spanPrice)

      let spanValueBalance = document.createElement('span')
      spanValueBalance.classList.add('valueBalance')
      li.appendChild(spanValueBalance)

      let spanValue = document.createElement('span')
      spanValue.innerHTML = price ? displayValue(wallet[id].value, price, wallet[id].tokenDecimal) : '-'
      spanValue.classList.add('value')
      spanValueBalance.appendChild(spanValue)
      let spanBalance = document.createElement('span')
      spanBalance.innerHTML = displayBalance(wallet[id].value, wallet[id].tokenDecimal)
      spanBalance.classList.add('balance')
      spanValueBalance.appendChild(spanBalance)

      /*
      let spanAddress = document.createElement('span')
      spanAddress.innerHTML = wallet[id].contract
      spanAddress.classList.add('address')
      li.appendChild(spanAddress)

      let spanChart = document.createElement('span')
      spanChart.id = id + '-chart'
      spanChart.classList.add('chart')
      li.appendChild(spanChart)
      */

      document.getElementById('wallet-ul').appendChild(li)

      li.addEventListener("click", function(e) {
        let item = e.target

        while(item.id.length < 1 || item.id.includes('chart')) {
          item = item.parentNode
        }

        // TODO Replace with : expandCollapseItem(item)
        if(item.classList.contains('expanded')) {
          item.classList.remove('expanded')
        } else {
          //item.classList.toggle('expanded', true)
        }
      })

    }

  })

  if(tokens.length > 0) {
    document.getElementById('global').classList.remove('none')
    document.getElementById('connect-demo-container').classList.toggle('none', true)
    document.getElementById('state').innerHTML = null
    document.getElementById('input-wallet-container').classList.remove('margin-top')
    document.getElementById('state').classList.remove('shadow-white')
  } else {
    document.getElementById('input-wallet-container').classList.toggle('margin-top', true)
    document.getElementById('connect-demo-container').classList.remove('none')
    const stateContainer = document.getElementById('state')
    if(walletAddress && walletAddress.length > 0) {
      stateContainer.innerHTML = 'No token can be found on this address'
      stateContainer.classList.toggle('shadow-white', true)
    } else {
      stateContainer.innerHTML = null
      stateContainer.classList.remove('shadow-white')
    }
  }
}

// Display Wallet NFTs
function displayNFTs() {
  let listLi = document.getElementById('wallet').querySelectorAll('li')
  // TODO Check if it works ...
  const nftContracts = Object.keys(wallet_NFT)

  if(listLi.length === 0 || listLi.length !== tokens.length || tokens.length === filteredWallet().length) {
    document.getElementById('wallet').innerHTML = null
    if(nftContracts.length > 0) {
      let ul = document.createElement('ul')
      ul.id = 'wallet-ul'
      document.getElementById('wallet').appendChild(ul)
    }
    listLi = []
  }

  nftContracts.forEach(function (id) {

    const nfts = tokens

    nfts.forEach(function (nft) {
      let element = Array.from(listLi).find(el => el.id === id + nft.tokenSymbol + nft.tokenID)

      if(element) {
        element.querySelector('a.tokenURI').href = nft.tokenURI
        // TODO Display text when nft.image is empty
        if(nft.image && element.querySelector('img.preview').src !== nft.image) {
          element.querySelector('img.preview').src = nft.image
        }
      } else {
        let li = document.createElement('li')
        li.title = ''
        li.id = id + nft.tokenSymbol + nft.tokenID
        li.classList.add('nft')

        let spanNetwork = document.createElement('span')
        spanNetwork.classList.add('network')
        spanNetwork.appendChild(createNetworkImg(wallet_NFT[id].network))
        li.appendChild(spanNetwork)

        let spanNameSymbol = document.createElement('span')
        spanNameSymbol.classList.add('nameSymbol')
        li.appendChild(spanNameSymbol)

        let spanSymbol = document.createElement('span')
        spanSymbol.innerHTML = wallet_NFT[id].tokenSymbol
        spanSymbol.classList.add('symbol')
        spanNameSymbol.appendChild(spanSymbol)
        let spanName = document.createElement('span')
        spanName.innerHTML = wallet_NFT[id].tokenName
        spanName.classList.add('name')
        spanNameSymbol.appendChild(spanName)

        let aAddress = document.createElement('a')
        let spanAddress = document.createElement('span')
        spanAddress.innerHTML = wallet_NFT[id].contract.slice(0, 5) + "..." + wallet_NFT[id].contract.slice(-5)
        spanAddress.classList.add('address')
        aAddress.href = NETWORK[wallet_NFT[id].network].explorer + wallet_NFT[id].contract
        aAddress.target = "_blank"
        aAddress.classList.add('address')
        aAddress.appendChild(spanAddress)
        spanNameSymbol.appendChild(aAddress)

        let spanTokenId = document.createElement('span')
        spanTokenId.innerHTML = '#' + nft.id
        spanTokenId.classList.add('tokenID')
        li.appendChild(spanTokenId)

        let aTokenURI = document.createElement('a')
        // TODO Display text when nft.image is empty
        let imgPreview = document.createElement('img')
        imgPreview.src = nft.image
        imgPreview.classList.add('preview')
        imgPreview.alt = 'NFT Metadata'
        aTokenURI.href = nft.tokenURI
        aTokenURI.target = "_blank"
        aTokenURI.classList.add('tokenURI')
        aTokenURI.appendChild(imgPreview)
        li.appendChild(aTokenURI)


        aTokenURI.addEventListener("click", function(e) {
          let item = e.target

          while(item.id.length < 1) {
            item = item.parentNode
          }

          expandCollapseItem(item)
        })

        document.getElementById('wallet-ul').appendChild(li)

        li.addEventListener("click", function(e) {
          let item = e.target

          while(item.id.length < 1 || item.id.includes('chart')) {
            item = item.parentNode
          }

          expandCollapseItem(item)
        })

      }

    }

  })

  if(tokens.length > 0) {

  } else {
    const stateContainer = document.getElementById('state')
    if(walletAddress && walletAddress.length > 0) {
      const spanNoNft = document.createElement('span')
      spanNoNft.innerHTML = loading ? 'Loading ...' : 'No NFT can be found on this address'
      spanNoNft.classList.add('loading-message')
      document.getElementById('wallet').appendChild(spanNoNft)
      //stateContainer.innerHTML = 'No NFT can be found on this address'
      //stateContainer.classList.toggle('shadow-white', true)
    } else {
      stateContainer.innerHTML = null
      stateContainer.classList.remove('shadow-white')
    }
  }

  document.getElementById('global').classList.remove('none')
  document.getElementById('connect-demo-container').classList.toggle('none', true)

  document.getElementById('state').innerHTML = null
  document.getElementById('input-wallet-container').classList.remove('margin-top')
  document.getElementById('state').classList.remove('shadow-white')
}

function expandCollapseItem(item) {
  if(item.classList.contains('expanded')) {
    item.classList.remove('expanded')
  } else {
    item.classList.toggle('expanded', true)
  }
}

// Insert a DOM element after a Reference element
function insertAfter(refElement, element) {
  refElement.parentNode.insertBefore(element, refElement.nextSibling);
}

// Update & Display the total wallet value
function updateGlobalPrice() {
  walletValue = 0
  Object.keys(wallet).filter(id => wallet[id].value && wallet[id].value !== '0').forEach(function (id) {
    let price = wallet[id].price
    if(price) {
      walletValue += Number.parseFloat(calculateValue(wallet[id].value, price, wallet[id].tokenDecimal))
    }
  })

  document.getElementById('wallet-value').innerHTML = walletValue > 0 ? '$' + Math.round(walletValue) : null

}

function displayChartTooltip(e) {
  if(!e.tooltip.dataPoints) {
    return
  }
  const value = e.tooltip.dataPoints[0].raw
  const date = new Date(parseInt(e.tooltip.dataPoints[0].parsed.x)).toLocaleString()
  if(e.tooltip.opacity > 0) { // display tooltip
    document.getElementById('wallet-value-tooltip').innerHTML = value > 0 ? '$' + Math.round(value) : null
    document.getElementById('wallet-date-tooltip').innerHTML = date
  } else { // hide tooltip
    document.getElementById('wallet-value-tooltip').innerHTML = null
    document.getElementById('wallet-date-tooltip').innerHTML = null
  }
}



/* MAIN */
initializeHTML()
simpleDataTimers()




function initializeHTML() {
  const urlParams = new URLSearchParams(window.location.search)
  const hash = window.location.hash
  let address = null
  if(urlParams.has('address')) {
    address = urlParams.get('address')
  }
  else if(sessionStorage.getItem('walletAddress')) {
    address = sessionStorage.getItem('walletAddress')
  }

  if(sessionStorage.getItem('walletOptions')) {
    walletOptions = JSON.parse(sessionStorage.getItem('walletOptions'))
  }
  document.getElementById('hide-small-balances-icon').src = walletOptions.hideSmallBalance ? '/img/icons/check-square.svg' : '/img/icons/square.svg'
  walletOptions.menu[Object.keys(walletOptions.menu).find(item => walletOptions.menu[item].isActive)].isActive = false
  if(hash) {
    const menu = Object.keys(walletOptions.menu).find(item => walletOptions.menu[item].hash === hash)
    try {
      walletOptions.menu[menu].isActive = true
    } catch {
      walletOptions.menu.tokens.isActive = true
      window.location.hash = walletOptions.menu.tokens.hash
    }
  } else {
    walletOptions.menu.tokens.isActive = true
    window.location.hash = walletOptions.menu.tokens.hash
  }


  if(address) {
    document.getElementById('input-wallet').value = address
    configureWallet(address)
  }
}

function simpleDataTimers() {
  Object.keys(NETWORK).forEach((network, i) => {
    setTimeout(() => getSimpleData(NETWORK[network].enum, displayWallet), (i+1) * 750)

    if(network === NETWORK.ETHEREUM.enum) {
      getAaveEthereumUnderlyingAddresses(displayWallet)
      getCompoundEthereumUnderlyingAddresses(displayWallet)
    } else if(network === NETWORK.POLYGON.enum) {
      getAavePolygonUnderlyingAddresses(displayWallet)
    } else if(network === NETWORK.BSC.enum) {
      getVenusBscUnderlyingAddresses(displayWallet)
    }
  })
  setTimeout(simpleDataTimers, 100000)
}


document.getElementById('menu-tokens').addEventListener('click', (e) => {
  e.preventDefault()
  if(walletOptions.menu.tokens.isActive) {
    return
  }
  walletOptions.menu[Object.keys(walletOptions.menu).find(menu => walletOptions.menu[menu].isActive)].isActive = false
  walletOptions.menu.tokens.isActive = true
  sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))

  window.location.hash = walletOptions.menu.tokens.hash

  displayWallet()
})
document.getElementById('menu-nfts').addEventListener('click', (e) => {
  e.preventDefault()
  if(walletOptions.menu.nfts.isActive) {
    return
  }
  walletOptions.menu[Object.keys(walletOptions.menu).find(menu => walletOptions.menu[menu].isActive)].isActive = false
  walletOptions.menu.nfts.isActive = true
  sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))

  window.location.hash = walletOptions.menu.nfts.hash

  displayWallet()
})
document.getElementById('hide-small-balances-container').addEventListener('click', (e) => {
  e.preventDefault()
  walletOptions.hideSmallBalance = !walletOptions.hideSmallBalance
  sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))
  document.getElementById('hide-small-balances-icon').src = walletOptions.hideSmallBalance ? '/img/icons/check-square.svg' : '/img/icons/square.svg'

  window.location.hash = walletOptions.menu.transactions.hash

  displayWallet()
})


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
  const lastFetch = sessionStorage.getItem(network + '-' + address + '-lastFetch')
  const now = new Date().getTime()
  if(!chart || (chart && !chart.chart_often) || (chart && chart.chart_often && chart.chart_often.length < 1) || (now - lastFetch > 3*60*1000)) {
    if(loadingChartsByAddress === false) {
      getChartsByAddress(NETWORK.ETHEREUM.tokenPriceContract, NETWORK.ETHEREUM.enum, updateGlobalChart)
    }
    return
  }

  chart = extractChartByDuration(chart.chart_often, 2 * TIME_24H)

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
  let filtered = Object.keys(wallet)
    .filter(id => wallet[id].value && wallet[id].value !== '0')
  if(walletOptions.hideSmallBalance) {
    filtered = filtered.filter(id => Math.abs(calculateValue(wallet[id].value, wallet[id].price, wallet[id].tokenDecimal)) >= 0.01 )
  }
  return filtered
}

/* Utils - Calculate balance from value */
const calculateBalance = (balance, decimal) => {
  if(balance && Math.abs(balance) > 0) {
    return precise(balance * Math.pow(10, -decimal))
  }
  return 0
}
/* Utils - Calculate value from value */
const calculateValue = (balance, price, decimal) => {
  if(balance && price && Math.abs(balance * price) > 0) {
    return calculateBalance(balance * price, decimal)
  }
  return 0
}
/* Utils - Display balance readable by human */
const displayBalance = (value, decimal) => {
  const balance = calculateBalance(value, decimal)
  if(balance === 0) return 0
  if(Math.abs(balance) < 0.01) return '≈ 0'
  return balance
}
/* Utils - Display dollar value readable by human */
const displayValue = (balance, price, decimal) => {
  const value = calculateBalance(balance * price, decimal)
  if(value === 0) return 0
  if(Math.abs(value) < 0.01) return '≈ 0'
  return '$' + value
}
