'use strict'


import http from 'http'
import os from 'os'
import path from 'path'
import express from 'express'
import fetch from 'node-fetch'
import { createClient } from 'redis'


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
* Store them on Redis
*/




const VOLUME_SIZE = 12
const OFTEN = process.env.NODE_ENV === 'production' ? 900000 : 240000 // 15 minutes or 4 minutes
const HOURS = 14400000 // 4 hours
const DAY = 86400000 // 1 day
const WEEK = 604800000 // 1 week
const HISTORY_SIZE = process.env.NODE_ENV === 'production' ? 320 : 96 // more data on Prod
const HISTORY_SIZE_24H = 96 // 24h / 15min
const TOP_SIZE = 6



/* Redis */
const redis = createClient({
  url: 'redis://localhost:6666'
})


/* DexPairs */



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
    })
  }
  return new Promise((resolve, reject) => {
    fetch(url)
    .then((response) => response.json())
    .then(resolve)
    .catch(reject)
  })
}


// Get Pancakeswap's top
const pancakeswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10", derivedBNB_gt: "0" } ) {
    id
    name
    symbol
    derivedBNB
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    bnbPrice
  }
}
`

// Use TheGraph API - https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2
async function getPancakeswapTopTokens() {
  return await get('https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2', pancakeswap_request)
}




// Get Sushiswap's top on BNB Chain
const sushiswap_bnb_request = `
query
{
  tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc, where: { volumeUSD_gt: "10", derivedETH_gt: "0" } ) {
    id
    name
    symbol
    derivedETH
    volumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/hosted-service/subgraph/sushiswap/bsc-exchange
async function getSushiswapBNBTopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/sushiswap/bsc-exchange', sushiswap_bnb_request)
}


// Get Uniswap v3 top on BNB
const uniswapV3_bnb_request = `
query
{
  tokens(first: 1000, orderBy: totalValueLockedUSD, orderDirection: desc, where: { volumeUSD_gt: "10000", derivedETH_gt: "0", totalValueLockedUSD_gt: "10000" } ) {
    id
    name
    symbol
    derivedETH
    volumeUSD
  }
  bundle(id: "1" ) {
    ethPriceUSD
  }
}
`

// Use TheGraph API - https://thegraph.com/hosted-service/subgraph/ianlapham/uniswap-v3-bsc
async function getUniswapV3BNBTopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-bsc', uniswapV3_bnb_request)
}

// Get Uniswap v3 top on Arbitrum
const uniswapV3_arbitrum_request = `
query
{
  tokens(first: 1000, orderBy: totalValueLockedUSD, orderDirection: desc, where: { volumeUSD_gt: "50000", derivedETH_gt: "0", totalValueLockedUSD_gt: "25000" } ) {
    id
    name
    symbol
    derivedETH
    volumeUSD
  }
  bundle(id: "1" ) {
    ethPriceUSD
  }
}
`

// Use TheGraph API - https://thegraph.com/hosted-service/subgraph/revert-finance/uniswap-v3-arbitrum
// https://github.com/revert-finance/uniswap-v3-subgraph
async function getUniswapV3ArbitrumTopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/revert-finance/uniswap-v3-arbitrum', uniswapV3_arbitrum_request)
}

// Get Uniswap v3 top
const uniswapV3_request = `
query
{
  tokens(first: 1000, orderBy: totalValueLockedUSD, orderDirection: desc, where: { volumeUSD_gt: "10000", derivedETH_gt: "0", totalValueLockedUSD_gt: "50000" } ) {
    id
    name
    symbol
    derivedETH
    volumeUSD
  }
  bundle(id: "1" ) {
    ethPriceUSD
  }
}
`

// Use TheGraph API - https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3
async function getUniswapV3TopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', uniswapV3_request)
}

// Get Uniswap v2 top
const uniswapV2_request = `
query
{
  tokens(first: 400, orderBy: tradeVolumeUSD, orderDirection: desc, where: { tradeVolumeUSD_gt: "100000", derivedETH_gt: "0" } ) {
    id
    name
    symbol
    derivedETH
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/uniswap/uniswap-v2
async function getUniswapV2TopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', uniswapV2_request)
}

// Get Quickswap v3 top
const polygon_quickswap_v3_request = `
query
{
  tokens(first: 1000, orderBy: totalValueLockedUSD, orderDirection: desc, where: { volumeUSD_gt: "100000", derivedMatic_gt: "0", totalValueLockedUSD_gt: "10000" } ) {
    id
    name
    symbol
    derivedMatic
    volumeUSD
  }
  bundle(id: "1" ) {
    maticPriceUSD
  }
}
`

// Use TheGraph API - https://thegraph.com/hosted-service/subgraph/sameepsi/quickswap-v3
async function getQuickswapV3TopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/sameepsi/quickswap-v3', polygon_quickswap_v3_request)
}

// Get Sushiswap's top
const polygon_sushiswap_request = `
query
{
  tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc, where: { liquidity_gt: "10", volumeUSD_gt: "1000", derivedETH_gt: "0" } ) {
    id
    name
    symbol
    derivedETH
    volumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/hosted-service/subgraph/sushiswap/matic-exchange
async function getPolygonSushiSwapTopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange', polygon_sushiswap_request)
}

