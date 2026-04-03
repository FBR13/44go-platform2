interface Product {
  id: string | number;
  title: string;
  base_price: number;
  oldPrice?: number;
  image_url?: string; // Nome correto no Supabase
  image?: string;     // Fallback para compatibilidade
  badge?: string;
}

export function ProductCard({ product }: { product: Product }) {
  const displayImage = product.image_url || product.image || '';
  
  return (
    <div className="group flex flex-col bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative h-full">
      
      {product.badge && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md">
          {product.badge}
        </div>
      )}
      
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        <img
          src={displayImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 line-clamp-2 mb-1.5 sm:mb-2 group-hover:text-[#fa7109] transition-colors leading-snug">
          {/* Garante que se o título for nulo, apareça algo */}
          {product.title || 'Produto sem título'}
        </h3>
        
        <div className="mt-auto flex flex-col-reverse sm:flex-row sm:items-end gap-0.5 sm:gap-2">
          <span className="text-base sm:text-lg font-bold text-gray-900 leading-none">
            R$ {(product.base_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          {product.oldPrice && (
            <span className="text-[10px] sm:text-sm text-gray-400 line-through mb-0 sm:mb-0.5">
              R$ {product.oldPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}