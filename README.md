
# [DexPairs.xyz](https://dexpairs.xyz/)


## What is DexPairs.xyz ?

* Get and store subgraph data from different protocols on different blockchains
* [Charts](https://dexpairs.xyz/charts)
  * Display the price charts of any token against any other token (eg: [compare MATIC vs ETH on Polygon/Matic network](https://dexpairs.xyz/charts?dex=QUICKSWAP&token=WMATIC&base=WETH&interval=4h&timeframe=1m))
  * Star your favorite pairs to keep an eye on multiple charts
* [Wallet](https://dexpairs.xyz/wallet)
  * Cross-chain transactions and tokens explorer
  * Search tokens in transactions on different protocols
  * Display balances/prices/values
  * Display NFTs collection (only ERC-721)
  * Estimate wallet history with a global chart (based on Ethereum price evolution)



## Supported protocols and blockchains

### Charts

* [x] [Uniswap (v2 + v3) - Ethereum](https://dexpairs.xyz/charts?dex=UNISWAP)
* [x] [QuickSwap - Polygon/Matic](https://dexpairs.xyz/charts?dex=QUICKSWAP)
* [x] [PancakeSwap v2 - Binance Smart Chain](https://dexpairs.xyz/charts?dex=PANCAKESWAP)
* [x] [SpiritSwap - Fantom](https://dexpairs.xyz/charts?dex=SPIRITSWAP)
* [x] [HoneySwap - xDai](https://dexpairs.xyz/charts?dex=HONEYSWAP)



### Wallet

#### Protocols

* [x] Aave v2 - Ethereum & Polygon/Matic
* [x] Beefy.finance - Multichain
* [ ] Compound (borrowed tokens not supported) - Ethereum
* [ ] Venus (borrowed tokens not supported) - Binance Smart Chain

#### Blockchains
* [x] Ethereum
* [x] Binance Smart Chain
* [x] Gnosis Chain (formerly xDai)
* [x] Polygon / Matic
* [x] Fantom Opera
* [x] Arbitrum One
* [x] Celo
* [x] Avalanche


## Roadmap

[See the roadmap directly on GitHub](https://github.com/dorianbayart/DexPairs/projects/1)



-----
## How To Deploy

1. Clone the repository  
```
git clone https://github.com/dorianbayart/DexPairs.git
```

2. Install dependencies  
```
yarn
```

3. Start the server in Dev mode  
```
yarn dev
```  
This will start the API and the web app at [localhost:3001](http://localhost:3001)

4. Stop processes  
```
yarn stop
```



-----
-----
#### Thanks

[ChainList.org](https://chainid.network/chains_mini.json) for networks data  
[Feathericons](https://feathericons.com/) for the icons
