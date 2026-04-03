'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CartNavLink } from '@/components/CartNavLink';
import { apiUrl } from '@/lib/api';

// Subcomponente: O Input de Pesquisa com Resultados ao Vivo
function SearchDropdown({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    
    if (isOpen && allProducts.length === 0) {
      setIsLoading(true);
      fetch(apiUrl('/products'))
        .then(res => res.json())
        .then(data => setAllProducts(data))
        .catch(err => console.error("Erro ao carregar busca:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, allProducts.length]);

  const liveResults = searchInput.trim() === '' 
    ? [] 
    : allProducts.filter((p: any) => {
        const title = (p.title || p.name || '').toLowerCase();
        return title.includes(searchInput.toLowerCase().trim());
      }).slice(0, 5);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/?q=${encodeURIComponent(searchInput)}`);
    } else {
      router.push('/');
    }
    onClose();
  };

  const handleSelectProduct = (productName: string) => {
    setSearchInput(productName);
    router.push(`/?q=${encodeURIComponent(productName)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-xl pb-6 pt-4 z-40 animate-in slide-in-from-top-2">
      <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex gap-2 px-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">🔍</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="O que você procura hoje? (Ex: Vestido, Anel...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#fa7109] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-base bg-white"
          />
        </div>
        
        <button 
          type="submit"
          className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-6 rounded-xl font-medium hover:bg-gradient-to-r hover:from-[#a84c06] hover:to-[#6b0019] transition-colors"
        >
          Buscar
        </button>
      </form>

      {searchInput.trim() !== '' && (
        <div className="max-w-3xl mx-auto mt-2 px-4">
          <div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden flex flex-col">
            
            {isLoading ? (
              <div className="p-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#fa7109]"></span>
                Buscando produtos...
              </div>
            ) : liveResults.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {liveResults.map((product) => (
                  <li key={product.id}>
                    <button 
                      type="button"
                      onClick={() => handleSelectProduct(product.title || product.name)}
                      className="w-full text-left p-3 hover:bg-orange-50 flex items-center gap-4 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {product.image_url || product.image ? (
                          <img src={product.image_url || product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem foto</div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#fa7109] transition-colors">
                          {product.title || product.name}
                        </p>
                        <p className="text-sm text-gray-500 font-medium">
                          R$ {Number(product.base_price || product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      <div className="text-gray-300 group-hover:text-[#fa7109] pr-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </button>
                  </li>
                ))}
                
                <li>
                  <button 
                    type="button"
                    onClick={handleSearchSubmit} 
                    className="w-full p-3 text-center text-sm font-medium text-[#fa7109] bg-gray-50 hover:bg-orange-50 transition-colors"
                  >
                    Ver todos os resultados para "{searchInput}"
                  </button>
                </li>
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-gray-500">
                <span className="text-2xl block mb-2">🤔</span>
                Nenhum produto encontrado com "{searchInput}"
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, loading, displayName, signOut } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    router.refresh();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50 bg-white">
        <div className="flex justify-between items-center h-16">
          
          {/* LADO ESQUERDO: Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-black bg-gradient-to-r from-[#fa7109] to-[#ab0029] bg-clip-text text-transparent"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(false);
              }}
            >
              44Go
            </Link>
          </div>

          {/* LADO DIREITO: Ícones e Menus */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* ÍCONE DE PESQUISA (Lupa) */}
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsMobileMenuOpen(false);
              }}
              className={`p-2 rounded-full transition-colors ${isSearchOpen ? 'bg-orange-50 text-[#fa7109]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#fa7109]'}`}
              aria-label="Pesquisar"
            >
              {isSearchOpen ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>

            {/* CARRINHO */}
            <CartNavLink />

            {/* BOTÃO HAMBÚRGUER (Apenas Mobile) */}
            <button
              type="button"
              className="sm:hidden p-2 text-gray-600 hover:text-[#fa7109] hover:bg-gray-50 rounded-full"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsSearchOpen(false);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* BOTÕES NORMAIS (Apenas PC) */}
            <div className="hidden sm:flex items-center gap-4 pl-2 border-l border-gray-200 ml-2">
              {loading ? (
                <span className="text-sm text-gray-400">…</span>
              ) : user ? (
                <>
                  {/* NOVO LINK: Minhas Compras */}
                  <Link
                    href="/orders"
                    className="text-sm font-medium text-gray-900 hover:text-[#fa7109] transition-colors"
                  >
                    🛍️ Minhas Compras
                  </Link>

                  <Link
                    href="/dashboard"
                    className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity font-medium shadow-sm text-sm ml-2"
                  >
                    Painel Lojista
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-gray-900 hover:text-[#fa7109] transition-colors truncate max-w-[120px]"
                    title="Acessar meu Perfil"
                  >
                    {displayName}
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-900 hover:text-[#fa7109] transition-colors font-medium text-sm">
                    Entrar
                  </Link>
                  <Link href="/auth/register" className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-5 py-2 rounded-md hover:opacity-90 transition-opacity font-medium shadow-sm text-sm">
                    Criar Conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CAIXA DE PESQUISA EXPANSÍVEL */}
      <Suspense fallback={null}>
        <SearchDropdown isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </Suspense>

      {/* MENU DROP-DOWN MOBILE */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg z-40">
          <div className="pt-2 pb-4 space-y-1 flex flex-col">
            <div className="px-4 space-y-3 flex flex-col">
              {!loading && user ? (
                <>
                  {/* NOVO LINK MOBILE: Minhas Compras */}
                  <Link 
                    href="/orders" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🛍️ Minhas Compras
                  </Link>

                  <Link 
                    href="/profile" 
                    className="block px-3 py-2 text-base font-medium text-[#fa7109] hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    👤 Meu Perfil ({displayName})
                  </Link>

                  <Link 
                    href="/dashboard" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🏪 Painel do Lojista
                  </Link>
                  
                  <button 
                    onClick={() => void handleSignOut()}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Sair da conta
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="block px-3 py-2 text-base font-medium text-[#fa7109] hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Criar Conta Nova
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}