declare module 'react-dev-inspector';
declare module 'react-dev-inspector/plugins/vite' {
  import { Plugin } from 'vite';
  export function reactDevInspectorPlugin(): Plugin;
}
