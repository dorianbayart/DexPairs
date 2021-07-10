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

const NETWORK = {
  ETHEREUM: {
    enum: 'ETHEREUM',
    name: 'Ethereum',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/ethereum-icon.svg',
    rpc: 'https://cloudflare-eth.com',
    tokentx: 'https://api.etherscan.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  POLYGON: {
    enum: 'POLYGON',
    name: 'Polygon/Matic',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/polygon-icon.svg',
    rpc: 'https://rpc-mainnet.maticvigil.com',
    tokentx: 'https://api.polygonscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  FANTOM: {
    enum: 'FANTOM',
    name: 'Fantom/Opera',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/fantom-icon.svg',
    rpc: 'https://rpcapi.fantom.network',
    tokentx: 'https://api.ftmscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://api.ftmscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  XDAI: {
    enum: 'XDAI',
    name: 'xDai',
    img: 'https://raw.githubusercontent.com/dorianbayart/DexPairs/main/img/xdai-icon.svg',
    rpc: 'https://rpc.xdaichain.com/',
    tokentx: 'https://blockscout.com/xdai/mainnet/api?module=account&action=tokentx&address=WALLET_ADDRESS&sort=desc',
    tokenbalance: 'https://blockscout.com/xdai/mainnet/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest'
  },
  BSC : {
    enum: 'BSC',
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
let web3_fantom = null
let web3_xdai = null
let web3_bsc = null
let walletAddress = ''
let wallet = {}


const Web3 = require(['./lib/web3.min.js'], function(Web3) {
  web3_ethereum = new Web3(NETWORK.ETHEREUM.rpc)
  web3_polygon = new Web3(NETWORK.POLYGON.rpc)
  web3_fantom = new Web3(NETWORK.FANTOM.rpc)
  web3_xdai = new Web3(NETWORK.XDAI.rpc)
  web3_bsc = new Web3(NETWORK.BSC.rpc)

  setTimeout(updateGas, 250)
})


const updateGas = () => {
  setTimeout(updateGas, 15000)
  Object.keys(NETWORK).forEach((network, i) => {
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
  });
}




// OnClick on Header => Goto root url
document.getElementById('title').addEventListener(
  "click", function(e) {
    location.href = '/'
  }
)

document.getElementById('menu-charts').addEventListener(
  "click", function(e) {
    location.href = '/'
  }
)

document.getElementById('menu-wallet').addEventListener(
  "click", function(e) {
    location.href = '/wallet'
  }
)



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
  img.alt = NETWORK[network].name + ' logo'
  img.title = NETWORK[network].name
  img.classList.add('network')
  return img
}


// Round number
const precise = (x) => {
  if(x > 9999) { return Math.round(x) }
  else if(x > 0.001) { return Math.round(10000*Number.parseFloat(x).toPrecision(4))/10000 }
  return Number.parseFloat(x).toPrecision(2)
}
const gasRound = (x) => {
  if(x > 9) { return Math.round(x) }
  return Math.round(10 * x) / 10
}
