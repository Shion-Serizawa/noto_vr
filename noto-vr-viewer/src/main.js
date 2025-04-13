import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

import 'aframe';

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
