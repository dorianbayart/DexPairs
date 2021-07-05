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
