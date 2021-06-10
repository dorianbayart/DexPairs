const http = require('http')
const os = require('os')
const path = require('path')
const express = require('express')
const fetch = require('node-fetch')
const { writeFile } = require('fs')



/********************************

          DexPairs.xyz

*********************************/
/*        Dorian Bayart         */
/*             2021             */
/********************************/


/*
* Backend Server
*
* Fetch data from APIs
* Structure data in JSON
* Store them as file
* Expose those files
*/



const dir_home = os.homedir()
console.log(dir_home)


const HISTORY_SIZE = 120
const OFTEN = 900000 // 15 minutes
const HOURS = 14400000 // 4 hours
const DAYS = 259200000 // 3 days
const WEEK = 604800000 // 1 week


/* DexPairs */


// Uniswap data - Ehtereum
let uniswap_list = {}
let uniswap_top = {}
let uniswap_data = {}
let uniswap_charts = {}

// Pancake data - BinanceSmartChain
let tokens_list = {}
let top_tokens = {}
let tokens_data = {}
let tokens_charts = {}

// Sushiswap data - Polygon/Matic
let sushiswap_list = {}
let sushiswap_top = {}
let sushiswap_data = {}
let sushiswap_charts = {}



// Utils
async function get(url, query = null) {
  if(query) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      .then((response) => response.json())
      .then(resolve)
      .catch(reject)
    });
  }
  return new Promise((resolve, reject) => {
    fetch(url)
    .then((response) => response.json())
    .then(resolve)
    .catch(reject)
  });
}


// Get Pancake's top
async function getTopTokens() {
  return await get("https://api.pancakeswap.info/api/v2/tokens")
}
async function getTopPairs() {
  return await get("https://api.pancakeswap.info/api/v2/pairs")
}

// Get Uniswap's top
const uniswap_request = `
query
  {
    tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
      id
      name
      symbol
      derivedETH
    }
    bundle(id: "1" ) {
      ethPrice
    }
  }
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/uniswap/uniswap-v2
async function getUniswapTopTokens() {
  return await get("https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2", uniswap_request)
}

// Get Sushiswap's top
const sushiswap_request = `
query
  {
    tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc, where: { liquidity_gt: "10" } ) {
      id
      name
      symbol
      derivedETH
    }
    bundle(id: "1" ) {
      ethPrice
    }
  }
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/sushiswap/matic-exchange
async function getSushiswapTopTokens() {
  return await get("https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange", sushiswap_request)
}




