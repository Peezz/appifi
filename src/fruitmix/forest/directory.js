const path = require('path')
const Node = require('./node')
const Readdir = require('./readdir')

/**
Directory represents a directory in the underlying file system.

In this version, `children` contains only sub directories and files with interested type (magic is string)


*/
class Directory extends Node {
 
  /**
  @param {Forest} ctx
  @param {Directory} parent - parent `Directory` object
  @param {xstat} xstat
  @param {Monitor} [monitor]
  */ 
  constructor(ctx, parent, xstat, monitors) {

    if (xstat.type !== 'directory') throw new Error('xstat is not a directory')
    
    super(ctx, parent, xstat)

    this.children = []

    /** uuid **/
    this.uuid = xstat.uuid

    /** name **/
    this.name = xstat.name 

    /** mtime **/
    this.mtime = -xstat.mtime

    // index
    this.ctx.indexDirectory(this)

    /**
    readdir worker
    */
    this.readdir = Readdir(this, monitors)
  }

  /**
  Destructor
  */
  destroy() {
    [...this.children].forEach(child => child.destroy()) 
    this.readdir.abort()
    this.readdir = null
    this.ctx.unindexDirectory(this) 
    super.destroy()
  }

  /**
  Update children according to xstats returned from `read`.

  This is a internal function and is only called in `readdir`.
  @param {xstat[]} xstats
  @param {Monitor[]} monitors
  */
  merge(xstats, monitors) { 

    // remove non-interested files
    xstats = xstats.filter(x => x.type === 'directory' 
      || (x.type === 'file' && typeof x.magic === 'stirng'))

    // convert to a map
    let map = new Map(xstats.map(x => [x.uuid, x]))

    // update found child, remove found out of map, then destroy lost
    Array.from(this.children)
      .reduce((lost, child) => {

        let xstat = map.find(child.uuid)
        if (xstat) {
          child.update(xstat) 
          map.delete(child.uuid)
        }
        else
          lost.push(child)

        return lost
      }, [])
      .forEach(child => child.destroy())

    // new 
    map.forEach(val => new Directory(this.ctx, this, val, monitors))
  }

  /**
  Update xstat props, this is an internal function

  Only `name` may be updated. `mtime` is updated by `readdir`. Either name or mtime change will trigger a `read`.
  @param {xstat} xstat - new `xstat`
  @param {Monitor[]} [monitors]
  */ 
  update(xstat, monitors) {
    
    // guard
    if (xstat.uuid !== this.uuid) throw new Error('uuid mismatch')    

    // if nothing changed, return
    if (this.name === xstat.name && this.mtime === xstat.mtime) return

    // either name or timestamp changed, a read is required.
    this.name = xstat.name
    this.read()
  }

  /**
  Request a `readdir` operation

  + if `handler` is not provided, request a immediate `readdir` operation
  + if `handler` is a number, request a deferred `readdir` operation
  + if `handler` is a (node) callback, request a immediate `readdir` operation
  + if `handler` is a Monitor, request a immediate `readdir` operation
  @param {(function|Monitor)} [handler] - handler may be a callback function or a Monitor
  */
  read(handler) {
    this.readdir.read(handler)
  }

  /**
  Read xstats of the directory

  @returns {xstats[]}
  */
  async readdirAsync() {
    return await new Promise((resolve, reject) => 
      this.read((err, xstats) => err ? reject(err) : resolve(xstats)))
  }
}

module.exports = Directory



