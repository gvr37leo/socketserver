import express from 'express'

import {Server} from 'http'
import {Server as IOServer} from 'socket.io'
import {SocketServer} from './socketserver.js'

const app = express();
const http = new Server(app);
const io = new IOServer(http);
var port = process.env.PORT || 8000

app.use(express.static('./client'))

var socketserver = new SocketServer()

socketserver.listenup.onany((data,type) => {
    console.log(type,data)
})

socketserver.specials.onany((data,type) => {
    // console.log(type,data)
})

socketserver.specials.on('clientconnected',({client}) => {
    console.log('client connected', client.id)

    socketserver.broadcastdown.emit('test',{asd:'asd'})
})

socketserver.specials.on('clientdisconnected',({client}) => {
    console.log('client disconnected', client.id)
})

socketserver.specials.on('clientremoved',({client}) => {
    console.log('client removed', client.id)
})




io.on('connection', (socket) => {
    socketserver.connect(socket)
})

http.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
})