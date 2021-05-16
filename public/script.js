
let list = []
let search = ''
let filteredList = []
let topTokens = {}
let simple = {}
let charts = {}
let selectedToken = 'WBNB'
let selectedBase = 'BUSD'
let tokenCharts = {}
let baseCharts = {}
let myChart = null



// get tokens list
// + put the list on the page
// + define events to update the main token when selected
function getList() {
  var xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      list = data.tokens

      updateList()
      updateBaseList()
    }
  }
  xmlhttp.open("GET", "/list", true)
  xmlhttp.send()

  setTimeout(function(){ getList() }, 300000);
}



// get simple data from server
// + update main/base tokens with default ones (WBNB/BUSD)
function getTop() {
  xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      topTokens = data
      setTop()
    }
  }
  xmlhttp.open("GET", "/top", true)
  xmlhttp.send()

  setTimeout(function(){ getTop() }, 60000);
}



// get simple data from server
// + update main/base tokens with default ones (WBNB/BUSD)
function getSimple() {
  xmlhttp = new XMLHttpRequest()
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = JSON.parse(this.responseText)
      simple = data
      setToken(selectedToken)
      setBase(selectedBase)
      getCharts()
    }
  }
  xmlhttp.open("GET", "/simple", true)
  xmlhttp.send()

  setTimeout(function(){ getSimple() }, 60000);
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
      updateCharts()
      setSwapperBase()
    }
  }
  xmlhttp.open("GET", "/charts/" + selectedToken + "/" + selectedBase, true)
  xmlhttp.send()
}



// defines event on search field
document.getElementById('search_field').addEventListener("keyup", function(e) {
  let searchValue = e.target.value.toLowerCase()
  search = searchValue

  filteredList = []
  list.forEach(function (token) {
    if(token.toLowerCase().includes(search)) {
      filteredList.push(token)
    }
  })

  updateList()
})



// set list from the list
function updateList() {
  let currentList = search.length > 0 ? filteredList : list;

  document.getElementById('list').innerHTML = null;

  ul = document.createElement('ul')
  document.getElementById('list').appendChild(ul)
  currentList.forEach(function (token) {
    let li = document.createElement('li')
    ul.appendChild(li)

    li.innerHTML += token
    li.addEventListener("click", function(e) {
      selectedToken = e.target.innerHTML
      setToken(selectedToken)
      getCharts()
      setSwapperToken()
      setSwapperBase()
    })
  })
}

// set base list selection
function updateBaseList() {
  let currentList = list

  document.getElementById('base_select').innerHTML = null
  let select = document.getElementById('base_select')
  currentList.forEach(function (token) {
    let option = document.createElement('option')
    select.appendChild(option)
    option.innerHTML += token
    option.value = token
    option.selected = token === selectedBase
  })
}


// set top tokens
function setTop() {
  let top = document.getElementById('top')
  top.innerHTML = null
  for (var i = 0; i < 5; i++) {
    const symbol = Object.keys(topTokens)[i]
    let div = document.createElement('div')
    div.classList.add('top-token')
    div.id = symbol
    top.appendChild(div)
    let div_symbol = document.createElement('div')
    div_symbol.innerHTML = symbol
    div_symbol.classList.add('top-symbol')
    let div_price = document.createElement('div')
    div_price.innerHTML = '$ ' + precise(topTokens[symbol].price)
    div_price.classList.add('top-price')

    div.appendChild(div_symbol)
    div.appendChild(div_price)

    div.addEventListener("click", function(e) {
      selectedToken = e.target.id ? e.target.id : e.target.parentElement.id
      setToken(selectedToken)
      getCharts()
      setSwapperToken()
      setSwapperBase()
    })
  }
}


