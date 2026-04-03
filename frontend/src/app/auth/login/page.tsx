'use client';

import { Suspense, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner'; // <-- Importação do Toaster

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  
  // CORREÇÃO: O fallback agora é '/' (Home) em vez de '/dashboard'
  const safeRedirect =
    rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('E-mail ou senha incorretos.'); // Mensagem mais amigável
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      setLoading(false);
      return;
    }

    toast.success('Bem-vindo(a) de volta! 🚀'); // Notificação de sucesso bonitona
    router.push(safeRedirect);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 sm:mt-16 px-4 sm:px-0">
      <div className="bg-white p-6 sm:p-8 border border-gray-100 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Entrar no 44Go
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100 animate-in fade-in zoom-in duration-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none transition-shadow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fa7109] focus:outline-none transition-shadow"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#fa7109] to-[#ab0029] text-white p-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link href="/auth/register" className="text-[#fa7109] font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto mt-16 text-center text-gray-500 flex flex-col items-center gap-2">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fa7109]"></span>
          Carregando…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}