// Program - Pancake
async function launch() {
  // loop
  setTimeout(function(){ launch() }, OFTEN) // every 15 minutes
  
  let tokens_data_file = {}
  let tokens_charts_file = {}
  try {
    tokens_data_file = require(path.join(dir_home, 'pancake-simple.json'))
    tokens_charts_file = require(path.join(dir_home, 'pancake-charts.json'))
  } catch(error) {
    // console.log(error)
  }

  tokens_data = tokens_data_file
  tokens_charts = tokens_charts_file


  // get data from PancakeSwap
  const top = await getTopTokens()



  const time = top.updated_at
  const tokens = top.data

  for (var token in tokens) {
    if (tokens.hasOwnProperty(token)) {
      const address = token
      const symbol = tokens[token].symbol
      const name = tokens[token].name
      const price = tokens[token].price

      // create tokens list
      tokens_list[address] = symbol


      // update tokens simple data
      tokens_data[address] = {
        s: symbol,
        n: name,
        p: price,
        t: time
      }

      // update tokens charts
      //
      if(tokens_charts[address]) {
        if(time - tokens_charts[address].chart_often[tokens_charts[address].chart_often.length-1]['t'] > OFTEN) {
          tokens_charts[address].chart_often.push({
            t: time,
            p: price
          })
          tokens_charts[address].chart_often = tokens_charts[address].chart_often.slice(-HISTORY_SIZE)
        }
      } else {
        tokens_charts[address] = {
          s: symbol,
          n: name,
          chart_often: [{
            t: time,
            p: price
          }]
        }
      }
      if(tokens_charts[address].chart_4h) {
        if((time - tokens_charts[address].chart_4h[tokens_charts[address].chart_4h.length-1]['t']) > HOURS) {
          tokens_charts[address].chart_4h.push({
            t: time,
            p: price,
          })
          tokens_charts[address].chart_4h = tokens_charts[address].chart_4h.slice(-HISTORY_SIZE)
        }
      } else {
        tokens_charts[address].chart_4h = [{
          t: time,
          p: price
        }]
      }
      if(tokens_charts[address].chart_3d) {
        if((time - tokens_charts[address].chart_3d[tokens_charts[address].chart_3d.length-1]['t']) > DAYS) {
          tokens_charts[address].chart_3d.push({
            t: time,
            p: price,
          })
          tokens_charts[address].chart_3d = tokens_charts[address].chart_3d.slice(-HISTORY_SIZE)
        }
      } else {
        tokens_charts[address].chart_3d = [{
          t: time,
          p: price
        }]
      }
      if(tokens_charts[address].chart_1w) {
        if((time - tokens_charts[address].chart_1w[tokens_charts[address].chart_1w.length-1]['t']) > WEEK) {
          tokens_charts[address].chart_1w.push({
            t: time,
            p: price,
          })
          tokens_charts[address].chart_1w = tokens_charts[address].chart_1w.slice(-HISTORY_SIZE)
        }
      } else {
        tokens_charts[address].chart_1w = [{
          t: time,
          p: price
        }]
      }
    }
  }


  // build Top 25 list
  top_tokens = {}
  if(tokens.length > 0) {
    for (var i = 0; i < 25; i++) {
      const token = Object.keys(tokens)[i]
      const address = token
      const symbol = tokens[token].symbol
      const name = tokens[token].name
      const price = tokens[token].price

      top_tokens[address] = {
        s: symbol,
        n: name,
        p: price,
        chart: tokens_charts[token].chart_often
      }
    }
  }





  /* Store files */

  // Update the tokens list
  let pathFile = path.join(dir_home, 'pancake.json')
  writeFile( pathFile, JSON.stringify( tokens_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the top 25 tokens list
  pathFile = path.join(dir_home, 'pancake-top.json')
  writeFile( pathFile, JSON.stringify( top_tokens ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the tokens simple data
  pathFile = path.join(dir_home, 'pancake-simple.json')
  writeFile( pathFile, JSON.stringify( tokens_data ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the tokens charts
  pathFile = path.join(dir_home, 'pancake-charts.json')
  writeFile( pathFile, JSON.stringify( tokens_charts ), "utf8", (err) => {
    if (err) throw err;
  });

}


// Program - Uniswap
async function launchUniswap() {
  // loop
  setTimeout(function(){ launchUniswap() }, OFTEN) // every 15 minutes
  
  let uniswap_data_file = {}
  let uniswap_charts_file = {}
  try {
    uniswap_data_file = require(path.join(dir_home, 'uniswap-simple.json'))
    uniswap_charts_file = require(path.join(dir_home, 'uniswap-charts.json'))
  } catch(error) {
    // console.log(error)
  }

  uniswap_data = uniswap_data_file
  uniswap_charts = uniswap_charts_file


  // get data from Uniswap
  const top = await getUniswapTopTokens()



  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const eth_price = top.data ? top.data.bundle.ethPrice : 0

  tokens.forEach(token => {
      const address = token.id
      const symbol = token.symbol
      const name = token.name
      const price_ETH = token.derivedETH
      const price = price_ETH * eth_price

      // create Uniswap list
      uniswap_list[address] = symbol


      // update Uniswap simple data
      uniswap_data[address] = {
        s: symbol,
        n: name,
        p: price,
        t: time
      }

      // update Uniswap charts
      //
      if(uniswap_charts[address]) {
        if(time - uniswap_charts[address].chart_often[uniswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
          uniswap_charts[address].chart_often.push({
            t: time,
            p: price,
          })
          uniswap_charts[address].chart_often = uniswap_charts[address].chart_often.slice(-HISTORY_SIZE)
        }
      } else {
        uniswap_charts[address] = {
          s: symbol,
          n: name,
          chart_often: [{
            t: time,
            p: price,
          }]
        }
      }
      if(uniswap_charts[address].chart_4h) {
        if((time - uniswap_charts[address].chart_4h[uniswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
          uniswap_charts[address].chart_4h.push({
            t: time,
            p: price,
          })
          uniswap_charts[address].chart_4h = uniswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
        }
      } else {
        uniswap_charts[address].chart_4h = [{
          t: time,
          p: price,
        }]
      }
      if(uniswap_charts[address].chart_3d) {
        if((time - uniswap_charts[address].chart_3d[uniswap_charts[address].chart_3d.length-1]['t']) > DAYS) {
          uniswap_charts[address].chart_3d.push({
            t: time,
            p: price,
          })
          uniswap_charts[address].chart_3d = uniswap_charts[address].chart_3d.slice(-HISTORY_SIZE)
        }
      } else {
        uniswap_charts[address].chart_3d = [{
          t: time,
          p: price,
        }]
      }
      if(uniswap_charts[address].chart_1w) {
        if((time - uniswap_charts[address].chart_1w[uniswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
          uniswap_charts[address].chart_1w.push({
            t: time,
            p: price,
          })
          uniswap_charts[address].chart_1w = uniswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
        }
      } else {
        uniswap_charts[address].chart_1w = [{
          t: time,
          p: price,
        }]
      }
  })


  // build Top 25 list of Uniswap
  uniswap_top = {}
  if(tokens.length > 0) {
    for (var i = 0; i < 25; i++) {
      const token = tokens[i]
      const address = token.id
      const symbol = token.symbol
      const name = token.name
      const price_ETH = token.derivedETH
      const price = price_ETH * eth_price

      uniswap_top[address] = {
        s: symbol,
        n: name,
        p: price,
        chart: uniswap_charts[address].chart_often
      }
    }
  }


  /* Store files */

  // Update the Uniswap list
  let pathFile = path.join(dir_home, 'uniswap.json')
  writeFile( pathFile, JSON.stringify( uniswap_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Uniswap top 25
  pathFile = path.join(dir_home, 'uniswap-top.json')
  writeFile( pathFile, JSON.stringify( uniswap_top ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Uniswap simple data
  pathFile = path.join(dir_home, 'uniswap-simple.json')
  writeFile( pathFile, JSON.stringify( uniswap_data ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Uniswap charts
  pathFile = path.join(dir_home, 'uniswap-charts.json')
  writeFile( pathFile, JSON.stringify( uniswap_charts ), "utf8", (err) => {
    if (err) throw err;
  });

}


// Program - Sushiswap
async function launchSushiswap() {
  // loop
  setTimeout(function(){ launchSushiswap() }, OFTEN) // every 15 minutes
  
  let sushiswap_data_file = {}
  let sushiswap_charts_file = {}
  try {
    sushiswap_data_file = require(path.join(dir_home, 'sushiswap-simple.json'))
    sushiswap_charts_file = require(path.join(dir_home, 'sushiswap-charts.json'))
  } catch(error) {
    // console.log(error)
  }

  sushiswap_data = sushiswap_data_file
  sushiswap_charts = sushiswap_charts_file


  // get data from Sushiswap
  const top = await getSushiswapTopTokens()



  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const eth_price = top.data ? top.data.bundle.ethPrice : 0

  tokens.forEach(token => {
      const address = token.id
      const symbol = token.symbol
      const name = token.name
      const price_ETH = token.derivedETH
      const price = price_ETH * eth_price

      // create Sushiswap list
      sushiswap_list[address] = symbol


      // update Sushiswap simple data
      sushiswap_data[address] = {
        s: symbol,
        n: name,
        p: price,
        t: time
      }

      // update Sushiswap charts
      //
      if(sushiswap_charts[address]) {
        if(time - sushiswap_charts[address].chart_often[sushiswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
          sushiswap_charts[address].chart_often.push({
            t: time,
            p: price,
          })
          sushiswap_charts[address].chart_often = sushiswap_charts[address].chart_often.slice(-HISTORY_SIZE)
        }
      } else {
        sushiswap_charts[address] = {
          s: symbol,
          n: name,
          chart_often: [{
            t: time,
            p: price,
          }]
        }
      }
      if(sushiswap_charts[address].chart_4h) {
        if((time - sushiswap_charts[address].chart_4h[sushiswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
          sushiswap_charts[address].chart_4h.push({
            t: time,
            p: price,
          })
          sushiswap_charts[address].chart_4h = sushiswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
        }
      } else {
        sushiswap_charts[address].chart_4h = [{
          t: time,
          p: price,
        }]
      }
      if(sushiswap_charts[address].chart_3d) {
        if((time - sushiswap_charts[address].chart_3d[sushiswap_charts[address].chart_3d.length-1]['t']) > DAYS) {
          sushiswap_charts[address].chart_3d.push({
            t: time,
            p: price,
          })
          sushiswap_charts[address].chart_3d = sushiswap_charts[address].chart_3d.slice(-HISTORY_SIZE)
        }
      } else {
        sushiswap_charts[address].chart_3d = [{
          t: time,
          p: price,
        }]
      }
      if(sushiswap_charts[address].chart_1w) {
        if((time - sushiswap_charts[address].chart_1w[sushiswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
          sushiswap_charts[address].chart_1w.push({
            t: time,
            p: price,
          })
          sushiswap_charts[address].chart_1w = sushiswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
        }
      } else {
        sushiswap_charts[address].chart_1w = [{
          t: time,
          p: price,
        }]
      }
  })


  // build Top 25 list of Sushiswap
  sushiswap_top = {}
  if(tokens.length > 0) {
    for (var i = 0; i < 25; i++) {
      const token = tokens[i]
      const address = token.id
      const symbol = token.symbol
      const name = token.name
      const price_ETH = token.derivedETH
      const price = price_ETH * eth_price

      sushiswap_top[address] = {
        s: symbol,
        n: name,
        p: price,
        chart: sushiswap_charts[address].chart_often
      }
    }
  }


  /* Store files */

  // Update the Sushiswap list
  let pathFile = path.join(dir_home, 'sushiswap.json')
  writeFile( pathFile, JSON.stringify( sushiswap_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Sushiswap top 25
  pathFile = path.join(dir_home, 'sushiswap-top.json')
  writeFile( pathFile, JSON.stringify( sushiswap_top ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Sushiswap simple data
  pathFile = path.join(dir_home, 'sushiswap-simple.json')
  writeFile( pathFile, JSON.stringify( sushiswap_data ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Sushiswap charts
  pathFile = path.join(dir_home, 'sushiswap-charts.json')
  writeFile( pathFile, JSON.stringify( sushiswap_charts ), "utf8", (err) => {
    if (err) throw err;
  });

}




/* MAIN */
setTimeout(function(){ launch() }, 1500)
setTimeout(function(){ launchUniswap() }, 2500)
setTimeout(function(){ launchSushiswap() }, 3500)









/* server */
const port = process.env.PORT || 3000
const app = express()

// Pancake URLs
app.get('/list/pancake', (req, res) => res.json(tokens_list))
app.get('/top/pancake', (req, res) => res.json(top_tokens))
app.get('/simple/pancake', (req, res) => res.json(tokens_data))
app.get('/charts/pancake', (req, res) => res.json(tokens_charts))
// Uniswap URLs
app.get('/list/uniswap', (req, res) => res.json(uniswap_list))
app.get('/top/uniswap', (req, res) => res.json(uniswap_top))
app.get('/simple/uniswap', (req, res) => res.json(uniswap_data))
app.get('/charts/uniswap', (req, res) => res.json(uniswap_charts))
// Sushiswap URLs
app.get('/list/sushiswap', (req, res) => res.json(sushiswap_list))
app.get('/top/sushiswap', (req, res) => res.json(sushiswap_top))
app.get('/simple/sushiswap', (req, res) => res.json(sushiswap_data))
app.get('/charts/sushiswap', (req, res) => res.json(sushiswap_charts))

app.listen(port, () => console.log(`Backend start at ${port}`))

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'})
  res.end('Hello World')
})
