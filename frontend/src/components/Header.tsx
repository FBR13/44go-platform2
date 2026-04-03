'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CartNavLink } from '@/components/CartNavLink';

export function Header() {
  const { user, loading, displayName, signOut } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false); // Fecha o menu ao sair
    router.refresh();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LADO ESQUERDO: Logo e Links Principais */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-2xl font-black bg-gradient-to-r from-[#fa7109] to-[#ab0029] bg-clip-text text-transparent"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              44Go
            </Link>
          </div>

          {/* LADO DIREITO: Carrinho e Menu Hambúrguer (Mobile) ou Botões (PC) */}
          <div className="flex items-center gap-4">
            
            {/* O carrinho fica sempre visível */}
            <CartNavLink />

            {/* BOTÃO HAMBÚRGUER (Apenas Mobile) */}
            <button
              type="button"
              className="sm:hidden p-2 text-gray-600 hover:text-[#fa7109]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* BOTÕES NORMAIS (Apenas PC - hidden no celular) */}
            <div className="hidden sm:flex items-center gap-4">
              {loading ? (
                <span className="text-sm text-gray-400">…</span>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity font-medium shadow-sm text-sm"
                  >
                    Painel Lojista
                  </Link>
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-gray-900 hover:text-[#fa7109] transition-colors truncate max-w-[150px]"
                    title="Acessar meu Perfil"
                  >
                    {displayName}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="text-sm text-gray-900 hover:text-[#fa7109] transition-colors font-medium"
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

      {/* MENU DROP-DOWN MOBILE (Só aparece se clicar no hambúrguer) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-3 flex flex-col">
            {!loading && user ? (
              <>
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
      )}
    </nav>
  );
}