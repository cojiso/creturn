/// <reference types="svelte" />
/// <reference types="wxt/client-types" />

declare module '*.svelte' {
  import type { SvelteComponent } from 'svelte'
  export default class extends SvelteComponent {}
}