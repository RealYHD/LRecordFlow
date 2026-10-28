// Vitest setup file — polyfills for jsdom test environment
import { vi } from 'vitest'

// Mock Svelte runtime APIs used by repo.svelte.ts helpers
// $state rune is compiled to state() in .svelte.ts files; in tests we provide a shim
const mockState = <T>(initial: T): T & { toJSON: () => T } => {
  const value = initial as T & { toJSON: () => T }
  value.toJSON = () => initial
  return value
}

mockState.snapshot = <T>(value: T): T => {
  if (value !== null && typeof value === 'object' && 'toJSON' in value) {
    return (value as { toJSON: () => T }).toJSON()
  }
  return value
}

globalThis.$state = mockState
globalThis.$state.snapshot = mockState.snapshot

// Mock Svelte reactive collections from svelte/reactivity
class SvelteSet<T> extends Set<T> {}
class SvelteMap<K, V> extends Map<K, V> {}
globalThis.SvelteSet = SvelteSet
globalThis.SvelteMap = SvelteMap

// Mock svelte/reactivity module to avoid loading the Svelte client runtime
vi.mock('svelte/reactivity', () => ({
  SvelteSet,
  SvelteMap,
  __esModule: true
}))

// Mock window for Electron-related code paths
if (typeof window === 'undefined') {
  globalThis.window = {} as unknown as Window & typeof globalThis
}

// Suppress expected console warnings/errors in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
