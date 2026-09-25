'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProductById, updateProduct } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiUpload, FiLink } from 'react-icons/fi';
import { DEMO_PRODUCTS } from '@/lib/demoData';
import type { Product } from '@/types';

const CATEGORIES = ['asooke', 'adire', 'beads-and-accessories', 'accessories'];
const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

interface ColorPreset {
  name: string;
  hex: string;
}

function getShadePresets(hue: number): ColorPreset[] {
  if (hue >= 0 && hue < 30) {
    return [
      { name: 'Terracotta Red', hex: '#c2410c' },
      { name: 'Crimson Red', hex: '#be123c' },
      { name: 'Burgundy', hex: '#881337' },
      { name: 'Coral Pink', hex: '#f43f5e' },
    ];
  } else if (hue >= 30 && hue < 65) {
    return [
      { name: 'Warm Gold', hex: '#d97706' },
      { name: 'Orange Tie-dye', hex: '#f97316' },
      { name: 'Yellow Gold', hex: '#eab308' },
      { name: 'Amber Glow', hex: '#f59e0b' },
    ];
  } else if (hue >= 65 && hue < 150) {
    return [
      { name: 'Forest Green', hex: '#15803d' },
      { name: 'Emerald', hex: '#059669' },
      { name: 'Olive Green', hex: '#854d0e' },
      { name: 'Mint Green', hex: '#a7f3d0' },
    ];
  } else if (hue >= 150 && hue < 200) {
    return [
      { name: 'Teal Blue', hex: '#0f766e' },
      { name: 'Turquoise', hex: '#0d9488' },
      { name: 'Seafoam Cyan', hex: '#06b6d4' },
      { name: 'Deep Teal', hex: '#115e59' },
    ];
  } else if (hue >= 200 && hue < 260) {
    return [
      { name: 'Midnight Blue', hex: '#1e3a8a' },
      { name: 'Indigo Blue', hex: '#1e1b4b' },
      { name: 'Royal Blue', hex: '#1d4ed8' },
      { name: 'Sky Blue', hex: '#38bdf8' },
    ];
  } else if (hue >= 260 && hue < 320) {
    return [
      { name: 'Royal Violet', hex: '#7e22ce' },
      { name: 'Orchid Purple', hex: '#d946ef' },
      { name: 'Deep Purple', hex: '#581c87' },
      { name: 'Lavender', hex: '#c084fc' },
    ];
  } else {
    return [
      { name: 'Dusky Pink', hex: '#db2777' },
      { name: 'Rose Pink', hex: '#fda4af' },
      { name: 'Hot Magenta', hex: '#e11d48' },
      { name: 'Blush Pink', hex: '#fbcfe8' },
    ];
  }
}

