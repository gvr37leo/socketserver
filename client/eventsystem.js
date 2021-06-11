export class GenericEvent{

    idcounter = 0
    listeners = []

    on(type,cb){
        let id = this.idcounter++
        this.listeners.push({id,cb,type})
        return id
    }

    emit(type,data){
        this.listeners.filter(l => l.type == type || l.type == 'any').forEach(l => l.cb(data,type))
    }

    onany(cb){
        this.on('any',cb)
    }
}