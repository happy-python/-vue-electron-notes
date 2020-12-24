import Vue from 'vue'
import Datastore from 'nedb-promises'

const { remote } = window.require('electron')
const basePath = remote.app.getPath('userData')
console.log('数据存储路径:', basePath)

const db = {
  markdown: Datastore.create({
    autoload: true,
    timestampData: true,
    filename: basePath
  })
}

Vue.prototype.$db = db
