const COLOR_THEMES = {
  LIGHT_BLUE: {
    background_html: '#FFF',
    background_top: '#0002',
    background_color: '#FFFE',
    background_hover: '#0002', // li
    color: '#000D',
    chart_line: '#00F8', // blue
    links: '#00F8'
  },
  DARK_ORANGE: {
    background_html: '#000D',
    background_top: '#444C',
    background_hover: '#DDD4', // li
    background_inverted: '#BBB2', // img buttons
    background_color: '#333D',
    color: '#FFFB',
    chart_line: '#F90D', // orange
    links: '#F90D'
  }
}

const server = 'http://185.212.226.82' // Empty for localhost

const NETWORK = {
  ETHEREUM: {
    order: 1,
    enum: 'ETHEREUM',
    name: 'Ethereum',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/ethereum-icon.svg',
    rpc: 'https://cloudflare-eth.com',
    tokentx: 'https://api.etherscan.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
    url_data: server,
    tokenContract: '0x0',
    tokenSymbol: 'ETH',
    tokenName: 'Ethereum',
    tokenDecimal: 18,
    tokenPriceContract: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  },
  POLYGON: {
    order: 2,
    enum: 'POLYGON',
    name: 'Polygon/Matic',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/polygon-icon.svg',
    rpc: 'https://rpc-mainnet.maticvigil.com',
    tokentx: 'https://api.polygonscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
    url_data: server + '/sushiswap',
    tokenContract: '0x0',
    tokenSymbol: 'MATIC',
    tokenName: 'Matic',
    tokenDecimal: 18,
    tokenPriceContract: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
  },
  BSC : {
    order: 3,
    enum: 'BSC',
    name: 'Binance Smart Chain',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/bsc-icon.svg',
    rpc: 'https://bsc-dataseed.binance.org',
    tokentx: 'https://api.bscscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
    url_data: server + '/pancake',
    tokenContract: '0x0',
    tokenSymbol: 'BNB',
    tokenName: 'BNB',
    tokenDecimal: 18,
    tokenPriceContract: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
  },
  FANTOM: {
    order: 4,
    enum: 'FANTOM',
    name: 'Fantom/Opera',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/fantom-icon.svg',
    rpc: 'https://rpcapi.fantom.network',
    tokentx: 'https://api.ftmscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.ftmscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
    url_data: server + '/spiritswap',
    tokenContract: '0x0',
    tokenSymbol: 'FTM',
    tokenName: 'Fantom',
    tokenDecimal: 18,
    tokenPriceContract: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'
  },
  XDAI: {
    order: 5,
    enum: 'XDAI',
    name: 'xDai',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/xdai-icon.svg',
    rpc: 'https://rpc.xdaichain.com/',
    tokentx: 'https://blockscout.com/xdai/mainnet/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://blockscout.com/xdai/mainnet/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
    url_data: server + '/honeyswap',
    tokenContract: '0x0',
    tokenSymbol: 'XDAI',
    tokenName: 'xDai',
    tokenDecimal: 18,
    tokenPriceContract: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'
  },
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
let web3_fantom = null
let web3_xdai = null
let web3_bsc = null
let walletAddress = ''
let wallet = {}


require.config({ waitSeconds: 0 })
const Web3 = require(['http://www.dexpairs.xyz/lib/web3.min.js'], function(Web3) {
  web3_ethereum = new Web3(NETWORK.ETHEREUM.rpc)
  web3_polygon = new Web3(NETWORK.POLYGON.rpc)
  web3_fantom = new Web3(NETWORK.FANTOM.rpc)
  web3_xdai = new Web3(NETWORK.XDAI.rpc)
  web3_bsc = new Web3(NETWORK.BSC.rpc)

  setTimeout(setGas(NETWORK.ETHEREUM.enum), 200)
  setTimeout(setGas(NETWORK.POLYGON.enum), 400)
  setTimeout(setGas(NETWORK.BSC.enum), 600)
  setTimeout(setGas(NETWORK.FANTOM.enum), 800)
  setTimeout(setGas(NETWORK.XDAI.enum), 1000)
  setTimeout(updateGas, 2500)
})


const updateGas = () => {
  setTimeout(updateGas, 2500)
  // randomly select a network to update gas
  let network = Object.keys(NETWORK)[Math.floor(5*Math.random())]
  setGas(network)
}

const setGas = (network) => {
  let web3 = getWeb3(NETWORK[network].enum)
  if(web3) {
    web3.eth.getGasPrice().then(gas => {
      sessionStorage.setItem('gas-' + NETWORK[network].enum, gasRound(web3.utils.fromWei(gas, 'gwei')))
      const li = document.getElementById('gas-' + NETWORK[network].enum)
      li.innerHTML = ''
      let span = document.createElement('span')
      span.classList.add('gas-network')
      span.appendChild(createNetworkImg(NETWORK[network].enum))
      li.appendChild(span)
      span = document.createElement('span')
      span.classList.add('gas-value')
      span.innerHTML = gasRound(web3.utils.fromWei(gas, 'gwei'))
      li.appendChild(span)
      li.title = gasRound(web3.utils.fromWei(gas, 'gwei')) + ' gwei on ' + NETWORK[network].name
    })
  }
}





// get simple data prices
// param: network
function getSimpleData(network, callback) {
  xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      const simple = JSON.parse(this.responseText)
      if(simple && Object.keys(simple).length > 0) {
        sessionStorage.setItem('simple-' + network, JSON.stringify(simple))

        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    }
  }
  xmlhttp.open("GET", NETWORK[network].url_data + "/simple", true)
  xmlhttp.send()
}






/* Utils - Return the web3 to use depending on the network */
const getWeb3 = (network) => {
  switch (network) {
      case NETWORK.ETHEREUM.enum:
        return web3_ethereum
      case NETWORK.POLYGON.enum:
        return web3_polygon
      case NETWORK.FANTOM.enum:
        return web3_fantom
      case NETWORK.XDAI.enum:
        return web3_xdai
      case NETWORK.BSC.enum:
        return web3_bsc
      default:
        return
    }
}

/* Utils - Create a document network img tag */
const createNetworkImg = (network) => {
  let img = document.createElement('img')
  img.src = NETWORK[network].img
  img.width = "24"
  img.height = "24"
  img.alt = NETWORK[network].name + ' logo'
  img.title = NETWORK[network].name
  img.classList.add('network')
  return img
}


/* Utils - Get Price of Address on Network */
const getPriceByAddressNetwork = (address, network) => {
  let prices = JSON.parse(sessionStorage.getItem('simple-' + network))
  if(prices && Object.keys(prices).length > 0) {
    return prices[address] ? prices[address].p : null
  }
}


// Round number
const precise = (x) => {
  if(x > 999) { return Math.round(x) }
  else if(x > 9) { return Math.round(10*x)/10 }
  else if(x > 0.1) { return Math.round(100*x)/100 }
  else if(x > 0.01) { return Math.round(1000*x)/1000 }
  else if(x > 0.001) { return Math.round(10000*x)/10000 }
  else if(x > 0.0001) { return Math.round(100000*x)/100000 }
  return Number.parseFloat(x).toPrecision(2)
}
const gasRound = (x) => {
  if(x > 9) { return Math.round(x) }
  return Math.round(10 * x) / 10
}
