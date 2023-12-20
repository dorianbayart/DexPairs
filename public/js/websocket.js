'use strict'


let socket
const connect = async () =>  {
  return new Promise((resolve, reject) => {
    const WEBSOCKET_BASEURL = window.location.href.includes(DOMAIN_NAME.toLowerCase()) ? 'api.dexpairs.xyz' : 'localhost:3001'

    const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
    const socketUrl = `${socketProtocol}//${WEBSOCKET_BASEURL}/ws/`

    socket = new WebSocket(socketUrl)

    socket.onopen = () => {
      socketMessageSend({ type: 'connection', url: window.location.href })
      resolve()
    }

    socket.onmessage = (event) => {
      socketMessageReceived(event.data)
    }

    socket.onerror = (e) => {
      console.log(e)
      resolve()
      setTimeout(() => connect(), 2500)
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await connect()

  /*
  if(isOpen(socket)) {
    socket.send(JSON.stringify({
      type: 'connection',
      data: 'connected'
    }))
  }
  */
})

// Utils - isOpen
const isOpen = (ws) => {
  return ws.readyState === ws.OPEN
}

// Send data through websocket
const socketMessageSend = (data) => {
  socket.send(JSON.stringify(data))
}

// Some data has been received
const socketMessageReceived = (data) => {
  const msg = JSON.parse(data)
  switch (msg.type) {
    case 'connection':
      break;
    case 'statistics':
      displayStatistics(msg.data)
      break;
    default:
  }
}

const wsSendStatistics = () => {
	setTimeout(() => {
		socketMessageSend({ type: 'statistics', url: window.location.href })
	}, 2500)
}
