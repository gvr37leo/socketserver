import {Store} from '../client/store.js'
import {GenericEvent} from '../client/eventsystem.js'

//socketserver should take care of socket clients
//and keeping track of connecting and diconnecting clients and doing handshakes
//and emitting events for connecting and disconnecting clients
//incoming messages should have their socket and clientid added

//events on sockets should broadcast to clients add their id and repeat up to server
//server/clients should broadcast down

export class SocketServer{

    clients = new Store()
    sockets = new Store()
    specials = new GenericEvent()

    listenup = new GenericEvent()
    broadcastdown = new GenericEvent()

    constructor(){
        setInterval(() => {
            let longdcedclients = this.clients.list().filter(c => c.disconnected == true && Date.now() - c.dctimestamp > 5000)
            for(let client of longdcedclients){
                this.clients.remove(client.id)
                this.specials.emit('clientremoved',{client})
            }
        }, 6000);

        this.broadcastdown.onany((data,type) => {
            this.clients.list().forEach(c => c.emit(type,data))
        })
    }

    connect(socket){
        socket.on('handshake',(data,cb) => {
            
            this.sockets.insert(socket)
            //search for corresponding client
            let clientid = data.clientid
            if(clientid == null){
                clientid = this.clients.counter
            }
            let serverclient = this.clients.get(clientid)
            

            //create new 1 if not found
            let connectioneventtype = ''
            if(serverclient == null){
                connectioneventtype = 'clientconnected'
                serverclient = new ServerClient()
                this.clients.add(serverclient)
                serverclient.broadcastdown.onany((data,type) => {
                    this.sockets.list().filter(s => s.clientid == serverclient.id).forEach(s => s.emit(type,data))
                })

                serverclient.listenup.onany((data,type) => {
                    data.clientid = serverclient.id
                    this.listenup.emit(type,data)
                })
            }else{
                connectioneventtype = 'clientreconnected'
            }

            socket.prependAny((event,data) => {
                data.socketid = socket.id
                serverclient.listenup.emit(event,data)
            })

            socket.clientid = serverclient.id
            serverclient.disconnected = false
            cb({clientid:serverclient.id,socketid:socket.id})
            this.specials.emit(connectioneventtype,{client:serverclient})

        })




        socket.on('disconnect',() => {
            this.sockets.remove(socket.id)
            let client = this.clients.list().find(c => c.id == socket.clientid)
            let siblingSockets = this.sockets.list().filter(s => s.clientid == client.id)
            if(siblingSockets.length == 0){
                client.disconnected = true
                client.dctimestamp = Date.now()
                this.specials.emit('clientdisconnected', {client, clientid:client.id, socketid:socket.id})
            }
        })
    }

    emit(type,data){
        this.broadcastdown.emit(type,data)
    }

    on(type,cb){
        this.listenup.on(type,cb)
    }
}

export class ServerClient{

    server
    specials = new GenericEvent()
    id//sessionid
    listenup = new GenericEvent()
    broadcastdown = new GenericEvent()

    //public
    isSynced//set by user
    versionnumber//set by user
    disconnected = false
    dctimestamp = 0

    constructor(server){
        this.server = server
    }

    emit(type,data){
        this.broadcastdown.emit(type,data)
    }

    on(type,cb){
        this.listenup.on(type,cb)
    }
}

