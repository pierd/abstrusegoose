import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout.tsx'
import Home from './pages/Home.tsx'
import About from './pages/About.tsx'
import AboutThisMirror from './pages/AboutThisMirror.tsx'
import Faq from './pages/Faq.tsx'
import Archive from './pages/Archive.tsx'
import FeedTheGoose from './pages/FeedTheGoose.tsx'
import ComicStrip from './pages/ComicStrip.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="about-this-mirror" element={<AboutThisMirror />} />
          <Route path="faq" element={<Faq />} />
          <Route path="archive" element={<Archive />} />
          <Route path="feedthegoose" element={<FeedTheGoose />} />
          <Route path="*" element={<ComicStrip />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
