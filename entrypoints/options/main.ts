import '../../assets/tailwind.css';
import App from './App.svelte';

const target = document.getElementById('app');

const app = new App({
  target: target as Element,
});

export default app;
