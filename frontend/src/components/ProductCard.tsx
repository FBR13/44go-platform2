interface Product {
  id: string | number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  badge?: string;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative">
      {product.badge && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
          {product.badge}
        </div>
      )}
      
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        {/* Mantive a tag <img> padrão para evitar erros de domínio não configurado no next/image */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-gray-700 line-clamp-2 mb-2 group-hover:text-[#fa7109] transition-colors">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end gap-2">
          <span className="text-lg font-bold text-gray-900">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          {product.oldPrice && (
            <span className="text-sm text-gray-400 line-through mb-0.5">
              R$ {product.oldPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}