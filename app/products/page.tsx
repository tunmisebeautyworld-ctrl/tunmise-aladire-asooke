import { Suspense } from 'react';
import ProductsContent from './ProductsContent';

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 animate-pulse">
          <div className="h-10 bg-brand-indigo/10 rounded w-48 mb-2" />
          <div className="h-4 bg-brand-indigo/5 rounded w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-brand-indigo/10" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-brand-indigo/10 rounded" />
                <div className="h-3 bg-brand-indigo/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