// Get Spiritswap's top
const spiritswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { tradeVolumeUSD_gt: "100000", derivedFTM_gt: "0" } ) {
    id
    name
    symbol
    derivedFTM
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ftmPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/layer3org/spiritswap-analytics
async function getSpiritswapTopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/layer3org/spiritswap-analytics', spiritswap_request)
}

// Get Honeywap's top
const honeyswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { tradeVolumeUSD_gt: "100000", derivedETH_gt: "0" } ) {
    id
    name
    symbol
    derivedETH
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/kirkins/honeyswap
async function getHoneyswapTopTokens() {
  return await get('https://api.thegraph.com/subgraphs/name/kirkins/honeyswap', honeyswap_request)
}




// Program - Ethereum
async function launchEthereum() {
  const chain = 'eth'

  let data = {}

  // get data
  const top = await getUniswapV3TopTokens()
  const topV2 = await getUniswapV2TopTokens()

  const time = Date.now()
  const tokensV3 = top.data ? top.data.tokens : []
  const tokensV2 = topV2.data ? topV2.data.tokens : []

  // Keep in v2 only tokens that are not already in v3
  let filteredv2 = tokensV2.filter(token => !tokensV3.map(item => item.id).includes(token.id))
  // then concat tokanV2 and filteredTokensV2
  const tokens = tokensV3.concat(filteredv2)

  const eth_price = top.data ? top.data.bundle.ethPriceUSD : 0
  if(eth_price === 0 || tokens.length === 0) return

  try {
    const data_str = await redis.get(chain+':data')
    data = JSON.parse(data_str) ?? data
  } catch(e) {
    console.error(chain+':data', e)
  }

  for(const token of tokens) {
    const price_ETH = token.derivedETH === '0' && tokensV2.find(item => item.id === token.id) ? tokensV2.find(item => item.id === token.id).derivedETH : token.derivedETH

    const point = {
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      price: price_ETH * eth_price,
      volumeUSD: token.volumeUSD ? token.volumeUSD : token.tradeVolumeUSD
    }

    await buildCharts(chain, point, data, time)
  }

  // build Top 10 list
  let top10 = {}
  if(tokens.length > 0) {
    // Sort tokens depending on volume
    data = Object.fromEntries(Object.entries(data).sort(sortByVolume))
    await buildTop(chain, top10, data)
  }

  // Update the Top 10
  if(Object.keys(top10).length > 0) {
    await redis.set(chain+':top', JSON.stringify(top10))
  }

  // Update the simple data
  if(Object.keys(data).length > 0) {
    await redis.set(chain+':data', JSON.stringify(data))
  }
}


// Program - BNB Chain
async function launchBnbChain() {
  const chain = 'bnb'

  let data = {}

  // get data from Uniswap
  const top = await getUniswapV3BNBTopTokens()

  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const bnb_price = top.data ? top.data.bundle.ethPriceUSD : 0
  if(bnb_price === 0 || tokens.length === 0) return

  try {
    const data_str = await redis.get(chain+':data')
    data = JSON.parse(data_str) ?? data
  } catch(e) {
    console.error(chain+':data', e)
  }

  for(const token of tokens) {
    const point = {
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      price: token.derivedETH * bnb_price,
      volumeUSD: token.volumeUSD
    }

    await buildCharts(chain, point, data, time)
  }

  // build Top 10 list
  let top10 = {}
  if(tokens.length > 0) {
    // Sort tokens depending on volume
    data = Object.fromEntries(Object.entries(data).sort(sortByVolume))
    await buildTop(chain, top10, data)
  }

  // Update the Top 10
  if(Object.keys(top10).length > 0) {
    await redis.set(chain+':top', JSON.stringify(top10))
  }

  // Update the simple data
  if(Object.keys(data).length > 0) {
    await redis.set(chain+':data', JSON.stringify(data))
  }
}



// Program - Gnosis
async function launchGnosis() {
  const chain = 'gno'

  let data = {}

  // get data from Uniswap
  const top = await getHoneyswapTopTokens()

  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const xdai_price = top.data ? top.data.bundle.ethPrice : 0
  if(xdai_price === 0 || tokens.length === 0) return

  try {
    const data_str = await redis.get(chain+':data')
    data = JSON.parse(data_str) ?? data
  } catch(e) {
    console.error(chain+':data', e)
  }

  for(const token of tokens) {
    const point = {
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      price: token.derivedETH * xdai_price,
      volumeUSD: token.tradeVolumeUSD
    }

    await buildCharts(chain, point, data, time)
  }

  // build Top 10 list
  let top10 = {}
  if(tokens.length > 0) {
    // Sort tokens depending on volume
    data = Object.fromEntries(Object.entries(data).sort(sortByVolume))
    await buildTop(chain, top10, data)
  }

  // Update the Top 10
  if(Object.keys(top10).length > 0) {
    await redis.set(chain+':top', JSON.stringify(top10))
  }

  // Update the simple data
  if(Object.keys(data).length > 0) {
    await redis.set(chain+':data', JSON.stringify(data))
  }
}


// Program - Polygon
async function launchPolygon() {
  const chain = 'matic'

  let data = {}

  // get data from Uniswap
  const top = await getQuickswapV3TopTokens()

  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const matic_price = top.data ? top.data.bundle.maticPriceUSD : 0
  if(matic_price === 0 || tokens.length === 0) return

  try {
    const data_str = await redis.get(chain+':data')
    data = JSON.parse(data_str) ?? data
  } catch(e) {
    console.error(chain+':data', e)
  }

  for(const token of tokens) {
    const point = {
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      price: token.derivedMatic * matic_price,
      volumeUSD: token.volumeUSD
    }

    await buildCharts(chain, point, data, time)
  }

  // build Top 10 list
  let top10 = {}
  if(tokens.length > 0) {
    // Sort tokens depending on volume
    data = Object.fromEntries(Object.entries(data).sort(sortByVolume))
    await buildTop(chain, top10, data)
  }

  // Update the Top 10
  if(Object.keys(top10).length > 0) {
    await redis.set(chain+':top', JSON.stringify(top10))
  }

  // Update the simple data
  if(Object.keys(data).length > 0) {
    await redis.set(chain+':data', JSON.stringify(data))
  }
}



// Program - Fantom
async function launchFantom() {
  const chain = 'ftm'

  let data = {}

  // get data from Uniswap
  const top = await getSpiritswapTopTokens()

  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const ftm_price = top.data ? top.data.bundle.ftmPrice : 0
  if(ftm_price === 0 || tokens.length === 0) return

  try {
    const data_str = await redis.get(chain+':data')
    data = JSON.parse(data_str) ?? data
  } catch(e) {
    console.error(chain+':data', e)
  }

  for(const token of tokens) {
    const point = {
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      price: token.derivedFTM * ftm_price,
      volumeUSD: token.tradeVolumeUSD
    }

    await buildCharts(chain, point, data, time)
  }

  // build Top 10 list
  let top10 = {}
  if(tokens.length > 0) {
    // Sort tokens depending on volume
    data = Object.fromEntries(Object.entries(data).sort(sortByVolume))
    await buildTop(chain, top10, data)
  }

  // Update the Top 10
  if(Object.keys(top10).length > 0) {
    await redis.set(chain+':top', JSON.stringify(top10))
  }

  // Update the simple data
  if(Object.keys(data).length > 0) {
    await redis.set(chain+':data', JSON.stringify(data))
  }
}



// Program - Arbitrum
async function launchArbitrum() {
  const chain = 'arb1'

  let data = {}

  // get data
  const top = await getUniswapV3ArbitrumTopTokens()

  const time = Date.now()
  const tokens = top.data ? top.data.tokens : []

  const eth_price = top.data ? top.data.bundle.ethPriceUSD : 0
  if(eth_price === 0 || tokens.length === 0) return

  try {
    const data_str = await redis.get(chain+':data')
    data = JSON.parse(data_str) ?? data
  } catch(e) {
    console.error(chain+':data', e)
  }

  for(const token of tokens) {
    const point = {
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      price: token.derivedETH * eth_price,
      volumeUSD: token.volumeUSD
    }

    await buildCharts(chain, point, data, time)
  }

  // build Top 10 list
  let top10 = {}
  if(tokens.length > 0) {
    // Sort tokens depending on volume
    data = Object.fromEntries(Object.entries(data).sort(sortByVolume))
    await buildTop(chain, top10, data)
  }

  // Update the Top 10
  if(Object.keys(top10).length > 0) {
    await redis.set(chain+':top', JSON.stringify(top10))
  }

  // Update the simple data
  if(Object.keys(data).length > 0) {
    await redis.set(chain+':data', JSON.stringify(data))
  }
}




const buildCharts = async (chain, point, data, time) => {
  const address = point.address
  const price = point.price
  const volumeUSD = Number(point.volumeUSD)

  // update simple data
  data[address] = {
    s: point.symbol,
    n: point.name,
    p: price,
    t: time
  }

  // update charts
  //
  // c1 is 'often'
  let often = []
  try {
    const often_str = await redis.get(chain+':c1:'+address)
    often = JSON.parse(often_str) ?? often
  } catch(e) {
    console.error(chain+':c1:'+address, e)
  }
  if(often.length === 0 || time - often[often.length-1]['t'] > OFTEN) {
    often.push({
      t: time,
      p: price,
    })
    often = often.slice(-HISTORY_SIZE)

    await redis.set(chain+':c1:'+address, JSON.stringify(often))
  }

  let volume = []
  try {
    const volume_str = await redis.get(chain+':vol:'+address)
    volume = JSON.parse(volume_str) ?? volume
  } catch(e) {
    console.error(chain+':vol', e)
  }
  if(volume.length === 0 || time - volume[volume.length-1]['t'] > OFTEN) {
    volume.push({
      t: time,
      v: volumeUSD,
    })
    volume = volume.slice(-HISTORY_SIZE)

    await redis.set(chain+':vol:'+address, JSON.stringify(volume))
  }

  if(volume.length > 4) { // volume over last 24h (or last few points)
    data[address].v = volume[volume.length-1].v - volume.filter(point => volume[volume.length-1].t - point.t < DAY )[0].v
  }

  // c2 is '4 hours'
  let c2 = []
  try {
    const c2_str = await redis.get(chain+':c2:'+address)
    c2 = JSON.parse(c2_str) ?? c2
  } catch(e) {
    console.error(chain+':c2:'+address, e)
  }
  if(c2.length === 0 || time - c2[c2.length-1]['t'] > HOURS) {
    c2.push({
      t: time,
      p: price,
    })
    c2 = c2.slice(-HISTORY_SIZE)

    await redis.set(chain+':c2:'+address, JSON.stringify(c2))
  }

  // c3 is '1 day'
  let c3 = []
  try {
    const c3_str = await redis.get(chain+':c3:'+address)
    c3 = JSON.parse(c3_str) ?? c3
  } catch(e) {
    console.error(chain+':c3:'+address, e)
  }
  if(c3.length === 0 || time - c3[c3.length-1]['t'] > DAY) {
    c3.push({
      t: time,
      p: price,
    })
    c3 = c3.slice(-HISTORY_SIZE)

    await redis.set(chain+':c3:'+address, JSON.stringify(c3))
  }

  // c4 is '1 week'
  let c4 = []
  try {
    const c4_str = await redis.get(chain+':c4:'+address)
    c4 = JSON.parse(c4_str) ?? c4
  } catch(e) {
    console.error(chain+':c4:'+address, e)
  }
  if(c4.length === 0 || time - c4[c4.length-1]['t'] > WEEK) {
    c4.push({
      t: time,
      p: price,
    })
    c4 = c4.slice(-HISTORY_SIZE)

    await redis.set(chain+':c4:'+address, JSON.stringify(c4))
  }
}

const buildTop = async (chain, top, data) => {
  for (let i = 0; i < TOP_SIZE; i++) {
    const address = Object.keys(data)[i]
    const symbol = data[address].s
    const name = data[address].n
    const price = data[address].p
    const volume = data[address].v

    let often = []
    try {
      const often_str = await redis.get(chain+':c1:'+address)
      often = JSON.parse(often_str) ?? often
    } catch(e) {
      console.error(chain+':c1:'+address, e)
    }

    top[address] = {
      s: symbol,
      n: name,
      p: price,
      v: volume,
      chart: often.slice(-HISTORY_SIZE_24H)
    }
  }
}





/* MAIN */
async function main() {
  await redis.connect()

  setTimeout(launchEthereum, 5000)

  setTimeout(launchBnbChain, 10000)

  setTimeout(launchGnosis, 15000)

  setTimeout(launchPolygon, 20000)

  setTimeout(launchFantom, 25000)

  setTimeout(launchArbitrum, 30000)

  setTimeout(async () => { await redis.quit() }, 40000)
}


main()
console.log('Back.js is working ...')



/* Useful - Sort a List depending on Volume */
/* DEPRECATED - Not used */
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
/* Useful - Sort a List depending on Volume */
const sortByVolume = (a, b) => {
  if(!a[1].v) return 1
  return b[1].v - a[1].v
}
