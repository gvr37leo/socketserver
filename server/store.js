export class Entity{
    id
    name = ''
    parent
    type
    children = []
    store

    // onEvent = new EventQueue()

    constructor(init){
        Object.assign(this,init)
        this.type = 'entity'
    }

    ancestor(type){
        return this.store.ancestor(this,type)
    }

    _parent(){
        return this.store.parent(this)
    }

    _children(){
        return this.store.children(this)
    }

    descendants(){
        return this.store.descendants(this)
    }

    duplicate(amount){
        return this.store.duplicate(this,amount)
    }

    setParent(parent){
        this.store.move(this,parent)
    }

    flag(){
        this.store.flag(this.id)
    }

    childByName(name){
        return this._children().find(c => c.name == name)
    }

    removeChildren(){
        return this.descendants().map(c => this.store.remove(c.id))
    }

}

export class Entitystore{
    map = new Map()
    counter = 0
    upserts = new Set()
    deletions = new Set()
    versionnumber = 0

    get(id){
        return this.map.get(id)
    }

    add(item,parent){
        item.id = this.counter++
        return this.insert(item,parent)
    }

    insert(item,parent){
        item.store = this
        this.map.set(item.id, item)
        this.move(item, parent)//event trigger happens in move
        this.upserts.add(item.id)
        return item
    }

    inject(item){
        item.store = this
        this.map.set(item.id, item)
        this.upserts.add(item.id)
        return item
    }

    list(){
        return Array.from(this.map.values())
    }

    remove(id){
        let ent = this.map.get(id)
        let parent = this.map.get(ent.parent)
        remove(parent.children, ent.id)
        this.map.delete(id)
        this.deletions.add(id)
        // parent.onEvent.addAndTrigger('remove',id)
        return ent
    }

    move(ent, parent){
        let oldparent = this.get(ent.parent)
        if(oldparent != null){
            remove(oldparent.children,ent.id)
            // oldparent.onEvent.addAndTrigger('remove',ent)
            this.flag(oldparent.id)
        }
        if(parent != null){
            ent.parent = parent.id
            parent.children.push(ent.id)
            // parent.onEvent.addAndTrigger('add',ent)
            this.flag(parent.id)
        }
    }

    ancestor(ent,type){
        let current = ent
        while(current != null){
            if(current.type == type){
                return current
            }
            current = this.parent(ent)
        }
        return null
    }

    parent(ent){
        return this.map.get(ent.parent)
    }

    children(ent){
        return Array.from(ent.children.values()).map(id => this.map.get(id))
    }

    descendants(ent){
        return this.children(ent).flatMap(ent => this.descendants(ent))
    }

    duplicate(ent,amount){
        let res = []
        for(let i = 0; i < amount;i++){
            let copy = Object.assign({},ent)
            copy.__proto__ = (ent).__proto__
            let obj = this.add(copy,ent._parent())    
            res.push(obj)
        }
        return res
    }


    flag(id){
        this.upserts.add(id)
    }

    collectAll(){
        let upserts = JSON.parse(JSON.stringify(Array.from(this.map.entries()).map(e => {
            let entry = e[1]
            let copy = {}
            Object.assign(copy,entry)
            delete copy.store
            return copy
        })))

        return {
            upserts,
            deletions:[],
            version:this.versionnumber,
            type:'fullupdate',
        }
    }

    collectChanges(){
        for(let deletion of this.deletions){
            if(this.upserts.has(deletion)){
                this.deletions.delete(deletion)
                this.upserts.delete(deletion)
            }
        }

        let deletions = JSON.parse(JSON.stringify(Array.from(this.deletions.keys())))
        let upserts = JSON.parse(JSON.stringify(Array.from(this.upserts.entries()).map(e => {
            let entry = this.get(e[0])
            let copy = {}
            Object.assign(copy,entry)
            delete copy.store
            return copy
        })))
        this.upserts.clear()
        this.deletions.clear()
        if(upserts.length > 0 || deletions.length > 0){
            this.versionnumber++
        }


        //optimization potential: if delete id present in upserts cancel them both out
        return {
            upserts,
            deletions,
            version:this.versionnumber,
            type:'deltaupdate'
        }
    }

    applyChanges({deletions,upserts,type,versionnumber}){
        if(type == 'fullupdate'){
            var store = new Entitystore()
            for(var entity of upserts){
                entity.__proto__ = Entity.prototype
                store.inject(entity)
            }
            store.versionnumber = versionnumber
            return store
        }else{
            for(let upsert of upserts){
                let local = this.get(upsert.id)
                if(local == null){
                    //insert
                    this.inject(upsert)
                    upsert.__proto__ = Entity.prototype
                }else{
                    //update
                    Object.assign(local,upsert)
                    local.store = this
                }
            }
    
            for(let deletion of deletions){
                this.remove(deletion)
            }
        }
    }

    getActiveRole(){
        let game = this.getGame()
        return this.getRoles()[game.roleturnindex]
    }

    getCurrentPlayer(){
        let activerole = this.getActiveRole()
        let activeplayer = this.get(activerole.player)
        return activeplayer
    }

    //helper functions
    getGame(){
        return this.list().find(e => e.name == 'gameroot')
    }

    getPlayerFolder(){
        return this.getGame().childByName('playerfolder')
    }

    getPlayers(){
        return this.getGame().childByName('playerfolder')._children()
    }

    getDeckFolder(){
        return this.getGame().childByName('deck')
    }

    getDiscardFolder(){
        return this.getGame().childByName('discardpile')
    }

    getDiscardPile(){
        return this.getDiscardFolder()._children()
    }

    getRoles(){
        return this.getGame().childByName('rolesfolder')._children()
    }

    getClientPlayer(clientid){
        return this.getPlayers().find(p => p.clientid == clientid)
    }
}

function remove(arr, value){
    let index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
}