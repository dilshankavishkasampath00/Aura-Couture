// Color name → CSS filter string (applied on top of the base garment image)
export const COLOR_FILTERS = {
  // Floral Dress
  'Ivory Blossom': 'none',
  'Powder Blue':   'hue-rotate(200deg) saturate(1.3) brightness(1.05)',
  'Blush Pink':    'hue-rotate(330deg) saturate(1.4) brightness(1.05)',
  // Linen Blazer
  'Sand':  'none',
  'Olive': 'hue-rotate(55deg) saturate(0.9) brightness(0.85)',
  'Navy':  'hue-rotate(220deg) saturate(3) brightness(0.45)',
  // Pleated Skirt
  'Cream': 'none',
  'Mauve': 'hue-rotate(310deg) saturate(0.9) brightness(0.9)',
  'Black': 'grayscale(1) brightness(0.12)',
}

const products = [
  {
    id: 'floral-dress',
    name: 'Floral Summer Dress',
    price: 4500,
    category: 'Women',
    description: 'Lightweight cotton dress with botanical print, flattering A-line fit, and soft flutter sleeves.',
    colors: ['Ivory Blossom', 'Powder Blue', 'Blush Pink'],
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1520975901070-3a2c1e16f3f4?auto=format&fit=crop&w=800&q=80',
    overlay: '/overlay-dress.png',
    dressImage: '/dresses/dress-base.png',
    has3D: true
  },
  {
    id: 'linen-blazer',
    name: 'Tailored Linen Blazer',
    price: 8900,
    category: 'Men',
    description: 'Structured linen blazer with refined tailoring and a lightweight summer-friendly weave.',
    colors: ['Sand', 'Olive', 'Navy'],
    sizes: ['M', 'L', 'XL'],
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    overlay: '/overlay-blazer.png',
    dressImage: '/dresses/blazer-base.png'
  },
  {
    id: 'pleated-skirt',
    name: 'Pleated Midi Skirt',
    price: 4500,
    category: 'New Arrivals',
    description: 'Soft pleated midi skirt with elegant movement and premium finish for dressy or everyday wear.',
    colors: ['Cream', 'Mauve', 'Black'],
    sizes: ['S', 'M', 'L'],
    image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=800&q=80',
    overlay: '/overlay-skirt.png',
    dressImage: '/dresses/skirt-base.png'
  }
]

export default products
