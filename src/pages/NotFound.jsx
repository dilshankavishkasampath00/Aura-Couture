import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-center sm:px-6">
      <div className="mx-auto max-w-xl rounded-[32px] bg-white p-10 shadow-sm shadow-slate-200/50">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Page missing</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">Nothing to see here</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">The page you requested does not exist. Try returning to the shop or home page.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111]">Home</Link>
          <Link to="/shop" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Shop</Link>
        </div>
      </div>
    </main>
  )
}