export default function EditProductPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'adire',
    sizes: [] as string[],
    stock: '',
    featured: false,
  });

  // Image Upload lists
  const [generalImages, setGeneralImages] = useState<string[]>([]);
  const [imageInputVal, setImageInputVal] = useState('');

  // Color selection state
  const [colorsList, setColorsList] = useState<string[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#1e1b4b');
  const [colorHueRange, setColorHueRange] = useState(220); // Default Indigo/Blue

  // Color-specific images map: maps color name to list of image strings
  const [colorImagesMap, setColorImagesMap] = useState<Record<string, string[]>>({});
  const [activeMappingColor, setActiveMappingColor] = useState<string | null>(null);
  const [colorImageInputVal, setColorImageInputVal] = useState('');

  useEffect(() => {
    async function loadProduct() {
      try {
        let p = await getProductById(id);
        if (!p && id.startsWith('demo-')) {
          p = DEMO_PRODUCTS.find((x) => x.id === id) || null;
        }
        if (p) {
          setForm({
            name: p.name,
            description: p.description,
            price: p.price.toString(),
            category: p.category,
            sizes: p.sizes,
            stock: p.stock.toString(),
            featured: p.featured,
          });
          setColorsList(p.colors);
          
          // Separate color-specific vs general images
          const initialColorImages = p.colorImages || {};
          setColorImagesMap(initialColorImages);
          
          // General images are the ones not mapped specifically
          const mappedList = new Set<string>();
          Object.values(initialColorImages).forEach((list) => {
            list.forEach((img) => mappedList.add(img));
          });
          const generalList = p.images.filter((img) => !mappedList.has(img));
          setGeneralImages(generalList);
        } else {
          toast.error('Product not found');
          router.push('/admin');
        }
      } catch {
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    if (profile?.role === 'admin') {
      loadProduct();
    }
  }, [id, profile, router]);

  if (profile && profile.role !== 'admin') return null;

  // General Image Handlers
  const handleAddGeneralImageUrl = () => {
    const val = imageInputVal.trim();
    if (!val) return;
    if (generalImages.includes(val)) {
      toast.error('Image already added');
      return;
    }
    setGeneralImages([...generalImages, val]);
    setImageInputVal('');
  };

  const handleGeneralImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mockPath = `/images/${file.name}`;
    if (generalImages.includes(mockPath)) {
      toast.error('Image already uploaded');
      return;
    }
    setGeneralImages([...generalImages, mockPath]);
    toast.success(`Mock uploaded: ${file.name}`);
  };

  // Color-Specific Image Handlers
  const handleAddColorImageVal = (colorName: string) => {
    const val = colorImageInputVal.trim();
    if (!val) return;
    const currentList = colorImagesMap[colorName] || [];
    if (currentList.includes(val)) {
      toast.error('Image already added for this color');
      return;
    }
    setColorImagesMap({
      ...colorImagesMap,
      [colorName]: [...currentList, val],
    });
    setColorImageInputVal('');
  };

  const handleColorImageUpload = (e: React.ChangeEvent<HTMLInputElement>, colorName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mockPath = `/images/${file.name}`;
    const currentList = colorImagesMap[colorName] || [];
    if (currentList.includes(mockPath)) {
      toast.error('Image already uploaded for this color');
      return;
    }
    setColorImagesMap({
      ...colorImagesMap,
      [colorName]: [...currentList, mockPath],
    });
    toast.success(`Mock uploaded: ${file.name}`);
  };

  const removeColorImage = (colorName: string, img: string) => {
    const currentList = colorImagesMap[colorName] || [];
    setColorImagesMap({
      ...colorImagesMap,
      [colorName]: currentList.filter((x) => x !== img),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.sizes.length === 0) {
      toast.error('Select at least one size');
      return;
    }
    if (colorsList.length === 0) {
      toast.error('Add at least one color option');
      return;
    }

    // Compile all images: general images + any color specific images
    const allImages = [...generalImages];
    Object.values(colorImagesMap).forEach((list) => {
      list.forEach((img) => {
        if (!allImages.includes(img)) allImages.push(img);
      });
    });

    if (allImages.length === 0) {
      toast.error('Provide at least one image (general or color-specific)');
      return;
    }

    setSaving(true);
    try {
      await updateProduct(id, {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category as Product['category'],
        sizes: form.sizes,
        colors: colorsList,
        images: allImages,
        colorImages: colorImagesMap, // Color specific mapping save
        stock: Number(form.stock),
        featured: form.featured,
      });
      toast.success('Product updated successfully!');
      router.push('/admin');
    } catch {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const toggleSize = (s: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
    }));
  };

  const presets = getShadePresets(colorHueRange);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#d97706] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#1e1b4b]/50 text-sm font-semibold">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-[#1e1b4b]/40 hover:text-[#1e1b4b]">
          <FiArrowLeft size={20} />
        </Link>
        <h1 className="font-serif text-2xl text-[#1e1b4b] font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-md space-y-6 text-[#1e1b4b]">
        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">Product Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Indigo Adire Co-ord Set"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-[#1e1b4b]/10 rounded-xl text-sm focus:outline-none focus:border-[#d97706]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-[#1e1b4b]/10 rounded-xl text-sm focus:outline-none focus:border-[#d97706] bg-white capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'beads-and-accessories' ? 'Beads & Accessories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">Price (₦)</label>
            <input
              type="number"
              required
              placeholder="45000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-3 border-2 border-[#1e1b4b]/10 rounded-xl text-sm focus:outline-none focus:border-[#d97706]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">Stock Quantity</label>
            <input
              type="number"
              required
              placeholder="20"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full px-4 py-3 border-2 border-[#1e1b4b]/10 rounded-xl text-sm focus:outline-none focus:border-[#d97706]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">Description</label>
          <textarea
            required
            rows={3}
            placeholder="Describe the fabric, craftsmanship, and styling details..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 border-2 border-[#1e1b4b]/10 rounded-xl text-sm focus:outline-none focus:border-[#d97706] resize-none"
          />
        </div>

        {/* General Images Upload Section */}
        <div className="border-t border-[#1e1b4b]/5 pt-4">
          <label className="block text-sm font-semibold text-[#1e1b4b] mb-2">General Product Images</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Paste Image URL link"
              value={imageInputVal}
              onChange={(e) => setImageInputVal(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-[#1e1b4b]/10 rounded-xl text-sm focus:outline-none focus:border-[#d97706]"
            />
            <button
              type="button"
              onClick={handleAddGeneralImageUrl}
              className="px-4 py-2 border-2 border-[#1e1b4b]/10 text-[#1e1b4b] hover:border-[#d97706] rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
            >
              <FiLink size={14} /> Add Link
            </button>
            <label className="px-4 py-2 bg-gray-100 border border-gray-200 text-[#1e1b4b] hover:bg-gray-200 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <FiUpload size={14} /> Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleGeneralImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {generalImages.length > 0 && (
            <div className="flex flex-wrap gap-2.5 p-3 bg-gray-50 border rounded-xl">
              {generalImages.map((img, i) => (
                <div key={i} className="relative w-16 h-18 bg-white rounded-lg overflow-hidden border border-[#1e1b4b]/10 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setGeneralImages(generalImages.filter((x) => x !== img))}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Color Selector with Hue Slider & Shade Boxes */}
        <div className="border-t border-[#1e1b4b]/5 pt-4">
          <label className="block text-sm font-semibold text-[#1e1b4b] mb-2">
            Configure Color Options <span className="text-[#1e1b4b]/40 font-normal">(use preset range shades or hex picker)</span>
          </label>
          
          {/* Hue Range Slider */}
          <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-2xl border">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
              <span>Color Family Range (Hue)</span>
              <span className="text-[#d97706]">{colorHueRange}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={colorHueRange}
              onChange={(e) => setColorHueRange(Number(e.target.value))}
              className="w-full accent-[#d97706] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
            />

            {/* Shade Presets Grid */}
            <div className="pt-2">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1.5">Preset Shades in Range</p>
              <div className="flex flex-wrap gap-3">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewColorName(p.name);
                      setNewColorHex(p.hex);
                      toast.success(`Selected shade: ${p.name}`);
                    }}
                    title={p.name}
                    className="w-9 h-9 rounded-full border border-black/10 transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shadow-sm relative"
                    style={{ background: p.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="e.g. Terracotta Red"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className="flex-1 px-4 py-2.5 border-2 border-[#1e1b4b]/10 rounded-xl text-sm focus:outline-none focus:border-[#d97706]"
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-12 h-11 border-2 border-[#1e1b4b]/10 rounded-xl cursor-pointer p-1 bg-white"
              title="Custom hex color picker"
            />
            <button
              type="button"
              onClick={() => {
                const name = newColorName.trim();
                if (!name) {
                  toast.error('Enter color name');
                  return;
                }
                const formattedColor = `${name}|${newColorHex}`;
                if (colorsList.some((x) => x.split('|')[0] === name)) {
                  toast.error('Color already added');
                  return;
                }
                setColorsList([...colorsList, formattedColor]);
                // Initialize mapping array if not present
                if (!colorImagesMap[name]) {
                  setColorImagesMap((prev) => ({ ...prev, [name]: [] }));
                }
                setNewColorName('');
              }}
              className="px-4 py-2 bg-[#d97706] hover:bg-[#f59e0b] text-[#1e1b4b] font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Add Color
            </button>
          </div>

          {/* Color list and Mapped image uploads */}
          {colorsList.length > 0 && (
            <div className="space-y-3.5 p-3.5 bg-gray-50 border rounded-2xl">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Configured Colors & Image Swatches</p>
              
              {colorsList.map((c, i) => {
                const [name, hex] = c.split('|');
                const isSelectedForMapping = activeMappingColor === name;
                const mappedImages = colorImagesMap[name] || [];

                return (
                  <div key={i} className="bg-white p-3.5 rounded-xl border border-gray-100 flex flex-col gap-3 shadow-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full border border-black/10 flex-shrink-0"
                          style={{ background: hex }}
                        />
                        <span className="text-sm font-bold">{name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setColorsList(colorsList.filter((x) => x !== c));
                          const newMap = { ...colorImagesMap };
                          delete newMap[name];
                          setColorImagesMap(newMap);
                          if (activeMappingColor === name) setActiveMappingColor(null);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <FiTrash2 size={13} /> Remove
                      </button>
                    </div>

                    {/* Color-specific uploads */}
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">
                          Mapped Images ({mappedImages.length})
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveMappingColor(isSelectedForMapping ? null : name)}
                          className="text-xs text-[#d97706] font-bold hover:underline cursor-pointer"
                        >
                          {isSelectedForMapping ? 'Close Mappings' : 'Manage Mappings'}
                        </button>
                      </div>

                      {/* Map uploads inputs */}
                      {isSelectedForMapping && (
                        <div className="flex gap-2 items-center bg-[#fefce8]/40 p-3 rounded-xl border border-[#d97706]/10 mb-2">
                          <input
                            type="text"
                            placeholder="Paste Image URL"
                            value={colorImageInputVal}
                            onChange={(e) => setColorImageInputVal(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#d97706] bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddColorImageVal(name)}
                            className="px-3 py-1.5 bg-[#1e1b4b] hover:bg-[#312e81] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                          <label className="px-3 py-1.5 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-[#1e1b4b] font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer">
                            <FiUpload size={12} /> Upload
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleColorImageUpload(e, name)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {/* Thumbnails */}
                      {mappedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {mappedImages.map((img, idx) => (
                            <div key={idx} className="relative w-12 h-14 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeColorImage(name, img)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sizes */}
        <div className="border-t border-[#1e1b4b]/5 pt-4">
          <label className="block text-sm font-semibold text-[#1e1b4b] mb-2">
            Sizes Available <span className="text-[#1e1b4b]/40 font-normal">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition-colors cursor-pointer ${
                  form.sizes.includes(s)
                    ? 'bg-[#d97706] border-[#d97706] text-[#1e1b4b] font-semibold'
                    : 'border-[#1e1b4b]/20 text-[#1e1b4b] hover:border-[#d97706]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        <div className="border-t border-[#1e1b4b]/5 pt-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="accent-[#d97706] w-4 h-4"
            />
            <span className="text-sm font-medium text-[#1e1b4b]">
              Feature this product on homepage
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[#1e1b4b]/5">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#1e1b4b] hover:bg-[#312e81] text-[#fefce8] font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Update Product'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3.5 border-2 border-[#1e1b4b]/20 text-[#1e1b4b] font-semibold rounded-xl hover:border-[#d97706] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
