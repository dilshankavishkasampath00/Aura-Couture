import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function Header() {
  const { itemCount, toggleDrawer } = useCart()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900">Aura Couture</Link>
        <div className="hidden items-center gap-3 md:flex">
          <NavLink to="/" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
            Home
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
            Shop
          </NavLink>
          <NavLink to="/saved-looks" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
            Saved Looks
          </NavLink>
        </div>
        <button onClick={toggleDrawer} className="relative inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-slate-700 transition hover:bg-slate-200">
          <span className="material-symbols-outlined">shopping_bag</span>
          <span className="ml-2 text-sm font-semibold">Cart</span>
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white px-1.5">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
