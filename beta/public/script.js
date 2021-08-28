'use strict'

let getListTimer, getTopTimer, getSimpleTimer
let list = {}
let search = ''
let filteredList = {}
let topTokens = {}
let simple = {}
let selectedToken = ''
let selectedBase = ''
let tokenCharts = {}
let baseCharts = {}
let myChart = null
let dex = 'UNISWAP'
let dexList = {
  UNISWAP: {
    name: 'Uniswap',
    chain: 'Ethereum',
    chain_enum: 'ETHEREUM',
    url: 'https://uniswap.org/',
    url_swap: 'https://app.uniswap.org/#/swap',
    url_data: server,
    explorer: 'https://etherscan.io/token/',
    tokens: {
      token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      base: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    }
  },
  SUSHISWAP: {
    name: 'SushiSwap',
    chain: 'Polygon/Matic',
    chain_enum: 'POLYGON',
    url: 'https://sushi.com/',
    url_swap: 'https://app.sushi.com/swap',
    url_data: server + '/sushiswap',
    explorer: 'https://polygonscan.com/token/',
    tokens: {
      token: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      base: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
    }
  },
  PANCAKESWAP: {
    name: 'PancakeSwap',
    chain: 'Binance Smart Chain',
    chain_enum: 'BSC',
    url: 'https://pancakeswap.finance/',
    url_swap: 'https://exchange.pancakeswap.finance/#/swap',
    url_data: server + '/pancake',
    explorer: 'https://bscscan.com/token/',
    tokens: {
      token: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      base: '0xe9e7cea3dedca5984780bafc599bd69add087d56'
    }
  },
  SPIRITSWAP: {
    name: 'SpiritSwap',
    chain: 'Fantom/Opera',
    chain_enum: 'FANTOM',
    url: 'https://www.spiritswap.finance/',
    url_swap: 'https://swap.spiritswap.finance/#/swap',
    url_data: server + '/spiritswap',
    explorer: 'https://ftmscan.com/token/',
    tokens: {
      token: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
      base: '0x04068da6c83afcfa0e13ba15a6696662335d5b75'
    }
  },
  HONEYSWAP: {
    name: 'HoneySwap',
    chain: 'xDai',
    chain_enum: 'XDAI',
    url: 'https://honeyswap.org/',
    url_swap: 'https://app.honeyswap.org/#/swap',
    url_data: server + '/honeyswap',
    explorer: 'https://blockscout.com/xdai/mainnet/tokens/',
    tokens: {
      token: '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9',
      base: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'
    }
  },
}

const INTERVAL_15M = '15m'
const INTERVAL_4H = '4h'
const INTERVAL_3D = '3d'
const INTERVAL_1W = '1w'
const TIMEFRAME_24H = '24h'
const TIMEFRAME_1W = '1w'
const TIMEFRAME_1M = '1m'
const TIMEFRAME_1Y = '1y'
const TIMEFRAME_ALL = 'all'
const LIST_INITIAL_SIZE = 100
let interval = INTERVAL_4H
let timeframe = TIMEFRAME_1W


// get tokens list
// + put the list on the page
// + define events to update the main token when selected
function getList() {
  let xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText)
      list = data
      if(list && Object.keys(list).length > 0) {
        updateList()
        sessionStorage.setItem('list', JSON.stringify(list))
      } else {
        clearTimeout(getListTimer)
        getListTimer = setTimeout(getList, 3000)
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/list", true)
  xmlhttp.send()

  clearTimeout(getListTimer)
  getListTimer = setTimeout(getList, Math.round((90*Math.random() + 180)*1000))
}



// get simple data from server
// + update main/base tokens with default ones (WBNB/BUSD)
function getTop() {
  let xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText)
      topTokens = data
      if(topTokens && Object.keys(topTokens).length > 0) {
        setTop()
        sessionStorage.setItem('topTokens', JSON.stringify(topTokens))
      } else {
        clearTimeout(getTopTimer)
        getTopTimer = setTimeout(getTop, 5000)
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/top", true)
  xmlhttp.send()

  clearTimeout(getTopTimer)
  getTopTimer = setTimeout(getTop, Math.round((5*Math.random() + 15)*1000))
}



