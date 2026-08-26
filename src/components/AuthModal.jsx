import React, { useState } from 'react';
import { BancoDeDados } from '../services/database';

export default function AuthModal({ isOpen, onClose, onLoginSucesso, darkMode }) {
  const [modo, setModo] = useState('login'); // 'login' ou 'cadastro'
  
  // Estados Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  // Estados Cadastro
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [biografia, setBiografia] = useState('');
  const [foto, setFoto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [erroCadastro, setErroCadastro] = useState('');

  // Se não estiver aberto, não renderiza nada na tela
  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setErroLogin('');
    const perfil = BancoDeDados.validarLogin(loginUsername, loginSenha);
    if (perfil) {
      BancoDeDados.salvarPerfil(perfil);
      onLoginSucesso(perfil);
      if (onClose) onClose();
    } else {
      setErroLogin('Usuário (@) ou senha incorretos.');
    }
  };

  const handleCadastrar = (e) => {
    e.preventDefault();
    setErroCadastro('');
    const userLimpo = username.trim().replace('@', '').toLowerCase();
    
    if (!userLimpo || !senha || !nome.trim()) {
      setErroCadastro('Preencha os campos obrigatórios.');
      return;
    }

    const perfisExistentes = BancoDeDados.getPerfisCadastrados();
    if (perfisExistentes.some(p => p.username === userLimpo)) {
      setErroCadastro('Este nome de usuário (@) já está em uso.');
      return;
    }

    const novoPerfil = {
      id: `user_${Date.now()}`,
      username: userLimpo,
      senha: senha,
      nome: nome.trim(),
      biografia: biografia.trim() || 'Membro da Comunidade Global',
      foto: foto.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      dataNascimento: dataNascimento || '2000-01-01',
      amigos: [],
      pedidosEnviados: [],
      pedidosRecebidos: []
    };

    BancoDeDados.salvarNovoPerfilNaRede(novoPerfil);
    BancoDeDados.salvarPerfil(novoPerfil);
    onLoginSucesso(novoPerfil);
    if (onClose) onClose();
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        <div className="text-center space-y-2 relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute right-0 top-0 text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
            >
              ✕
            </button>
          )}
          <h2 className="text-2xl font-bold">Bíblia Online 📖</h2>
          <p className="text-xs opacity-75">Comunidade Global de Fé e Conexões</p>
          
          <div className="flex rounded-xl p-1 bg-slate-800/10 dark:bg-slate-800 mt-4">
            <button
              type="button"
              onClick={() => { setModo('login'); setErroLogin(''); setErroCadastro(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${modo === 'login' ? 'bg-blue-600 text-white shadow-md' : 'opacity-60'}`}
            >
              Fazer Login
            </button>
            <button
              type="button"
              onClick={() => { setModo('cadastro'); setErroLogin(''); setErroCadastro(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${modo === 'cadastro' ? 'bg-blue-600 text-white shadow-md' : 'opacity-60'}`}
            >
              Criar Conta
            </button>
          </div>
        </div>

        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {erroLogin && <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold text-center">{erroLogin}</div>}
            
            <div>
              <label className="text-xs font-semibold block mb-1 opacity-80">Seu @ (Usuário)</label>
              <input
                type="text"
                placeholder="Ex: geovanilobo"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                className={`w-full text-xs rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 opacity-80">Senha</label>
              <input
                type="password"
                placeholder="Sua senha"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                required
                className={`w-full text-xs rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold transition shadow-lg">
              Entrar na Comunidade 🚀
            </button>

            <div className="text-[11px] opacity-60 text-center pt-2">
              Contas padrão disponíveis:<br/>
              • <code className="text-blue-400 font-bold">geovanilobo</code> (Senha: 123)<br/>
              • <code className="text-blue-400 font-bold">anasouza</code> (Senha: 123)
            </div>
          </form>
        ) : (
          <form onSubmit={handleCadastrar} className="space-y-3">
            {erroCadastro && <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-semibold text-center">{erroCadastro}</div>}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1 opacity-80">@ (Usuário)</label>
                <input
                  type="text"
                  placeholder="ex: geovanilobo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={`w-full text-xs rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 opacity-80">Senha</label>
                <input
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className={`w-full text-xs rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 opacity-80">Nome Completo</label>
              <input
                type="text"
                placeholder="Ex: Geovani da Silva Lobo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className={`w-full text-xs rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1 opacity-80">Biografia</label>
              <input
                type="text"
                placeholder="Ex: desenvolvedor do site"
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                className={`w-full text-xs rounded-xl px-3 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1 opacity-80">Nascimento</label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className={`w-full text-xs rounded-xl px-2.5 py-2 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1 opacity-80">Foto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="text-[10px] file:py-1.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-500/10 file:text-blue-400 cursor-pointer w-full"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold transition shadow-lg mt-2">
              Criar Conta ✨
            </button>
          </form>
        )}

      </div>
    </div>
  );
}