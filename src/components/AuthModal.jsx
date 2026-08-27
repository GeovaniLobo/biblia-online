import React, { useState } from 'react';
import { BancoDeDados } from '../services/database';

export default function AuthModal({ isOpen, onClose, onLoginSucesso, darkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [foto, setFoto] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (!isOpen) return null;

  // Função para converter e comprimir a foto escolhida do dispositivo
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
          setErro('Preencha todos os campos obrigatórios.');
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
          data_nascimento: dataNascimento || '',
          foto: foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          biografia: 'Praticando a fé e o amor ao próximo.',
          amigos: [],
          pedidos_enviados: [],
          pedidos_recebidos: []
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
      <div className={`relative w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border my-auto ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
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

        {/* Abas Alternar Login / Cadastro */}
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
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {!isLogin && (
            <>
              {/* Upload de Foto no Cadastro */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <img 
                  src={foto || 'https://via.placeholder.com/150'} 
                  alt="Preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md" 
                />
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-md">
                  📁 Escolher Foto do Dispositivo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

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