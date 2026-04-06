'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CartNavLink } from '@/components/CartNavLink';
import { supabase } from '@/lib/supabase';
import { User, ShoppingBag, Store, LogOut, ChevronDown } from 'lucide-react';

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
      const fetchProductsForSearch = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.from('products').select('*');
          if (error) throw error;
          setAllProducts(data || []);
        } catch (err) {
          console.error("Erro ao carregar busca:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProductsForSearch();
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
  
  // Controle do Menu do Avatar
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // O Estado para guardar a foto de perfil real do banco de dados
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca a foto de perfil na tabela `users` do Supabase
  useEffect(() => {
    if (user) {
      const fetchAvatar = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
            
          if (!error && data?.avatar_url) {
            setUserAvatar(data.avatar_url);
          } else {
            // Se não tiver no banco, tenta pegar do Google (se tiver logado com o Google)
            setUserAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
          }
        } catch (err) {
          console.error("Erro ao buscar avatar:", err);
        }
      };
      fetchAvatar();
    } else {
      setUserAvatar(null);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsProfileMenuOpen(false);
    setUserAvatar(null);
    router.refresh();
    router.push('/');
  };

  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50 bg-white">
        <div className="flex justify-between items-center h-16">
          
          {/* LADO ESQUERDO: Logo Animada e Blindada */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-black group flex pt-2 pb-2"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(false);
                setIsProfileMenuOpen(false);
              }}
            >
              {"44Go".split('').map((char, index) => (
                <span
                  key={index}
                  className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-1.5 bg-gradient-to-r from-[#fa7109] to-[#ab0029] bg-clip-text text-transparent"
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  {char}
                </span>
              ))}
            </Link>
          </div>

          {/* LADO DIREITO: Ícones e Menus */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                setIsMobileMenuOpen(false);
                setIsProfileMenuOpen(false);
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

            {/* ÁREA DO USUÁRIO (Apenas PC) */}
            <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-gray-200 ml-2">
              {loading ? (
                <span className="text-sm text-gray-400 animate-pulse">Carregando...</span>
              ) : user ? (
                
                /* INÍCIO DO DROPDOWN DO AVATAR */
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all focus:outline-none"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white flex items-center justify-center font-bold shadow-sm overflow-hidden border border-orange-100/50 shrink-0">
                      {userAvatar ? (
                        <img src={userAvatar} alt={displayName || 'Usuário'} className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-[#fa7109]' : ''}`} />
                  </button>

                  {/* MENU FLUTUANTE (DROPDOWN) */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      
                      <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                      </div>

                      <div className="p-2 flex flex-col gap-1">
                        <Link 
                          href="/profile" 
                          className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl transition-colors flex items-center gap-3"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="w-4 h-4" /> Meu Perfil
                        </Link>
                        
                        <Link 
                          href="/orders" 
                          className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl transition-colors flex items-center gap-3"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <ShoppingBag className="w-4 h-4" /> Minhas Compras
                        </Link>
                        
                        <Link 
                          href="/dashboard" 
                          className="px-3 py-2.5 text-sm font-medium text-[#fa7109] hover:bg-orange-50 rounded-xl transition-colors flex items-center gap-3 bg-orange-50/50 mt-1 border border-orange-100/50"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Store className="w-4 h-4" /> Painel do Lojista
                        </Link>
                      </div>

                      <div className="p-2 border-t border-gray-100 bg-gray-50/30">
                        <button 
                          onClick={handleSignOut} 
                          className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors flex items-center gap-3"
                        >
                          <LogOut className="w-4 h-4" /> Sair da conta
                        </button>
                      </div>

                    </div>
                  )}
                </div>
                /* FIM DO DROPDOWN DO AVATAR */

              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-900 hover:text-[#fa7109] transition-colors font-medium text-sm">
                    Entrar
                  </Link>
                  <Link href="/auth/register" className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity font-bold shadow-sm text-sm">
                    Criar Conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <SearchDropdown isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </Suspense>

      {/* MENU DROP-DOWN MOBILE */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 absolute w-full shadow-2xl z-40 animate-in slide-in-from-top-2">
          <div className="pt-2 pb-6 space-y-1 flex flex-col">
            <div className="px-4 space-y-2 flex flex-col">
              {!loading && user ? (
                <>
                  <div className="px-3 py-4 mb-2 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white flex items-center justify-center font-bold shadow-sm overflow-hidden border border-orange-100/50 shrink-0">
                      {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : initial}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <Link href="/profile" className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                    <User className="w-5 h-5" /> Meu Perfil
                  </Link>
                  <Link href="/orders" className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:bg-orange-50 hover:text-[#fa7109] rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                    <ShoppingBag className="w-5 h-5" /> Minhas Compras
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 text-base font-medium text-[#fa7109] bg-orange-50/50 hover:bg-orange-50 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                    <Store className="w-5 h-5" /> Painel do Lojista
                  </Link>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 text-left px-3 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl mt-2 border-t border-gray-100">
                    <LogOut className="w-5 h-5" /> Sair da conta
                  </button>
                </>
              ) : (
                <div className="pt-4 flex flex-col gap-3">
                  <Link href="/auth/login" className="block text-center px-4 py-3 text-base font-bold text-gray-900 bg-gray-50 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                    Entrar na Conta
                  </Link>
                  <Link href="/auth/register" className="block text-center px-4 py-3 text-base font-bold bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white rounded-xl shadow-md" onClick={() => setIsMobileMenuOpen(false)}>
                    Criar Nova Conta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}