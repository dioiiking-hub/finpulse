import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

// GitHub Pages 部署在 /finpulse 子路径下（其余托管在根路径）：按当前 URL 推断 basename，
// 保证两处路由都正常（配合 deploy-pages workflow 的 404.html 回退处理直链刷新）。
const basename = window.location.pathname.startsWith('/finpulse') ? '/finpulse' : '/'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>,
)
