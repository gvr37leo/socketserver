export class Store{

    map = new Map()
    counter = 0

    //add some kind of version number or hash verify
    upserts = new Set()
    deletions = new Set()
    versionnumber = 0

    get(id){
        return this.map.get(id)
    }

    add(item){
        (item).id = this.counter++
        return this.insert(item)
    }

    insert(item){
        this.map.set((item).id,item)
        this.upserts.add(item.id)
        return item
    }

    flag(id){
        //would be nicer if flagging was somehow done automatically
        //call this function in the setparent function of entitys
        this.upserts.add(id)
    }

    list(){
        return Array.from(this.map.values())
    }

    remove(id){
        let val = this.map.get(id)
        this.map.delete(id)
        this.deletions.add(id)
        return val
    }

    collectChanges(){
        for(let deletion of this.deletions){
            if(this.upserts.has(deletion)){
                this.deletions.delete(deletion)
                this.upserts.delete(deletion)
            }
        }
        let deletions = Array.from(this.deletions.keys())
        let upserts = Array.from(this.upserts.entries()).map(e => this.get(e[0]))
        this.upserts.clear()
        this.deletions.clear()
        if(upserts.length > 0 || deletions.length > 0){
            this.versionnumber++
        }


        //optimization potential: if delete id present in upserts cancel them both out
        return {
            upserts,
            deletions,
            version:this.versionnumber
        }
    }

    applyChanges(deletions,upserts){
        for(let upsert of upserts){
            let local = this.get(upsert.id)
            if(local == null){
                this.insert(upsert)
                upsert.__proto__ = Entity.prototype
            }else{
                Object.assign(local,upsert)
            }
        }

        for(let deletion of deletions){
            this.remove(deletion)
        }
    }
}