import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Importe o seu favicon de dentro de assets (ajuste o nome do arquivo se for diferente, ex: favicon.png ou logo.png)
import meuFavicon from './assets/favicon.png'

// Define dinamicamente o favicon na aba do navegador
const linkRelIcon = document.querySelector("link[rel*='icon']") || document.createElement('link');
linkRelIcon.type = 'image/png';
linkRelIcon.rel = 'icon';
linkRelIcon.href = meuFavicon;
document.getElementsByTagName('head')[0].appendChild(linkRelIcon);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)