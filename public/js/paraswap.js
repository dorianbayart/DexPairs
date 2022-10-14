'use strict'

const PARASWAP_PRICES_URL = 'https://apiv5.paraswap.io/prices/?srcToken=SRC_TOKEN&destToken=DEST_TOKEN&amount=AMOUNT&srcDecimals=SRC_DECIMALS&destDecimals=DEST_DECIMALS&side=SELL&network=NETWORK'
const PARASWAP_TRANSACTIONS_URL = 'https://apiv5.paraswap.io/transactions/NETWORK'
const PARASWAP_SUPPORTED_CHAINID = [1, 3, 56, 137, 250, 43114]
const PARASWAP_SLIPPAGE = 100 // 1%
const PARASWAP_PARTNER = 'DexPairs.xyz'
const PARASWAP_PARTNER_ADDRESS = '0x4A219b990a99190397bfb5Abd60A0337F08440C7'
const PARASWAP_PARTNER_FEE_PERCENT = 2500

let paraswapSrcToken = '', paraswapDestToken = '', paraswapTransferProxy = ''
let paraswapAmount = 0, paraswapSrcDecimals = 0, paraswapDestDecimals = 0, paraswapNetwork = 1
let paraswapPricesQuery = '', paraswapTransactionsQuery = ''
let paraswapAllowance = 0




const configureParaswap = (srcToken, destToken, amount, srcDecimals, destDecimals, network) => {
  paraswapSrcToken = srcToken
  paraswapDestToken = destToken
  paraswapSrcDecimals = srcDecimals
  paraswapDestDecimals = destDecimals
  paraswapNetwork = network

  setParaswapAmount(amount)
}

const setParaswapAmount = (amount) => {
  paraswapAmount = Math.floor(Number(amount) * Math.pow(10, paraswapSrcDecimals))
  setQueries()
}

const setQueries = () => {
  paraswapPricesQuery = PARASWAP_PRICES_URL.replace('SRC_TOKEN', paraswapSrcToken)
                          .replace('DEST_TOKEN', paraswapDestToken)
                          .replace('AMOUNT', paraswapAmount)
                          .replace('SRC_DECIMALS', paraswapSrcDecimals)
                          .replace('DEST_DECIMALS', paraswapDestDecimals)
                          .replace('NETWORK', paraswapNetwork)
  paraswapTransactionsQuery = PARASWAP_TRANSACTIONS_URL.replace('NETWORK', paraswapNetwork)
}

const getParaswapPrices = async () => {
  if(paraswapAmount === 0) {
    return 0
  }

  let response = await get(paraswapPricesQuery)
  console.log(response)
  paraswapTransferProxy = response.priceRoute.tokenTransferProxy
  return Number(response.priceRoute.destAmount) * Math.pow(10, -paraswapDestDecimals)
}
