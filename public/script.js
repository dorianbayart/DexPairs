
let getListTimer, getTopTimer, getSimpleTimer
let list = {}
let search = ''
let filteredList = {}
let topTokens = {}
let simple = {}
let charts = {}
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
    url: 'https://uniswap.org/',
    url_swap: 'https://app.uniswap.org/#/swap',
    url_data: '',
    explorer: 'https://etherscan.io/token/',
    tokens: {
      token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      base: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    }
  },
  SUSHISWAP: {
    name: 'SushiSwap',
    chain: 'Polygon/Matic',
    url: 'https://sushi.com/',
    url_swap: 'https://app.sushi.com/swap',
    url_data: '/sushiswap',
    explorer: 'https://polygonscan.com/token/',
    tokens: {
      token: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      base: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
    }
  },
  PANCAKESWAP: {
    disabled: 'true',
    name: 'PancakeSwap',
    chain: 'Binance Smart Chain',
    url: 'https://pancakeswap.finance/',
    url_swap: 'https://exchange.pancakeswap.finance/#/swap',
    url_data: '/pancake',
    explorer: 'https://bscscan.com/token/',
    tokens: {
      token: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      base: '0x55d398326f99059ff775485246999027b3197955'
    }
  },
}

const TIME_24H = 86400000
const TIMEFRAME_15M = '15m'
const TIMEFRAME_4H = '4h'
const TIMEFRAME_3D = '3d'
const TIMEFRAME_1W = '1w'
let timeframe = TIMEFRAME_4H


// get tokens list
// + put the list on the page
// + define events to update the main token when selected
function getList() {
  var xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      list = data
      if(list && Object.keys(list).length > 0) {
        updateList()
        updateBaseList()
        sessionStorage.setItem('list', JSON.stringify(list))
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/list", true)
  xmlhttp.send()

  getListTimer = setTimeout(function(){ getList() }, Math.round((90*Math.random() + 180)*1000))
}



// get simple data from server
// + update main/base tokens with default ones (WBNB/BUSD)
function getTop() {
  xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      topTokens = data
      if(topTokens && Object.keys(topTokens).length > 0) {
        setTop()
        sessionStorage.setItem('topTokens', JSON.stringify(topTokens))
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/top", true)
  xmlhttp.send()

  getTopTimer = setTimeout(function(){ getTop() }, Math.round((20*Math.random() + 20)*1000));
}



// get simple data from server
// + update main/base tokens with default ones
function getSimple() {
  xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      simple = data
      if(simple && Object.keys(simple).length > 0) {
        setToken(selectedToken)
        setBase(selectedBase)
        getCharts()
        sessionStorage.setItem('simple', JSON.stringify(simple))
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/simple", true)
  xmlhttp.send()

  getSimpleTimer = setTimeout(function(){ getSimple() }, Math.round((30*Math.random() + 45)*1000));
}



// get charts data from server
// + update chart
function getCharts() {
  xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      tokenCharts = data[selectedToken]
      baseCharts = data[selectedBase]
      if(tokenCharts && Object.keys(tokenCharts).length > 0) {
        updateCharts()
        setSwapperBase()
        sessionStorage.setItem('tokenCharts', JSON.stringify(tokenCharts))
        sessionStorage.setItem('baseCharts', JSON.stringify(baseCharts))
      }
    }
  }
  xmlhttp.open("GET", dexList[dex].url_data + "/charts/" + selectedToken + "/" + selectedBase, true)
  xmlhttp.send()
}



// defines event on search field
document.getElementById('search_field').addEventListener("keyup", function(e) {
  let searchValue = e.target.value.toLowerCase()
  search = searchValue

  filteredList = []
  Object.keys(list).forEach(function (address) {
    if(simple[address].s.toLowerCase().includes(search)) {
      filteredList.push(simple[address].s)
    }
  })

  updateList()
})



// set list from the list
function updateList() {
  if(Object.keys(list).length < 1) {
    return
  }

  let currentList = search.length > 0 ? filteredList : list;

  document.getElementById('list').innerHTML = null;
  ul = document.createElement('ul')
  Object.keys(currentList).forEach(function (address) {
    let li = document.createElement('li')
    ul.appendChild(li)

    li.innerHTML += currentList[address]
    li.addEventListener("click", function(e) {
      selectedToken = findAddressFromSymbol(e.target.innerHTML)
      setToken(selectedToken)
      getCharts()
      setSwapperToken()
      setSwapperBase()
    })
  })
  document.getElementById('list').appendChild(ul)
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
    option.value = currentList[address]
    option.selected = currentList[address] === selectedBase
  })
}


// set top tokens
function setTop() {
  if(Object.keys(topTokens).length < 1) {
    return
  }
  let top = document.getElementById('top')
  top.innerHTML = null
  for (var i = 0; i < 6; i++) {
    const address = Object.keys(topTokens)[i]
    const symbol = topTokens[address].s
    let div_column = document.createElement('div')
    div_column.classList.add('top-column')
    top.appendChild(div_column)

    let div = document.createElement('div')
    div.classList.add('top-token')
    div.id = symbol
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
      selectedToken = findAddressFromSymbol(e.target.id && !e.target.id.includes('chart') ? e.target.id : e.target.parentElement.id)
      setToken(selectedToken)
      getCharts()
      setSwapperToken()
      setSwapperBase()
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

    clearTimeout(getListTimer)
    clearTimeout(getSimpleTimer)
    clearTimeout(getTopTimer)

    getList()
    getSimple()
    getTop()
  }
)

// OnChange on Calculator [Selected/Base] => Update the other value
document.getElementById('swapper_token').addEventListener(
  "change", function(e) {
    document.getElementById('swapper_base').value =
    precise(document.getElementById('swapper_token').value
    * simple[selectedToken].p
    / simple[selectedBase].p)
  }
)

