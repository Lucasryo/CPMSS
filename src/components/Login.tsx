import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

type LoginProps = {
  embedded?: boolean;
};

export default function Login({ embedded = false }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Bem-vindo de volta!');
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={embedded ? 'w-full' : 'min-h-screen flex items-center justify-center bg-neutral-50 px-4'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full space-y-8 rounded-2xl border border-neutral-200 bg-white p-8 ${embedded ? 'shadow-xl shadow-amber-950/10' : 'shadow-sm'}`}
      >
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-auto items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Logo Royal PMS"
              className="h-full w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">
            {embedded ? 'Acesse o Royal PMS' : 'Portal de Documentos'}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {embedded ? 'Entrar na sua conta de operação' : 'Royal Macaé Palace Hotel'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-neutral-900"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-neutral-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <LogIn className="h-4 w-4" />
                Entrar
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