// get simple data from server
// + update main/base tokens with default ones
function getSimple() {
  let xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText)
      simple = data
      if(simple && Object.keys(simple).length > 0) {

        if(selectedToken.length !== 42) {
          let found = findAddressFromSymbol(selectedToken)
          if(found) {
            selectedToken = found
          } else {
            selectedToken = dexList[dex].tokens.token
          }
        }

        if(selectedBase.length !== 42) {
          let found = findAddressFromSymbol(selectedBase)
          if(found) {
            selectedBase = found
          } else {
            selectedBase = dexList[dex].tokens.base
          }
        }

        setToken(selectedToken)
        setBase(selectedBase)
        getCharts()
        sessionStorage.setItem('simple', JSON.stringify(simple))
      } else {
        clearTimeout(getSimpleTimer)
        getSimpleTimer = setTimeout(getSimple, 4000)
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/simple", true)
  xmlhttp.send()

  clearTimeout(getSimpleTimer)
  getSimpleTimer = setTimeout(getSimple, Math.round((30*Math.random() + 30)*1000))
}



// get charts data from server
// + update chart
function getCharts() {
  let xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText)
      tokenCharts = data[selectedToken]
      baseCharts = data[selectedBase]
      if(tokenCharts && Object.keys(tokenCharts).length > 0) {
        updateCharts()
        setSwapperBase()
        sessionStorage.setItem('tokenCharts', JSON.stringify(tokenCharts))
        sessionStorage.setItem('baseCharts', JSON.stringify(baseCharts))
      } else {
        setTimeout(getCharts, 3000)
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/charts/" + selectedToken + "/" + selectedBase, true)
  xmlhttp.send()
}



// defines event on search field
document.getElementById('search_field').addEventListener("keyup", function(e) {
  search = e.target.value.toLowerCase()

  filteredList = {}
  Object.keys(list).forEach(function (address) {
    if(address.toLowerCase().includes(search) || simple[address].s.toLowerCase().includes(search) || simple[address].n.toLowerCase().includes(search)) {
      filteredList[address] = simple[address].s
    }
  })

  updateList()

  if(search.length > 0 && ALPHA_NUM.includes(e.key.toLowerCase())) {
    debounce(selectToken)(Object.keys(filteredList)[0])
  }
})

/* Select the token */
function selectToken(selected) {
  if(!selected || !simple[selected]) return

  selectedToken = selected
  setToken(selectedToken)
  getCharts()
  setSwapperToken()
  setSwapperBase()

  let listLi = document.getElementById('list').querySelectorAll('li')
  listLi.forEach((li) => {
    li.classList.toggle('active', li.id === selectedToken)
  })
}



// set list from the list
function updateList() {
  if(Object.keys(list).length < 1) {
    return
  }

  let currentList = search.length > 0 ? filteredList : list

  document.getElementById('list').innerHTML = null;
  const ul = document.createElement('ul')

  const fullList = sessionStorage.getItem('full-list')
  const length = Object.keys(currentList).length > LIST_INITIAL_SIZE && !fullList ? LIST_INITIAL_SIZE : Object.keys(currentList).length
  for (let i = 0; i < length; i++) {
    let address = Object.keys(currentList)[i]
    let li = document.createElement('li')
    ul.appendChild(li)
    li.id = address
    li.innerHTML += currentList[address]
    li.classList.toggle('active', li.id === selectedToken)
    li.addEventListener("click", function(e) {
      selectToken(e.target.id)
    })
  }
  document.getElementById('list').appendChild(ul)

  if(!fullList && Object.keys(currentList).length > LIST_INITIAL_SIZE) {
    let button = document.createElement('button')
    button.innerHTML = "Load more"
    button.title = "Display the full list"
    button.classList.add('load-more')
    document.getElementById('list').appendChild(button)
    button.addEventListener("click", function() {
      sessionStorage.setItem('full-list', true)
      updateList()
    })
  }

}

// set base list selection
function updateBaseList() {
  if(Object.keys(list).length < 1) {
    return
  }

  let currentList = list

  document.getElementById('base_select').innerHTML = null
  let select = document.getElementById('base_select')
  Object.keys(currentList).forEach(function (address) {
    let option = document.createElement('option')
    select.appendChild(option)
    option.innerHTML += currentList[address]
    option.value = address
    option.selected = address === selectedBase
  })
}


