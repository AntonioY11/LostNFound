import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LostItems from './pages/LostItems'
import FoundItems from './pages/FoundItems'
import Profile from './pages/Profile'
import NavBar from './components/NavBar'

export default function App(){
  return (
    <div className="app-container">
      <NavBar />
      <div style={{marginTop:18}}>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/lost" element={<LostItems/>} />
          <Route path="/found" element={<FoundItems/>} />
          <Route path="/profile" element={<Profile/>} />
        </Routes>
      </div>
      <div className="footer">LostNFound</div>
    </div>
  )
}
