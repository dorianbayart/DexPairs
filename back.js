const http = require('http')
const os = require('os')
const path = require('path')
const express = require('express')
const fetch = require('node-fetch')
const { readFileSync, writeFile } = require('fs')



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


const VOLUME_SIZE = 12
const REALTIME = 20000 // 20 seconds
const OFTEN = 900000 // 15 minutes
const HOURS = 14400000 // 4 hours
const DAYS = 259200000 // 3 days
const WEEK = 604800000 // 1 week
const HISTORY_SIZE = 192
const HISTORY_SIZE_24H = 96 // 24h / 15min
const TOP_SIZE = 6


/* DexPairs */


// Uniswap data - Ehtereum
let uniswap_list = {}
let uniswap_top = {}
let uniswap_data = {}
let uniswap_charts = {}
let uniswap_volume = {}

// Pancake data - BinanceSmartChain
let tokens_list = {}
let top_tokens = {}
let tokens_data = {}
let tokens_charts = {}
let pancakeswap_volume = {}

// Sushiswap data - Polygon/Matic
let sushiswap_list = {}
let sushiswap_top = {}
let sushiswap_data = {}
let sushiswap_charts = {}
let sushiswap_volume = {}

// Spiritswap data - Fantom/Opera
let spiritswap_list = {}
let spiritswap_top = {}
let spiritswap_data = {}
let spiritswap_charts = {}
let spiritswap_volume = {}

// Honeyswap data - xDai
let honeyswap_list = {}
let honeyswap_top = {}
let honeyswap_data = {}
let honeyswap_charts = {}
let honeyswap_volume = {}



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