// set top tokens
function setTop() {
  if(Object.keys(topTokens).length < 1) {
    return
  }
  let top = document.getElementById('top')
  top.innerHTML = null
  for (let i = 0; i < 6; i++) {
    const address = Object.keys(topTokens)[i]
    const symbol = topTokens[address].s
    let div_column = document.createElement('div')
    div_column.classList.add('top-column')
    top.appendChild(div_column)

    let div = document.createElement('div')
    div.classList.add('top-token')
    div.id = address
    let div_symbol = document.createElement('div')
    div_symbol.innerHTML = symbol
    div_symbol.classList.add('top-symbol')
    let div_price = document.createElement('div')
    div_price.innerHTML = precise(topTokens[address].p)
    div_price.classList.add('top-price')
    let container_chart = document.createElement('div')
    container_chart.classList.add('top-chart')
    let canvas_chart = document.createElement('canvas')
    canvas_chart.id = 'chart_' + address

    let div_percentage = document.createElement('div')
    div_percentage.classList.add('top-percentage')
    div_percentage.classList.add('color-transition')

    const miniChart = extract24hChart(topTokens[address].chart)
    const percentage = getPercentage24h(miniChart)
    div_percentage.innerHTML = percentage + '%'
    div_percentage.classList.add(percentage >= 0 ? 'green' : 'red')

    div_column.appendChild(div)
    div.appendChild(div_symbol)
    div.appendChild(div_price)
    div.appendChild(div_percentage)
    div.appendChild(container_chart)
    container_chart.appendChild(canvas_chart)

    setTopMiniChart(address, miniChart)

    div.addEventListener("click", function(e) {
      selectedToken = e.target.id && !e.target.id.includes('chart') ? e.target.id : e.target.parentElement.id
      selectToken(selectedToken)
    })
  }
}

