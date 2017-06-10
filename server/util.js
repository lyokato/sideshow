'use strict'

const inspect = require('util').inspect

module.exports = class Util {

  static dump(obj) {
    console.log(inspect(obj))
  }

  static typeIs(obj, type) {
   const clas = Object.prototype.toString.call(obj).slice(8, -1)
   return obj !== undefined && obj !== null && clas === type
  }

  static randomString(len) {
    let result = ""
    const c = "abcdefghijklmnopqrstuvwxyz0123456789";
    const cl = c.length;
    for(let i = 0; i < len; i++) {
     result += c[Math.floor(Math.random() * cl)]
    }
    return result
  }
}