document.getElementById('swapper_base').addEventListener(
  "change", function(e) {
    document.getElementById('swapper_token').value =
    precise(document.getElementById('swapper_base').value
    / simple[selectedToken].p
    * simple[selectedBase].p)
  }
)

// OnClick on Edit Base token => Display the selection list
document.getElementById('base_change').addEventListener(
  "click", function(e) {
    document.getElementById('base_symbol').style.display = "none"
    document.getElementById('base_change').style.display = "none"
    document.getElementById('base_select').style.display = "flex"
  }
)
// OnChange on Base Selection => Update the Base Token + Chart
document.getElementById('base_select').addEventListener(
  "change", function(e) {
    document.getElementById('base_symbol').style.display = "flex"
    document.getElementById('base_change').style.display = "initial"
    document.getElementById('base_select').style.display = "none"
    const selected = findAddressFromSymbol(e.target.value)
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
  "click", function(e) {
    const temp = selectedToken
    selectedToken = selectedBase
    selectedBase = temp
    setToken(selectedToken)
    setBase(selectedBase)
    setSwapperToken()
    getCharts()
  }
)

// Timeframe selection
document.getElementById('timeframe_15m').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_15M
    updateCharts()
  }
)
document.getElementById('timeframe_4h').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_4H
    updateCharts()
  }
)
document.getElementById('timeframe_3d').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_3D
    updateCharts()
  }
)
document.getElementById('timeframe_1w').addEventListener(
  "click", function(e) {
    timeframe = TIMEFRAME_1W
    updateCharts()
  }
)




/* MAIN */
initializeHTML()
getList()
getSimple()
getTop()





function initializeHTML() {
  if(sessionStorage.getItem('list')) {
    dex = sessionStorage.getItem('dex')
    selectedToken = sessionStorage.getItem('selectedToken')
    selectedBase = sessionStorage.getItem('selectedBase')
    timeframe = sessionStorage.getItem('timeframe')
    list = JSON.parse(sessionStorage.getItem('list'))
    if(list && Object.keys(list).length > 0) { updateList() }
    topTokens = JSON.parse(sessionStorage.getItem('topTokens'))
    if(topTokens && Object.keys(topTokens).length > 0) { setTop() }
    simple = JSON.parse(sessionStorage.getItem('simple'))
    if(simple && Object.keys(simple).length > 0) {
      setToken(selectedToken)
      setBase(selectedBase)

      tokenCharts = JSON.parse(sessionStorage.getItem('tokenCharts'))
      baseCharts = JSON.parse(sessionStorage.getItem('baseCharts'))
      if(tokenCharts && baseCharts && Object.keys(tokenCharts).length > 0 && Object.keys(baseCharts).length > 0) {
        updateCharts()
        setSwapperToken()
        setSwapperBase()
      }
    }
  } else {
    // default selection
    selectedToken = dexList[dex].tokens.token
    selectedBase = dexList[dex].tokens.base
  }

  let dexSelector = document.getElementById('dex-selector')
  Object.keys(dexList).filter(item => !dexList[item].disabled).forEach((item, i) => {
    let option = document.createElement('option')
    dexSelector.appendChild(option)
    option.innerHTML += dexList[item].name + ' - ' + dexList[item].chain
    option.value = item
    option.selected = dexList[item].name.toUpperCase() === dex
  });
}

function saveSessionVariables() {
  sessionStorage.setItem('dex', dex)
  sessionStorage.setItem('selectedToken', selectedToken)
  sessionStorage.setItem('selectedBase', selectedBase)
  sessionStorage.setItem('timeframe', timeframe)
}


function updateCharts() {
  saveSessionVariables()

  let tokenChart = null, baseChart = null, scaleUnit = 'hour'
  switch (timeframe) {
    case TIMEFRAME_15M:
      tokenChart = tokenCharts.chart_often
      baseChart = baseCharts.chart_often
      scaleUnit = 'hour'
      break;
    case TIMEFRAME_3D:
      tokenChart = tokenCharts.chart_3d
      baseChart = baseCharts.chart_3d
      scaleUnit = 'day'
      break;
    case TIMEFRAME_1W:
      tokenChart = tokenCharts.chart_1w
      baseChart = baseCharts.chart_1w
      scaleUnit = 'month'
      break;
    case TIMEFRAME_4H:
    default:
      tokenChart = tokenCharts.chart_4h
      baseChart = baseCharts.chart_4h
      scaleUnit = 'day'
      break;
  }

  let timeData = tokenChart.map(coords => new Date(coords.t))
  let tokenData = tokenChart.map(coords => {
    const baseCoords = baseChart.find(base => base.t === coords.t)
    return baseCoords ? coords.p / baseCoords.p : null
  })

  var ctx = document.getElementById('myChart').getContext('2d')
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
        maintainAspectRatio: false,
        //aspectRatio: 0.75,
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
// Find Address From Symbol
function findAddressFromSymbol(symbol) {
  return Object.keys(simple).find(
      address => simple[address].s === symbol
  )
}

// Round number
function precise(x) {
  if(x > 9999) { return Math.round(x) }
  else if(x > 0.0001) { return Number.parseFloat(x).toPrecision(5) }
  return Number.parseFloat(x).toPrecision(2)
}

// Calculate percentage change of last 24h
function getPercentage24h(chart) {
  const chart24h = extract24hChart(chart)
  const first = chart24h[0]
  const last = chart24h[chart24h.length - 1]
  // round with 2 digits after commma
  return Math.round((last.p - first.p) / first.p * 10000) / 100
}

// Return only last 24h data from a chart
function extract24hChart(chart) {
  const last_t = chart[chart.length-1].t
  return chart.filter(({t}) => last_t-t <= TIME_24H)
}