function setTopMiniChart(addr, tokenChart) {
  const timeData = tokenChart.map(coords => new Date(coords.t))
  const tokenData = tokenChart.map(coords => coords.p)

  const ctx = document.getElementById('chart_' + addr).getContext('2d')
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeData,
      datasets: [{
        data: tokenData,
        backgroundColor: '#0000FF88',
        borderColor: '#0000FF88',
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
          enabled: false
        }
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


// set information of the main token
function setToken(addr) {
  if(Object.keys(simple).length < 1) {
    return
  }
  const symbol = simple[addr].s
  document.getElementById('token_symbol').innerHTML = symbol
  document.getElementById('token_name').innerHTML = simple[addr].n
  let address = addr.slice(0, 5) + '...' + addr.slice(-5)
  let a = document.createElement('a')
  a.href = dexList[dex].explorer + addr
  a.target = '_blank'
  a.innerHTML = address
  a.rel = 'noopener'
  document.getElementById('token_address').innerHTML = null
  document.getElementById('token_address').appendChild(a)
  document.getElementById('token_price').innerHTML = '$ ' + precise(simple[addr].p)

  setSwapperToken()
}

// set information of the base token
function setBase(addr) {
  if(Object.keys(simple).length < 1) {
    return
  }
  const symbol = simple[addr].s
  document.getElementById('base_symbol').innerHTML = symbol
  document.getElementById('base_name').innerHTML = simple[addr].n
  let address = addr.slice(0, 5) + '...' + addr.slice(-5)
  let a = document.createElement('a')
  a.href = dexList[dex].explorer + addr
  a.target = '_blank'
  a.innerHTML = address
  a.rel = 'noopener'
  document.getElementById('base_address').innerHTML = null
  document.getElementById('base_address').appendChild(a)
  document.getElementById('base_price').innerHTML = '$ ' + precise(simple[addr].p)
}

// Calculator fields
function setSwapperToken() {
  document.getElementById('swapper_token_symbol').innerHTML = simple[selectedToken].s
  document.getElementById('swapper_token').value = 1
}
function setSwapperBase() {
  document.getElementById('swapper_base_symbol').innerHTML = simple[selectedBase].s
  document.getElementById('swapper_base').value = precise(document.getElementById('swapper_token').value * simple[selectedToken].p / simple[selectedBase].p)
}




// OnChange on Dex Selector
document.getElementById('dex-selector').addEventListener(
  "change", function(e) {

    dex = e.target.value
    selectedToken = dexList[dex].tokens.token
    selectedBase = dexList[dex].tokens.base

    const img = document.getElementById('dex-selection-img')
    img.src = NETWORK[dexList[dex].chain_enum].img
    img.alt = dexList[dex].chain + ' Logo'

    const bodyBackground = document.getElementById('body-background')
    bodyBackground.style.backgroundImage = "url(" + NETWORK[dexList[dex].chain_enum].img + ")"

    clearTimeout(getListTimer)
    clearTimeout(getSimpleTimer)
    clearTimeout(getTopTimer)

    getList()
    getSimple()
    getTop()

    setSourceDataText()
  }
)

// OnChange on Calculator [Selected/Base] => Update the other value
document.getElementById('swapper_token').addEventListener(
  "change", function() {
    document.getElementById('swapper_base').value =
    precise(document.getElementById('swapper_token').value
    * simple[selectedToken].p
    / simple[selectedBase].p)
  }
)

document.getElementById('swapper_base').addEventListener(
  "change", function() {
    document.getElementById('swapper_token').value =
    precise(document.getElementById('swapper_base').value
    / simple[selectedToken].p
    * simple[selectedBase].p)
  }
)

// OnClick on Edit Base token => Display the selection list
document.getElementById('base_change').addEventListener(
  "click", function() {
    updateBaseList()
    document.getElementById('base_symbol').style.display = "none"
    document.getElementById('base_change').style.display = "none"
    document.getElementById('base_select').style.display = "flex"
  }
)
// OnChange on Base Selection => Update the Base Token + Chart
document.getElementById('base_select').addEventListener(
  "change", function(e) {
    document.getElementById('base_symbol').style.display = "flex"
    document.getElementById('base_change').style.display = "flex"
    document.getElementById('base_select').style.display = "none"
    const selected = e.target.value
    if(selected === selectedToken) {
      selectedToken = selectedBase
      setToken(selectedToken)
    }
    selectedBase = selected

    setBase(selectedBase)
    getCharts()
    setSwapperToken()
    setSwapperBase()
  }
)

// Switch between Selected and Base tokens
document.getElementById('swapper_switch').addEventListener(
  "click", function() {
    const temp = selectedToken
    selectedToken = selectedBase
    selectedBase = temp
    setBase(selectedBase)
    selectToken(selectedToken)
  }
)

// Interval selection
document.getElementById('interval_15m').addEventListener(
  "click", function(e) {
    interval = INTERVAL_15M
    updateCharts()

    setActiveInterval(e.target)
  }
)
document.getElementById('interval_4h').addEventListener(
  "click", function(e) {
    interval = INTERVAL_4H
    updateCharts()

    setActiveInterval(e.target)
  }
)
document.getElementById('interval_3d').addEventListener(
  "click", function(e) {
    interval = INTERVAL_3D
    updateCharts()

    setActiveInterval(e.target)
  }
)
document.getElementById('interval_1w').addEventListener(
  "click", function(e) {
    interval = INTERVAL_1W
    updateCharts()

    setActiveInterval(e.target)
  }
)
// Set Active class on the clicked div
function setActiveInterval(item) {
  let list = document.getElementById('interval').querySelectorAll('div.interval-choice')
  list.forEach((div) => {
    div.classList.toggle('active', div.id === item.id || div.textContent === item.textContent)
  })
}

// Timeframe selection
document.getElementById('timeframe_24h').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_24H
    updateCharts()

    setActiveTimeframe(e.target)
  }
)
document.getElementById('timeframe_1w').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_1W
    updateCharts()

    setActiveTimeframe(e.target)
  }
)
document.getElementById('timeframe_1m').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_1M
    updateCharts()

    setActiveTimeframe(e.target)
  }
)
document.getElementById('timeframe_1y').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_1Y
    updateCharts()

    setActiveTimeframe(e.target)
  }
)
document.getElementById('timeframe_all').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_ALL
    updateCharts()

    setActiveTimeframe(e.target)
  }
)
// Set Active class on the clicked div
function setActiveTimeframe(item) {
  let list = document.getElementById('timeframe').querySelectorAll('div.timeframe-choice')
  list.forEach((div) => {
    div.classList.toggle('active', div.id === item.id || div.textContent === item.textContent)
  })
}

