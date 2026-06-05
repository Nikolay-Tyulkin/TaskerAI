import '@testing-library/jest-dom/vitest'

const originalGetComputedStyle = window.getComputedStyle.bind(window)

window.getComputedStyle = (element: Element) => originalGetComputedStyle(element)

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