// set information of the main token
function setToken(symbol) {
  document.getElementById('token_symbol').innerHTML = symbol
  document.getElementById('token_name').innerHTML = simple[symbol]['name']
  let address = simple[symbol]['address'].slice(0, 5) + '...' + simple[symbol]['address'].slice(-5)
  let a = document.createElement('a')
  a.href = 'https://bscscan.com/address/' + simple[symbol]['address']
  a.target = '_blank'
  a.innerHTML = address
  document.getElementById('token_address').innerHTML = null
  document.getElementById('token_address').appendChild(a)
  //document.getElementById('token_address').innerHTML = address
  document.getElementById('token_price').innerHTML = '$ ' + precise(simple[symbol]['price'])
  //document.getElementById('token_price_BNB').innerHTML = 'BNB ' + precise(simple[symbol]['price_BNB'])
}

// set information of the base token
function setBase(symbol) {
  document.getElementById('base_symbol').innerHTML = symbol
  document.getElementById('base_name').innerHTML = simple[symbol]['name']
  let address = simple[symbol]['address'].slice(0, 5) + '...' + simple[symbol]['address'].slice(-5)
  let a = document.createElement('a')
  a.href = 'https://bscscan.com/address/' + simple[symbol]['address']
  a.target = '_blank'
  a.innerHTML = address
  document.getElementById('base_address').innerHTML = null
  document.getElementById('base_address').appendChild(a)
  //document.getElementById('base_address').innerHTML = address
  document.getElementById('base_price').innerHTML = '$ ' + precise(simple[symbol]['price'])
  //document.getElementById('base_price_BNB').innerHTML = 'BNB ' + precise(simple[symbol]['price_BNB'])
}

function setSwapperToken() {
  document.getElementById('swapper_token_symbol').innerHTML = selectedToken
  document.getElementById('swapper_token').value = 1
}
function setSwapperBase() {
  document.getElementById('swapper_base_symbol').innerHTML = selectedBase
  document.getElementById('swapper_base').value = precise(document.getElementById('swapper_token').value * simple[selectedToken]['price'] / simple[selectedBase]['price'])
}


// useful@
function precise(x) {
  return Number.parseFloat(x).toPrecision(5);
}




document.getElementById('swapper_token').addEventListener(
  "change", function(e) {
    document.getElementById('swapper_base').value =
      precise(document.getElementById('swapper_token').value
      * simple[selectedToken]['price']
      / simple[selectedBase]['price'])
})
document.getElementById('swapper_base').addEventListener(
  "change", function(e) {
    document.getElementById('swapper_token').value =
      precise(document.getElementById('swapper_base').value
      / simple[selectedToken]['price']
      * simple[selectedBase]['price'])
})


document.getElementById('base_change').addEventListener(
  "click", function(e) {
    document.getElementById('base_symbol').style.display = "none"
    document.getElementById('base_change').style.display = "none"
    document.getElementById('base_select').style.display = "flex"
})
document.getElementById('base_select').addEventListener(
  "change", function(e) {
    document.getElementById('base_symbol').style.display = "flex"
    document.getElementById('base_change').style.display = "initial"
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

})

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





/* MAIN */
getList()
getSimple()
setSwapperToken()
getTop()





function updateCharts() {
  let timeData = tokenCharts.chart_often.map(coords => new Date(coords.t))
  let tokenData = tokenCharts.chart_often.map(coords => {
    const baseCoords = baseCharts.chart_often.find(base => base.t === coords.t)
    return baseCoords ? coords.price / baseCoords.price : null
  })
  //let data =
  var ctx = document.getElementById('myChart').getContext('2d')
  if(myChart) {
    myChart.data.labels = timeData
    myChart.data.datasets[0].label = selectedToken + '/' + selectedBase
    myChart.data.datasets[0].data = tokenData
    myChart.options.scales.y.title.text = selectedBase
    myChart.update()
  } else {
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeData,
            datasets: [{
                label: selectedToken + '/' + selectedBase,
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
          aspectRatio: 0.75,
          radius: 0,
          interaction: {
            intersect: false,
          },
          scales: {
            x: {
              type: 'time',
              time: {
                //unit: 'day'
              },
            },
            y: {
              title: {
                display: true,
                text: selectedBase
              }
            }
          }
        }
    })
  }
}
