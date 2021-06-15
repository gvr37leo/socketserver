var socket = new ClientSocket()
var store = new Entitystore()

socket.specials.on('connected',() => {
    socket.emit('blob',{asd:'asd'})
})

socket.on('deltaupdate',(update) => {
    store.applyChanges(update)
})

socket.on('fullupdate',(update) => {
    store.applyChanges(update)
})

socket.socket.onAny((event,data) => {
    console.log(event,data)
})

socket.connect()

ReactDOM.render(test(),document.querySelector('#root'))
