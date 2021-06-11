import {ClientSocket} from './clientsocket.js'

var socket = new ClientSocket()

socket.specials.on('connected',() => {
    socket.emit('blob',{asd:'asd'})
})

socket.socket.onAny((event,data) => {
    console.log(event,data)
})

socket.connect()
