import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// JSDOM has no top layer; focus containment is covered in browser tests.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}
