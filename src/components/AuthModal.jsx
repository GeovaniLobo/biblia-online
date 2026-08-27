import React, { useState } from 'react';
import { BancoDeDados } from '../services/database';

export default function AuthModal({ isOpen, onClose, onLoginSucesso, darkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const perfis = await BancoDeDados.getPerfisCadastrados();

      if (isLogin) {
        // Fluxo de Login
        const usuarioEncontrado = perfis.find(p => p.username === username.trim().toLowerCase());
        
        if (!usuarioEncontrado) {
          setErro('Usuário não encontrado. Crie uma conta!');
          setCarregando(false);
          return;
        }

        if (usuarioEncontrado.senha !== senha) {
          setErro('Senha incorreta.');
          setCarregando(false);
          return;
        }

        BancoDeDados.fazerLogin(usuarioEncontrado);
        onLoginSucesso(usuarioEncontrado);
      } else {
        // Fluxo de Cadastro
        const usernameLimpo = username.trim().toLowerCase();
        if (!usernameLimpo || !nome.trim() || !senha.trim()) {
          setErro('Preencha todos os campos.');
          setCarregando(false);
          return;
        }

        const jaExiste = perfis.some(p => p.username === usernameLimpo);
        if (jaExiste) {
          setErro('Este @usuário já está em uso. Escolha outro.');
          setCarregando(false);
          return;
        }

        const novoPerfil = {
          username: usernameLimpo,
          nome: nome.trim(),
          senha: senha.trim(),
          foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          biografia: 'Praticando a fé e o amor ao próximo.'
        };

        await BancoDeDados.cadastrarPerfil(novoPerfil);
        BancoDeDados.fazerLogin(novoPerfil);
        onLoginSucesso(novoPerfil);
      }
    } catch (err) {
      console.error(err);
      setErro('Ocorreu um erro ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1 rounded-full transition"
        >
          ✕
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight">Bíblia Online 📖</h2>
          <p className="text-xs text-slate-400 mt-1">Comunidade Global de Fé e Conexões</p>
        </div>

        {/* Abas Alternar Login / Cadastro com Cores Corrigidas */}
        <div className={`grid grid-cols-2 p-1 rounded-2xl mb-6 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErro(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition ${isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Fazer Login
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErro(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition ${!isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Criar Conta
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            {erro}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Seu Nome Completo</label>
              <input
                type="text"
                placeholder="Ex: Ana Souza"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required={!isLogin}
                className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Seu @ (Usuário)</label>
            <input
              type="text"
              placeholder="Ex: geovanilobo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Senha</label>
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg text-xs tracking-wide disabled:opacity-50 mt-2"
          >
            {carregando ? 'Aguarde...' : isLogin ? 'Entrar na Comunidade 🚀' : 'Cadastrar e Entrar ✨'}
          </button>
        </form>

      </div>
    </div>
  );
}