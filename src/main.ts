import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import './kit/kit.css';
import './styles/tokens.css';
import './styles/app.css';
import { mountApp } from './app/shell';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Presentation root #app was not found.');
const dispose = mountApp(root);
if (import.meta.hot) import.meta.hot.dispose(dispose);
