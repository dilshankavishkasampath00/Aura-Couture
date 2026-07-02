import { useCart } from '../context/CartContext.jsx'

export default function SavedLooks() {
  const { savedLooks } = useCart()

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-[32px] bg-white p-6 shadow-sm shadow-slate-200/50">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Saved Looks</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your captured try-on photos</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Save and revisit the looks you liked from the virtual fitting room.</p>
        </div>
        {savedLooks.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">No saved looks yet. Capture a photo in the try-on room to preview it here.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {savedLooks.map((look, index) => (
              <div key={index} className="overflow-hidden rounded-[32px] bg-white shadow-sm shadow-slate-200/50">
                <img src={look.image} alt={look.label || 'Saved look'} className="h-72 w-full object-cover" />
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900">{look.name}</p>
                  <p className="mt-2 text-sm text-slate-500">{look.selectedColor} • {look.selectedSize}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
