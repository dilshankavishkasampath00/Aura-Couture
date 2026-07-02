import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'

export default function Header() {
  const { itemCount, toggleDrawer } = useCart()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900">Aura Couture</Link>
        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'} transition`}>
            Home
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'} transition`}>
            Shop
          </NavLink>
          <NavLink to="/saved-looks" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'} transition`}>
            Saved Looks
          </NavLink>
        </div>
        <button onClick={toggleDrawer} className="relative inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
          <ShoppingBag size={16} />
          <span className="text-sm font-semibold">Cart</span>
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white px-1.5">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