// Share this chart - Button
document.getElementById('share_charts').addEventListener('click', () => {
  const location = window.location
  if (navigator.share) {
    navigator.share({
      title: location.hostname + ' | ' + simple[selectedToken].s + ' | $' + precise(simple[selectedToken].p),
      text: simple[selectedToken].s + ' price on ' + DOMAIN_NAME + ' | $' + precise(simple[selectedToken].p),
      url: window.location.href
    }).then(() => {
      console.log('Thanks for sharing!')
    })
    .catch(console.error);
  } else {
    console.log(location.hostname + ' | ' + simple[selectedToken].s + ' | $' + precise(simple[selectedToken].p))
  }
});




/* MAIN */
initializeHTML()
getList()
getSimple()
getTop()





function initializeHTML() {
  // default tokens
  selectedToken = dexList[dex].tokens.token
  selectedBase = dexList[dex].tokens.base

  if(sessionStorage.getItem('dex')) {
    dex = sessionStorage.getItem('dex')
    selectedToken = dexList[dex].tokens.token
    selectedBase = dexList[dex].tokens.base
  }
  if(sessionStorage.getItem('selectedToken')) {
    selectedToken = sessionStorage.getItem('selectedToken')
  }
  if(sessionStorage.getItem('selectedBase')) {
    selectedBase = sessionStorage.getItem('selectedBase')
  }
  if(sessionStorage.getItem('interval')) {
    interval = sessionStorage.getItem('interval')
  }
  if(sessionStorage.getItem('timeframe')) {
    timeframe = sessionStorage.getItem('timeframe')
  }

  if(sessionStorage.getItem('list')) {
    list = JSON.parse(sessionStorage.getItem('list'))
    if(list && Object.keys(list).length > 0) { updateList() }
    topTokens = JSON.parse(sessionStorage.getItem('topTokens'))
    if(topTokens && Object.keys(topTokens).length > 0) { setTop() }
    simple = JSON.parse(sessionStorage.getItem('simple'))
  }

  const params = new URLSearchParams(window.location.search)
  if(params.has('dex')) {
    dex = params.get('dex')
    selectedToken = dexList[dex].tokens.token
    selectedBase = dexList[dex].tokens.base
  }
  if(params.has('token')) {
    selectedToken = params.get('token')
  }
  if(params.has('base')) {
    selectedBase = params.get('base')
  }
  if(params.has('interval')) {
    interval = params.get('interval')
  }
  if(params.has('timeframe')) {
    timeframe = params.get('timeframe')
  }

  setActiveInterval({ textContent: interval })
  setActiveTimeframe({ textContent: timeframe })


  let dexSelector = document.getElementById('dex-selector')
  Object.keys(dexList).filter(item => !dexList[item].disabled).forEach((item) => {
    let option = document.createElement('option')
    dexSelector.appendChild(option)
    option.innerHTML += dexList[item].chain + ' - ' + dexList[item].name
    option.value = item
    option.selected = dexList[item].name.toUpperCase() === dex
  });

  const img = document.getElementById('dex-selection-img')
  img.src = NETWORK[dexList[dex].chain_enum].img
  img.alt = dexList[dex].chain + ' Logo'

  const bodyBackground = document.getElementById('body-background')
  bodyBackground.style.backgroundImage = "url(" + NETWORK[dexList[dex].chain_enum].img + ")"

  setSourceDataText()
}

function saveSessionVariables() {
  sessionStorage.setItem('dex', dex)
  sessionStorage.setItem('selectedToken', selectedToken)
  sessionStorage.setItem('selectedBase', selectedBase)
  sessionStorage.setItem('interval', interval)
  sessionStorage.setItem('timeframe', timeframe)

  updateURLParams()
}


// Update text indicating the source of data
function setSourceDataText() {
  let source_data = document.getElementById('source_data')
  source_data.innerHTML = null
  let a = document.createElement('a')
  a.href = NETWORK[dexList[dex].chain_enum].subgraph_url
  a.target = '_blank'
  a.innerHTML = 'Source: ' + dexList[dex].name + ' on ' + dexList[dex].chain + ' | TheGraph'
  a.title = 'Subgraph\'s playground of ' + dexList[dex].name + ' on ' + dexList[dex].chain
  source_data.appendChild(a)
}