// Get Pancakeswap's top
const pancakeswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedBNB,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    bnbPrice
  }
}
`

// Use TheGraph API - https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2
async function getPancakeswapTopTokens() {
  return await get("https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2", pancakeswap_request)
}

// Get Uniswap's top
const uniswap_request = `
query
{
  tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc, where: { volumeUSD_gt: "100" } ) {
    id
    name
    symbol
    derivedETH,
    volumeUSD
  }
  bundle(id: "1" ) {
    ethPriceUSD
  }
}
`

// Use TheGraph API - https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3
async function getUniswapTopTokens() {
  return await get("https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3", uniswap_request)
}

// Get Sushiswap's top
const sushiswap_request = `
query
{
  tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc, where: { liquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedETH,
    volumeUSD
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

// Get Spiritswap's top
const spiritswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedFTM,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ftmPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/layer3org/spiritswap-analytics
async function getSpiritswapTopTokens() {
  return await get("https://api.thegraph.com/subgraphs/name/layer3org/spiritswap-analytics", spiritswap_request)
}

// Get Honeywap's top
const honeyswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedETH,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/kirkins/honeyswap
async function getHoneyswapTopTokens() {
  return await get("https://api.thegraph.com/subgraphs/name/kirkins/honeyswap", honeyswap_request)
}




// Program - Pancake
async function launch() {
  // loop
  setTimeout(function(){ launch() }, REALTIME) // every few seconds

  let tokens_data_file = {}
  let tokens_charts_file = {}
  let pancakeswap_volume_file = {}

  try {
    tokens_data_file = readFileSync(path.join(dir_home, 'pancake-simple.json'), 'utf8')
    tokens_data = JSON.parse(tokens_data_file.toString())
    let pathFile = path.join(dir_home, 'save_pancake-simple.json')
    writeFileSync(pathFile, JSON.stringify( tokens_data ), 'utf8')
  } catch(error) {
    console.log('pancake-simple.json', error)
    tokens_data_file = readFileSync(path.join(dir_home, 'save_pancake-simple.json'), 'utf8')
    tokens_data = JSON.parse(tokens_data_file.toString())
  }

  try {
    tokens_charts_file = readFileSync(path.join(dir_home, 'pancake-charts.json'), 'utf8')
    tokens_charts = JSON.parse(tokens_charts_file.toString())
    let pathFile = path.join(dir_home, 'save_pancake-charts.json')
    writeFileSync(pathFile, JSON.stringify( tokens_data ), 'utf8')
  } catch(error) {
    console.log('pancake-charts.json', error)
    tokens_charts_file = readFileSync(path.join(dir_home, 'save_pancake-charts.json'), 'utf8')
    tokens_charts = JSON.parse(tokens_charts_file.toString())
  }

  try {
    pancakeswap_volume_file = readFileSync(path.join(dir_home, 'pancake-volume.json'), 'utf8')
    pancakeswap_volume = JSON.parse(pancakeswap_volume_file.toString())
    let pathFile = path.join(dir_home, 'save_pancake-volume.json')
    writeFileSync(pathFile, JSON.stringify( tokens_data ), 'utf8')
  } catch(error) {
    console.log('pancake-volume.json', error)
    pancakeswap_volume_file = readFileSync(path.join(dir_home, 'save_pancake-volume.json'), 'utf8')
    pancakeswap_volume = JSON.parse(pancakeswap_volume_file.toString())
  }



  tokens_list = {}

  // get data from PancakeSwap
  let top = {}
  try {
    top = await getPancakeswapTopTokens()
  } catch(error) {
    console.log(error)
    return
  }


  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const bnb_price = top.data ? top.data.bundle.bnbPrice : 0


  tokens.forEach(token => {
    const address = token.id
    const symbol = token.symbol
    const name = token.name
    const price_BNB = token.derivedBNB
    const price = price_BNB * bnb_price
    const volumeUSD = token.tradeVolumeUSD

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
    if(pancakeswap_volume[address]) {
      if(time - pancakeswap_volume[address][pancakeswap_volume[address].length-1]['t'] > OFTEN) {
        pancakeswap_volume[address].push({
          t: time,
          v: volumeUSD,
        })
        pancakeswap_volume[address] = pancakeswap_volume[address].slice(-VOLUME_SIZE)
      }
    } else {
      pancakeswap_volume[address] = [{
        t: time,
        v: volumeUSD,
      }]
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
  })


  // Sort tokens depending on volume
  tokens_list = sortTokensByVolume(tokens_list, pancakeswap_volume)

  // build Top 10 list
  top_tokens = {}
  if(tokens.length > 0) {
    for (var i = 0; i < TOP_SIZE; i++) {
      const address = Object.keys(tokens_list)[i]
      const symbol = tokens_list[address]
      const name = tokens_data[address].n
      const price = tokens_data[address].p
      const volume = pancakeswap_volume[address][pancakeswap_volume[address].length-1].v - pancakeswap_volume[address][0].v

      top_tokens[address] = {
        s: symbol,
        n: name,
        p: price,
        v: volume,
        chart: tokens_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
      }
    }
  }





  /* Store files */

  // Update the tokens list
  let pathFile = path.join(dir_home, 'pancake.json')
  writeFile( pathFile, JSON.stringify( tokens_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Top 10 tokens list
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

  // Update the Pancakeswap volumeUSD
  pathFile = path.join(dir_home, 'pancake-volume.json')
  writeFile( pathFile, JSON.stringify( pancakeswap_volume ), "utf8", (err) => {
    if (err) throw err;
  });

}


// Program - Uniswap
async function launchUniswap() {
  // loop
  setTimeout(function(){ launchUniswap() }, REALTIME) // every few seconds

  let uniswap_data_file = {}
  let uniswap_charts_file = {}
  let uniswap_volume_file = {}
  try {
    uniswap_data_file = require(path.join(dir_home, 'uniswap-simple.json'))
    uniswap_charts_file = require(path.join(dir_home, 'uniswap-charts.json'))
    uniswap_volume_file = require(path.join(dir_home, 'uniswap-volume.json'))

    uniswap_data = uniswap_data_file
    uniswap_charts = uniswap_charts_file
    uniswap_volume = uniswap_volume_file
  } catch(error) {
    console.log(error)
    return
  }


  uniswap_list = {}

  // get data from Uniswap
  const top = await getUniswapTopTokens()



  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const eth_price = top.data ? top.data.bundle.ethPriceUSD : 0

  tokens.forEach(token => {
    const address = token.id
    const symbol = token.symbol
    const name = token.name
    const price_ETH = token.derivedETH
    const price = price_ETH * eth_price
    const volumeUSD = token.volumeUSD

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
    if(uniswap_volume[address]) {
      if(time - uniswap_volume[address][uniswap_volume[address].length-1]['t'] > OFTEN) {
        uniswap_volume[address].push({
          t: time,
          v: volumeUSD,
        })
        uniswap_volume[address] = uniswap_volume[address].slice(-VOLUME_SIZE)
      }
    } else {
      uniswap_volume[address] = [{
        t: time,
        v: volumeUSD,
      }]
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

  // Sort tokens depending on volume
  uniswap_list = sortTokensByVolume(uniswap_list, uniswap_volume)

  // build Top 10 list of Uniswap
  uniswap_top = {}
  if(tokens.length > 0) {
    for (var i = 0; i < TOP_SIZE; i++) {
      const address = Object.keys(uniswap_list)[i]
      const symbol = uniswap_list[address]
      const name = uniswap_data[address].n
      const price = uniswap_data[address].p
      const volume = uniswap_volume[address][uniswap_volume[address].length-1].v - uniswap_volume[address][0].v

      uniswap_top[address] = {
        s: symbol,
        n: name,
        p: price,
        v: volume,
        chart: uniswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
      }
    }
  }


  /* Store files */

  // Update the Uniswap list
  let pathFile = path.join(dir_home, 'uniswap.json')
  writeFile( pathFile, JSON.stringify( uniswap_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Uniswap Top 10
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

  // Update the Uniswap volumeUSD
  pathFile = path.join(dir_home, 'uniswap-volume.json')
  writeFile( pathFile, JSON.stringify( uniswap_volume ), "utf8", (err) => {
    if (err) throw err;
  });

}


// Program - Sushiswap
async function launchSushiswap() {
  // loop
  setTimeout(function(){ launchSushiswap() }, REALTIME) // every few seconds

  let sushiswap_data_file = {}
  let sushiswap_charts_file = {}
  let sushiswap_volume_file = {}
  try {
    sushiswap_data_file = require(path.join(dir_home, 'sushiswap-simple.json'))
    sushiswap_charts_file = require(path.join(dir_home, 'sushiswap-charts.json'))
    sushiswap_volume_file = require(path.join(dir_home, 'sushiswap-volume.json'))

    sushiswap_data = sushiswap_data_file
    sushiswap_charts = sushiswap_charts_file
    sushiswap_volume = sushiswap_volume_file
  } catch(error) {
    console.log(error)
    return
  }



  sushiswap_list = {}


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
    const volumeUSD = token.volumeUSD

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
    if(sushiswap_volume[address]) {
      if(time - sushiswap_volume[address][sushiswap_volume[address].length-1]['t'] > OFTEN) {
        sushiswap_volume[address].push({
          t: time,
          v: volumeUSD,
        })
        sushiswap_volume[address] = sushiswap_volume[address].slice(-VOLUME_SIZE)
      }
    } else {
      sushiswap_volume[address] = [{
        t: time,
        v: volumeUSD,
      }]
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

  // Sort tokens depending on volume
  sushiswap_list = sortTokensByVolume(sushiswap_list, sushiswap_volume)

  // build Top 10 list of Sushiswap
  sushiswap_top = {}
  if(tokens.length > 0) {
    for (var i = 0; i < TOP_SIZE; i++) {
      const address = Object.keys(sushiswap_list)[i]
      const symbol = sushiswap_list[address]
      const name = sushiswap_data[address].n
      const price = sushiswap_data[address].p
      const volume = sushiswap_volume[address][sushiswap_volume[address].length-1].v - sushiswap_volume[address][0].v

      sushiswap_top[address] = {
        s: symbol,
        n: name,
        p: price,
        v: volume,
        chart: sushiswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
      }
    }
  }


  /* Store files */

  // Update the Sushiswap list
  let pathFile = path.join(dir_home, 'sushiswap.json')
  writeFile( pathFile, JSON.stringify( sushiswap_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Sushiswap Top 10
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

  // Update the Sushiswap volumeUSD
  pathFile = path.join(dir_home, 'sushiswap-volume.json')
  writeFile( pathFile, JSON.stringify( sushiswap_volume ), "utf8", (err) => {
    if (err) throw err;
  });

}


// Program - Spiritswap
async function launchSpiritswap() {
  // loop
  setTimeout(function(){ launchSpiritswap() }, REALTIME) // every few seconds

  let spiritswap_data_file = {}
  let spiritswap_charts_file = {}
  let spiritswap_volume_file = {}
  try {
    spiritswap_data_file = require(path.join(dir_home, 'spiritswap-simple.json'))
    spiritswap_charts_file = require(path.join(dir_home, 'spiritswap-charts.json'))
    spiritswap_volume_file = require(path.join(dir_home, 'spiritswap-volume.json'))

    spiritswap_data = spiritswap_data_file
    spiritswap_charts = spiritswap_charts_file
    spiritswap_volume = spiritswap_volume_file
  } catch(error) {
    console.log(error)
    return
  }


  spiritswap_list = {}

  // get data from Spiritswap
  let top = {}
  try {
    top = await getSpiritswapTopTokens()
  } catch(error) {
    console.log(error)
    return
  }


  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const ftm_price = top.data ? top.data.bundle.ftmPrice : 0

  tokens.forEach(token => {
    const address = token.id
    const symbol = token.symbol
    const name = token.name
    const price_FTM = token.derivedFTM
    const price = price_FTM * ftm_price
    const volumeUSD = token.tradeVolumeUSD

    // create Spiritswap list
    spiritswap_list[address] = symbol


    // update Spiritswap simple data
    spiritswap_data[address] = {
      s: symbol,
      n: name,
      p: price,
      t: time
    }

    // update Spiritswap charts
    //
    if(spiritswap_charts[address]) {
      if(time - spiritswap_charts[address].chart_often[spiritswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
        spiritswap_charts[address].chart_often.push({
          t: time,
          p: price,
        })
        spiritswap_charts[address].chart_often = spiritswap_charts[address].chart_often.slice(-HISTORY_SIZE)
      }
    } else {
      spiritswap_charts[address] = {
        s: symbol,
        n: name,
        chart_often: [{
          t: time,
          p: price,
        }]
      }
    }
    if(spiritswap_volume[address]) {
      if(time - spiritswap_volume[address][spiritswap_volume[address].length-1]['t'] > OFTEN) {
        spiritswap_volume[address].push({
          t: time,
          v: volumeUSD,
        })
        spiritswap_volume[address] = spiritswap_volume[address].slice(-VOLUME_SIZE)
      }
    } else {
      spiritswap_volume[address] = [{
        t: time,
        v: volumeUSD,
      }]
    }
    if(spiritswap_charts[address].chart_4h) {
      if((time - spiritswap_charts[address].chart_4h[spiritswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
        spiritswap_charts[address].chart_4h.push({
          t: time,
          p: price,
        })
        spiritswap_charts[address].chart_4h = spiritswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
      }
    } else {
      spiritswap_charts[address].chart_4h = [{
        t: time,
        p: price,
      }]
    }
    if(spiritswap_charts[address].chart_3d) {
      if((time - spiritswap_charts[address].chart_3d[spiritswap_charts[address].chart_3d.length-1]['t']) > DAYS) {
        spiritswap_charts[address].chart_3d.push({
          t: time,
          p: price,
        })
        spiritswap_charts[address].chart_3d = spiritswap_charts[address].chart_3d.slice(-HISTORY_SIZE)
      }
    } else {
      spiritswap_charts[address].chart_3d = [{
        t: time,
        p: price,
      }]
    }
    if(spiritswap_charts[address].chart_1w) {
      if((time - spiritswap_charts[address].chart_1w[spiritswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
        spiritswap_charts[address].chart_1w.push({
          t: time,
          p: price,
        })
        spiritswap_charts[address].chart_1w = spiritswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
      }
    } else {
      spiritswap_charts[address].chart_1w = [{
        t: time,
        p: price,
      }]
    }
  })

  // Sort tokens depending on volume
  spiritswap_list = sortTokensByVolume(spiritswap_list, spiritswap_volume)

  // build Top 10 list of Spiritswap
  spiritswap_top = {}
  if(tokens.length > 0) {
    for (var i = 0; i < TOP_SIZE; i++) {
      const address = Object.keys(spiritswap_list)[i]
      const symbol = spiritswap_list[address]
      const name = spiritswap_data[address].n
      const price = spiritswap_data[address].p
      const volume = spiritswap_volume[address][spiritswap_volume[address].length-1].v - spiritswap_volume[address][0].v

      spiritswap_top[address] = {
        s: symbol,
        n: name,
        p: price,
        v: volume,
        chart: spiritswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
      }
    }
  }


  /* Store files */

  // Update the Spiritswap list
  let pathFile = path.join(dir_home, 'spiritswap.json')
  writeFile( pathFile, JSON.stringify( spiritswap_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Spiritswap Top 10
  pathFile = path.join(dir_home, 'spiritswap-top.json')
  writeFile( pathFile, JSON.stringify( spiritswap_top ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Spiritswap simple data
  pathFile = path.join(dir_home, 'spiritswap-simple.json')
  writeFile( pathFile, JSON.stringify( spiritswap_data ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Spiritswap charts
  pathFile = path.join(dir_home, 'spiritswap-charts.json')
  writeFile( pathFile, JSON.stringify( spiritswap_charts ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Spiritswap volumeUSD
  pathFile = path.join(dir_home, 'spiritswap-volume.json')
  writeFile( pathFile, JSON.stringify( spiritswap_volume ), "utf8", (err) => {
    if (err) throw err;
  });

}



// Program - Honeyswap
async function launchHoneyswap() {
  // loop
  setTimeout(function(){ launchHoneyswap() }, REALTIME) // every few seconds

  let honeyswap_data_file = {}
  let honeyswap_charts_file = {}
  let honeyswap_volume_file = {}
  try {
    honeyswap_data_file = require(path.join(dir_home, 'honeyswap-simple.json'))
    honeyswap_charts_file = require(path.join(dir_home, 'honeyswap-charts.json'))
    honeyswap_volume_file = require(path.join(dir_home, 'honeyswap-volume.json'))

    honeyswap_data = honeyswap_data_file
    honeyswap_charts = honeyswap_charts_file
    honeyswap_volume = honeyswap_volume_file
  } catch(error) {
    console.log(error)
    return
  }


  honeyswap_list = {}

  // get data from Honeyswap
  let top = {}
  try {
    top = await getHoneyswapTopTokens()
  } catch(error) {
    console.log(error)
    return
  }


  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const eth_price = top.data ? top.data.bundle.ethPrice : 0

  tokens.forEach(token => {
    const address = token.id
    const symbol = token.symbol
    const name = token.name
    const price_ETH = token.derivedETH
    const price = price_ETH * eth_price
    const volumeUSD = token.tradeVolumeUSD

    // create Honeyswap list
    honeyswap_list[address] = symbol


    // update Honeyswap simple data
    honeyswap_data[address] = {
      s: symbol,
      n: name,
      p: price,
      t: time
    }

    // update Honeyswap charts
    //
    if(honeyswap_charts[address]) {
      if(time - honeyswap_charts[address].chart_often[honeyswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
        honeyswap_charts[address].chart_often.push({
          t: time,
          p: price,
        })
        honeyswap_charts[address].chart_often = honeyswap_charts[address].chart_often.slice(-HISTORY_SIZE)
      }
    } else {
      honeyswap_charts[address] = {
        s: symbol,
        n: name,
        chart_often: [{
          t: time,
          p: price,
        }]
      }
    }
    if(honeyswap_volume[address]) {
      if(time - honeyswap_volume[address][honeyswap_volume[address].length-1]['t'] > OFTEN) {
        honeyswap_volume[address].push({
          t: time,
          v: volumeUSD,
        })
        honeyswap_volume[address] = honeyswap_volume[address].slice(-VOLUME_SIZE)
      }
    } else {
      honeyswap_volume[address] = [{
        t: time,
        v: volumeUSD,
      }]
    }
    if(honeyswap_charts[address].chart_4h) {
      if((time - honeyswap_charts[address].chart_4h[honeyswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
        honeyswap_charts[address].chart_4h.push({
          t: time,
          p: price,
        })
        honeyswap_charts[address].chart_4h = honeyswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
      }
    } else {
      honeyswap_charts[address].chart_4h = [{
        t: time,
        p: price,
      }]
    }
    if(honeyswap_charts[address].chart_3d) {
      if((time - honeyswap_charts[address].chart_3d[honeyswap_charts[address].chart_3d.length-1]['t']) > DAYS) {
        honeyswap_charts[address].chart_3d.push({
          t: time,
          p: price,
        })
        honeyswap_charts[address].chart_3d = honeyswap_charts[address].chart_3d.slice(-HISTORY_SIZE)
      }
    } else {
      honeyswap_charts[address].chart_3d = [{
        t: time,
        p: price,
      }]
    }
    if(honeyswap_charts[address].chart_1w) {
      if((time - honeyswap_charts[address].chart_1w[honeyswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
        honeyswap_charts[address].chart_1w.push({
          t: time,
          p: price,
        })
        honeyswap_charts[address].chart_1w = honeyswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
      }
    } else {
      honeyswap_charts[address].chart_1w = [{
        t: time,
        p: price,
      }]
    }
  })

  // Sort tokens depending on volume
  honeyswap_list = sortTokensByVolume(honeyswap_list, honeyswap_volume)

  // build Top 10 list of Honeyswap
  honeyswap_top = {}
  if(tokens.length > 0) {
    for (var i = 0; i < TOP_SIZE; i++) {
      const address = Object.keys(honeyswap_list)[i]
      const symbol = honeyswap_list[address]
      const name = honeyswap_data[address].n
      const price = honeyswap_data[address].p
      const volume = honeyswap_volume[address][honeyswap_volume[address].length-1].v - honeyswap_volume[address][0].v

      honeyswap_top[address] = {
        s: symbol,
        n: name,
        p: price,
        v: volume,
        chart: honeyswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
      }
    }
  }


  /* Store files */

  // Update the Honeyswap list
  let pathFile = path.join(dir_home, 'honeyswap.json')
  writeFile( pathFile, JSON.stringify( honeyswap_list ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Honeyswap Top 10
  pathFile = path.join(dir_home, 'honeyswap-top.json')
  writeFile( pathFile, JSON.stringify( honeyswap_top ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Honeyswap simple data
  pathFile = path.join(dir_home, 'honeyswap-simple.json')
  writeFile( pathFile, JSON.stringify( honeyswap_data ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Honeyswap charts
  pathFile = path.join(dir_home, 'honeyswap-charts.json')
  writeFile( pathFile, JSON.stringify( honeyswap_charts ), "utf8", (err) => {
    if (err) throw err;
  });

  // Update the Honeyswap volumeUSD
  pathFile = path.join(dir_home, 'honeyswap-volume.json')
  writeFile( pathFile, JSON.stringify( honeyswap_volume ), "utf8", (err) => {
    if (err) throw err;
  });

}




/* MAIN */
setTimeout(function(){ launchUniswap() }, 2500)
setTimeout(function(){ launchSushiswap() }, 5000)
setTimeout(function(){ launchSpiritswap() }, 7500)
setTimeout(function(){ launchHoneyswap() }, 10000)
setTimeout(function(){ launch() }, 12500)





/* Useful - Sort a List depending on Volume */
const sortTokensByVolume = (listToSort, listVolume) => {
  return Object.fromEntries(
    Object.entries(listToSort).sort(
      (a, b) => {
        const addrA = a[0]
        const addrB = b[0]
        const volA = listVolume[addrA][listVolume[addrA].length-1].v - listVolume[addrA][0].v
        const volB = listVolume[addrB][listVolume[addrB].length-1].v - listVolume[addrB][0].v
        return volB - volA
      }
    )
  )
}



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
// Spiritswap URLs
app.get('/list/spiritswap', (req, res) => res.json(spiritswap_list))
app.get('/top/spiritswap', (req, res) => res.json(spiritswap_top))
app.get('/simple/spiritswap', (req, res) => res.json(spiritswap_data))
app.get('/charts/spiritswap', (req, res) => res.json(spiritswap_charts))
// Honeyswap URLs
app.get('/list/honeyswap', (req, res) => res.json(honeyswap_list))
app.get('/top/honeyswap', (req, res) => res.json(honeyswap_top))
app.get('/simple/honeyswap', (req, res) => res.json(honeyswap_data))
app.get('/charts/honeyswap', (req, res) => res.json(honeyswap_charts))

app.listen(port, () => console.log(`Backend start at ${port}`))

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'})
  res.end('Hello World')
})
