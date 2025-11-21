import React from 'react'
import { NavLink } from 'react-router-dom'

export default function NavBar(){
  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="logo">LostNFound</div>
      </div>
      <div className="nav-links">
        <NavLink to="/" end className={({isActive})=> isActive? 'active':''}>Home</NavLink>
        <NavLink to="/lost" className={({isActive})=> isActive? 'active':''}>Lost</NavLink>
        <NavLink to="/found" className={({isActive})=> isActive? 'active':''}>Found</NavLink>
        <NavLink to="/profile" className={({isActive})=> isActive? 'active':''}>Profile</NavLink>
      </div>
    </nav>
  )
}
