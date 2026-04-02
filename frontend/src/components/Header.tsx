'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CartNavLink } from '@/components/CartNavLink';

export function Header() {
  const { user, loading, displayName, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          <div className="flex items-center gap-6 sm:gap-8 min-w-0">
            <Link
              href="/"
              className="text-2xl font-black bg-gradient-to-r from-[#fa7109] to-[#ab0029] bg-clip-text text-transparent shrink-0"
            >
              44Go
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-4 min-w-0">
            <CartNavLink />
            
            {loading ? (
              <span className="text-sm text-gray-400" aria-live="polite">
                …
              </span>
            ) : user ? (
              <>
                {/* 1. Botão do Lojista agora aparece para quem ESTÁ logado */}
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:opacity-90 transition-opacity font-medium shadow-sm text-sm sm:text-base whitespace-nowrap"
                >
                  Painel Lojista
                </Link>
                
                {/* 2. Nome do Usuário logado */}
                <span
                  className="text-sm sm:text-base font-medium text-gray-900 truncate max-w-[140px] sm:max-w-[220px]"
                  title={displayName}
                >
                  {displayName}
                </span>
                
                {/* 3. Botão de Sair */}
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="text-sm sm:text-base text-gray-900 hover:text-[#fa7109] transition-colors font-medium px-2 py-1.5 rounded-md hover:bg-gray-50"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                {/* O que aparece para quem NÃO está logado */}
                <Link
                  href="/auth/login"
                  className="text-gray-900 hover:text-[#fa7109] transition-colors font-medium text-sm sm:text-base"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white px-4 sm:px-5 py-2 rounded-md hover:opacity-90 transition-opacity font-medium shadow-sm text-sm sm:text-base whitespace-nowrap"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}