const Promise = require('bluebird')
const path = require('path')
const fs = Promise.promisifyAll(require('fs'))
const child = Promise.promisifyAll(require('child_process'))
const request = require('supertest')
const rimrafAsync = Promise.promisify(require('rimraf'))
const mkdirpAsync = Promise.promisify(require('mkdirp'))
const xattr = Promise.promisifyAll(require('fs-xattr'))
const UUID = require('uuid')
const chai = require('chai').use(require('chai-as-promised'))
const sinon = require('sinon')
const expect = chai.expect
const should = chai.should()

const debug = require('debug')('divider')

const app = require('src/app')
const { saveObjectAsync } = require('src/fruitmix/lib/utils')
const broadcast = require('src/common/broadcast')

const User = require('src/fruitmix/models/user')
const Drive = require('src/fruitmix/models/drive')
const Forest = require('src/fruitmix/forest/forest')

const {
  IDS,
  FILES,
  stubUserUUID,
  createUserAsync,
  retrieveTokenAsync,
  createPublicDriveAsync,
  setUserUnionIdAsync
} = require('./lib')

const cwd = process.cwd()
const tmptest = path.join(cwd, 'tmptest')
const tmpDir = path.join(tmptest, 'tmp')
const forestDir = path.join(tmptest, 'drives')

const resetAsync = async () => {

  broadcast.emit('FruitmixStop')

  await broadcast.until('UserDeinitDone', 'DriveDeinitDone')

  await rimrafAsync(tmptest)
  await mkdirpAsync(tmpDir)

  broadcast.emit('FruitmixStart', tmptest) 

  await broadcast.until('UserInitDone', 'DriveInitDone')
}

describe(path.basename(__filename), () => {

  describe("Alice w/ empty home", () => {

    let sidekick

    before(async () => {
      sidekick = child.fork('src/fruitmix/sidekick/worker')      
      await Promise.delay(100)
    })

    after(async () => {
      sidekick.kill()
      await Promise.delay(100) 
    })
    
    let token, stat

    beforeEach(async () => {

      debug('------ I am a beautiful divider ------')

      Promise.delay(150)
      await resetAsync()
      await createUserAsync('alice')
      token = await retrieveTokenAsync('alice')
      stat = await fs.lstatAsync(path.join(forestDir, IDS.alice.home))
    })
/**
    it('GET alice home (empty)', done => {

      request(app)
        .get(`/drives/${IDS.alice.home}/dirs/${IDS.alice.home}/entries`)
        .set('Authorization', 'JWT ' + token)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)
          expect(res.body).to.deep.equal([])
          done()
        })
    })

    it('POST directory hello and world', done => {
      
      request(app)
        .post(`/drives/${IDS.alice.home}/dirs/${IDS.alice.home}/entries`)
        .set('Authorization', 'JWT ' + token)
        .field('dir', 'hello')
        .field('dir', 'world')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)

          request(app)
            .get(`/drives/${IDS.alice.home}/dirs/${IDS.alice.home}/entries`)
            .set('Authorization', 'JWT ' + token)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err)

              let arr = res.body
                .map(x => ({ type: x.type, name: x.name }))
                .sort((a, b) => a.name.localeCompare(b.name))

              expect(arr).to.deep.equal([
                { type: 'directory', name: 'hello' },
                { type: 'directory', name: 'world' }
              ])

              done()
            })
         })
    })
**/

    it('POST alonzo', function(done) {

      // this.timeout(0)

      let desc1 = {
        name: 'alonzo',
        size: 0,
        sha256: FILES.alonzo.hash,
      }

      request(app)
        .post(`/drives/${IDS.alice.home}/dirs/${IDS.alice.home}/entries`)
        .set('Authorization', 'JWT ' + token)
/**
        .field('data', JSON.stringify({ op: 'mkdir', name: 'hello' }))
        .field('data', JSON.stringify({ op: 'rename', name: 'hello', newName: 'world' }))
        .attach('file', 'testdata/empty', JSON.stringify(desc1))
        .attach('file', 'testdata/empty', JSON.stringify(desc1))
        .attach('file', 'testdata/empty', JSON.stringify(desc1))
        .attach('file', 'testdata/empty', JSON.stringify(desc1))
        .attach('file', 'testdata/empty', JSON.stringify(desc1))
        .attach('file', 'testdata/empty', JSON.stringify(desc1))
**/
        .attach('empty', 'testdata/empty', JSON.stringify(desc1))
        .attach('alonzo', 'testdata/alonzo_church.jpg', JSON.stringify(desc1))
        .expect(200)
        .end((err, res) => {

          setTimeout(() => {
            console.log(err || res.body)
            done()
          }, 500)
        })
    })

    it('POST mkdir hello', function(done) {
      
      request(app)
        .post(`/drives/${IDS.alice.home}/dirs/${IDS.alice.home}/entries`)
        .set('Authorization', 'JWT ' + token)
        .field('hello', '')
        .expect(200)
        .end((err, res) => {
          setTimeout(() => {
            console.log(err || res.body)
            done()
          }, 500)
        })
    })
  })

/** 
  describe("Alice w/ hello world foo bar", () => {

    let sidekick

    before(async () => {
      sidekick = child.fork('src/fruitmix/sidekick/worker')      
      await Promise.delay(100)
    })

    after(async () => {
      sidekick.kill()
      await Promise.delay(100) 
    })
    
    let token, stat, hello, world, foo, bar

    beforeEach(async () => {

      debug('------ I am a beautiful divider ------')

      await Promise.delay(100)
      await resetAsync()
      await createUserAsync('alice')
      token = await retrieveTokenAsync('alice')
      stat = await fs.lstatAsync(path.join(forestDir, IDS.alice.home))

      hello = await new Promise((resolve, reject) =>
        request(app)
          .post(`/drives/${IDS.alice.home}/dirs`)
          .set('Authorization', 'JWT ' + token)
          .send({ parent: IDS.alice.home, name: 'hello' })
          .expect(200)
          .end((err, res) => err ? reject(err) : resolve(res.body))) 

      await Promise.delay(50)

      foo = await new Promise((resolve, reject) => 
        request(app) 
          .post(`/drives/${IDS.alice.home}/dirs`)
          .set('Authorization', 'JWT ' + token)
          .send({ parent: hello.uuid, name: 'foo' })
          .expect(200)
          .end((err, res) => err ? reject(err) : resolve(res.body)))

      world = await new Promise((resolve, reject) =>
        request(app) 
          .post(`/drives/${IDS.alice.home}/dirs/${IDS.alice.home}/files`)
          .set('Authorization', 'JWT ' + token)
          .field('size', FILES.world.size)
          .field('sha256', FILES.world.hash)
          .attach('file', FILES.world.path)
          .expect(200)
          .end((err, res) => err ? reject(err) : resolve(res.body)))

      bar = await new Promise((resolve, reject) =>
        request(app)
          .post(`/drives/${IDS.alice.home}/dirs/${hello.uuid}/files`)
          .set('Authorization', 'JWT ' + token)
          .field('size', FILES.bar.size)
          .field('sha256', FILES.bar.hash) 
          .attach('file', FILES.bar.path)
          .expect(200)
          .end((err, res) => err ? reject(err) : resolve(res.body)))

    })

    it('should do nothing', done => {

      request(app)
        .get(`/drives/${IDS.alice.home}/dirs/${IDS.alice.home}`)
        .set('Authorization', 'JWT ' + token)
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.deep.equal({
            path: [],
            entries: []
          })
          done()
        })
    })

  })
**/
})

