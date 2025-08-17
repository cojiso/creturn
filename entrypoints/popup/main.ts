import './style.css';
import App from './App.svelte';

const target = document.getElementById('app') as Element;

const app = new App({
  target,
});

export default app;