import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import VirtualTryOn from './pages/VirtualTryOn.jsx'
import PhotoTryOn from './pages/PhotoTryOn.jsx'
import CartPage from './pages/CartPage.jsx'
import Checkout from './pages/Checkout.jsx'
import SavedLooks from './pages/SavedLooks.jsx'
import NotFound from './pages/NotFound.jsx'
import products from './data/products.js'

function App() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <Header />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Home products={products} />} />
        <Route path="/shop" element={<Shop products={products} />} />
        <Route path="/product/:id" element={<ProductDetails products={products} />} />
        <Route path="/try-on/:id" element={<VirtualTryOn products={products} />} />
        <Route path="/photo-try-on/:id" element={<PhotoTryOn />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/saved-looks" element={<SavedLooks />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