function updateCharts() {
  saveSessionVariables()

  let tokenChart = null, baseChart = null, scaleUnit = 'day'
  switch (interval) {
    case INTERVAL_15M:
      tokenChart = tokenCharts.chart_often
      baseChart = baseCharts.chart_often
      scaleUnit = 'hour'
      break;
    case INTERVAL_3D:
      tokenChart = tokenCharts.chart_3d
      baseChart = baseCharts.chart_3d
      scaleUnit = 'day'
      break;
    case INTERVAL_1W:
      tokenChart = tokenCharts.chart_1w
      baseChart = baseCharts.chart_1w
      scaleUnit = 'month'
      break;
    case INTERVAL_4H:
    default:
      tokenChart = tokenCharts.chart_4h
      baseChart = baseCharts.chart_4h
      scaleUnit = 'day'
      break;
  }
  switch(timeframe) {
    case TIMEFRAME_24H:
      tokenChart = tokenChart.filter(dot => Date.now() - dot.t < TIME_24H)
      baseChart = baseChart.filter(dot => Date.now() - dot.t < TIME_24H)
      break;
    case TIMEFRAME_1M:
      tokenChart = tokenChart.filter(dot => Date.now() - dot.t < TIME_1M)
      baseChart = baseChart.filter(dot => Date.now() - dot.t < TIME_1M)
      break;
    case TIMEFRAME_1Y:
      tokenChart = tokenChart.filter(dot => Date.now() - dot.t < TIME_1Y)
      baseChart = baseChart.filter(dot => Date.now() - dot.t < TIME_1Y)
      break;
    case TIMEFRAME_ALL:
      break;
    case TIMEFRAME_1W:
    default:
      tokenChart = tokenChart.filter(dot => Date.now() - dot.t < TIME_1W)
      baseChart = baseChart.filter(dot => Date.now() - dot.t < TIME_1W)
      break;
  }

  let timeData = tokenChart.map(coords => new Date(coords.t))
  let tokenData = tokenChart.map(coords => {
    const baseCoords = baseChart.find(base => base.t === coords.t)
    if(baseCoords) {
      return coords.p / baseCoords.p
    }
    const price = estimatePriceInterpolation(baseChart, coords.t)
    return price ? coords.p / price : null
  })

  let ctx = document.getElementById('myChart').getContext('2d')
  if(myChart) {
    myChart.data.labels = timeData
    myChart.data.datasets[0].label = simple[selectedToken].s + ' / ' + simple[selectedBase].s
    myChart.data.datasets[0].data = tokenData
    myChart.options.scales.x.time.unit = scaleUnit
    myChart.options.scales.y.title.text = simple[selectedBase].s
    myChart.update()
  } else {
    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeData,
        datasets: [{
          label: simple[selectedToken].s + ' / ' + simple[selectedBase].s,
          data: tokenData,
          backgroundColor: '#0000FF88',
          borderColor: '#0000FF88',
          radius: 0,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: window.matchMedia( "(min-width: 600px)" ).matches ? 2.25 : 1.5,
        radius: 0,
        interaction: {
          intersect: false,
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            },
          },
          y: {
            title: {
              display: true,
              text: simple[selectedBase].s
            }
          }
        }
      }
    })
  }
}


// useful
// Estimate a Price at a time T - find 2 points and calculate a linear interpolation
function estimatePriceInterpolation(chart, t) {
  let index = chart.findIndex(coords => coords.t > t)
  if(index < 1) { return }
  // y3 = (x3-x1)*(y2-y1)/(x2-x1) + y1
  return (t-chart[index - 1].t)*(chart[index].p-chart[index - 1].p)/(chart[index].t-chart[index - 1].t) + chart[index - 1].p
}




// Utils
// Update URL with parameters
function updateURLParams() {
  const params = new URLSearchParams(window.location.search)
  params.set('dex', dex)
  params.set('token', selectedToken)
  params.set('base', selectedBase)
  params.set('interval', interval)
  params.set('timeframe', timeframe)

  const fullTitle = DOMAIN_NAME + ' | ' + simple[selectedToken].s + ' | $' + precise(simple[selectedToken].p)
  document.title = fullTitle
  document.querySelector('meta[property="og:title"]').setAttribute("content", fullTitle)
  document.querySelector('meta[property="og:url"]').setAttribute("content", window.location.href)

  window.history.replaceState(null, fullTitle, window.location.href.split("?")[0] + '?' + params.toString())
}



// useful
// Find Address From Symbol
function findAddressFromSymbol(symbol) {
  return Object.keys(simple).find(
      address => simple[address].s === symbol
  )
}
