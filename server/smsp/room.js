'use strict'

module.exports = class Room {

  constructor(name) {
    this._name    = name
    this._members = new Set()
  }

  getMembers() {
    return Array.from(this._members)
  }

  numberOfMembers() {
    return this._members.size
  }

  hasMember(memberName) {
    return this._members.has(memberName)
  }

  addMember(memberName) {
    this._members.add(memberName)
  }

  removeMember(memberName) {
    this._members.delete(memberName)
  }

  forEachMember(callback) {
    this._members.forEach(callback)
  }

  get name() {
    return this._name
  }

}
