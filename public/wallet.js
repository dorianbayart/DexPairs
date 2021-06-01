
//import * as Web3 from './web3.min.js'
const Web3 = require(['./web3.min.js'], function(Web3) {



  const web3 = new Web3("https://cloudflare-eth.com")
  //console.log(web3)

  web3.eth.getBalance('0x0255c9D3850cacA1152AEB20425C264787661692').then(balance => {
    console.log(balance)
    console.log(balance * Math.pow(10, -18))
  })





})



//const web3: W3.default = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
