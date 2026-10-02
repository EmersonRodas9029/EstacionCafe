import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { resetDb } from '@/mocks/db'
import { server } from '@/mocks/server'

// findBy* espera hasta 5 s: las rutas lazy y MSW tardan más con todos los archivos en paralelo
configure({ asyncUtilTimeout: 5000 })

// jsdom no implementa <dialog> modal
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.open = false
  this.dispatchEvent(new Event('close'))
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetDb()
  localStorage.clear()
})
afterAll(() => server.close())
