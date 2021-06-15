export class Store{

    map = new Map()
    counter = 0

    get(id){
        return this.map.get(id)
    }

    add(item){
        (item).id = this.counter++
        this.map.set((item).id,item)
    }

    insert(item){
        this.map.set((item).id,item)
    }

    list(){
        return Array.from(this.map.values())
    }

    remove(id){
        var val = this.map.get(id)
        this.map.delete(id)
        return val
    }
}