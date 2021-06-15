

class ClientSocket{
    clientid
    socketid
    socket
    specials = new GenericEvent()

    constructor(){
        this.socket = io({
            // reconnection:false,
            autoConnect: false,
        });


        this.socket.on('connect',() => {
            let clientid = parseInt(sessionStorage.getItem('clientid'))
            clientid = isNaN(clientid) ? null : clientid
            this.socket.emit('handshake', {clientid},({ clientid, socketid }) => {
                sessionStorage.setItem('clientid',clientid)
                this.clientid = clientid
                this.socketid = socketid
                this.specials.emit('connected')
                //emit connection made
            })
        })

        this.socket.on('disconnect',() => {
            console.log('disconnected');
        })
    }

    connect(){
        this.socket.open()
    }

    emit(type,data){
        this.socket.emit(type,data)
    }

    on(type,cb){
        this.socket.on(type,cb)
    }
}