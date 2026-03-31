import { mount } from 'svelte'

import './assets/app.css'

import App from './App.svelte'
import { init } from '@svelte-router/core'

init({
  defaultHash: true
})

const app = mount(App, {
  target: document.getElementById('app')!
})

export default app
