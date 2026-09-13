import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Importe seu cliente Supabase
import { BancoDeDados } from '../services/database';

export default function AuthModal({ isOpen, onClose, onLoginSucesso, darkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  
  const avatarPadrao = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';
  const [foto, setFoto] = useState(avatarPadrao);
  
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = (evento) => {
      const img = new Image();
      img.src = evento.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFoto(dataUrl);
      };
    };
    leitor.readAsDataURL(arquivo);
  };

  const handleLoginGoogle = async () => {
    setErro('');
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setErro(`Erro ao entrar com Google: ${err.message}`);
      setCarregando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');
    setCarregando(true);

    try {
      if (isLogin) {
        // --- LOGIN COM SUPABASE AUTH ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

        if (error) throw error;

        // Busca o perfil público complementar na tabela perfis
        const perfis = await BancoDeDados.getPerfisCadastrados();
        const usuarioEncontrado = perfis.find(p => p.email === email.trim() || p.username === username.trim().toLowerCase());
        
        const perfilLogado = usuarioEncontrado || data.user.user_metadata;
        BancoDeDados.fazerLogin(perfilLogado);
        onLoginSucesso(perfilLogado);

      } else {
        // --- CADASTRO COM SUPABASE AUTH ---
        const usernameLimpo = username.trim().toLowerCase();
        if (!email.trim() || !usernameLimpo || !nome.trim() || !senha.trim()) {
          setErro('Preencha todos os campos obrigatórios.');
          setCarregando(false);
          return;
        }

        const perfis = await BancoDeDados.getPerfisCadastrados();
        const jaExiste = perfis.some(p => p.username === usernameLimpo);
        if (jaExiste) {
          setErro('Este @usuário já está em uso. Escolha outro.');
          setCarregando(false);
          return;
        }

        // Cadastra no Supabase Auth (gera hash de senha, token e e-mail de confirmação se ativo)
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            data: {
              username: usernameLimpo,
              nome: nome.trim(),
              telefone: telefone.trim(),
              data_nascimento: dataNascimento || '',
              foto: foto || avatarPadrao
            }
          }
        });

        if (error) throw error;

        // Cria o registro público na tabela 'perfis'
        const novoPerfil = {
          email: email.trim(),
          username: usernameLimpo,
          nome: nome.trim(),
          telefone: telefone.trim(),
          data_nascimento: dataNascimento || '',
          foto: foto || avatarPadrao,
          biografia: 'Praticando a fé e o amor ao próximo.',
          amigos: [],
          pedidos_enviados: [],
          pedidos_recebidos: []
        };

        await BancoDeDados.cadastrarPerfil(novoPerfil);
        
        setMensagemSucesso('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
        setTimeout(() => {
          setIsLogin(true);
          setMensagemSucesso('');
        }, 4000);
      }
    } catch (err) {
      console.error("Erro detalhado na autenticação:", err);
      setErro(`Erro técnico: ${err.message || JSON.stringify(err)}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
      <div className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border my-auto ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1 rounded-full transition"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight flex items-center justify-center gap-2">
            Bíblia Online
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Comunidade Global de Fé e Conexões</p>
        </div>

        {/* Botão de Login com Google */}
        <button
          type="button"
          onClick={handleLoginGoogle}
          disabled={carregando}
          className={`w-full mb-4 py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            darkMode 
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' 
              : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-800'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continuar com o Google
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-700/40"></div>
          <span className="flex-shrink mx-4 text-[10px] uppercase tracking-wider opacity-50 font-bold">ou</span>
          <div className="flex-grow border-t border-slate-700/40"></div>
        </div>

        <div className={`grid grid-cols-2 p-1 rounded-2xl mb-6 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErro(''); setMensagemSucesso(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Fazer Login
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErro(''); setMensagemSucesso(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${!isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Criar Conta
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium break-words">
            {erro}
          </div>
        )}

        {mensagemSucesso && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium break-words">
            {mensagemSucesso}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {!isLogin && (
            <>
              <div className="flex flex-col items-center gap-2 pb-2">
                <img 
                  src={foto} 
                  alt="Preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md" 
                />
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-md flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Escolher Foto do Dispositivo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Seu Nome Completo</label>
                <input
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required={!isLogin}
                  className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Data de Nascimento</label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">E-mail</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Seu @ (Usuário)</label>
              <input
                type="text"
                placeholder="Digite seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-70">Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className={`w-full text-xs rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg text-xs tracking-wide disabled:opacity-50 mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {carregando ? 'Aguarde...' : isLogin ? 'Entrar na Comunidade' : 'Cadastrar e Entrar'}
            {!carregando && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}