import React, { useState } from 'react';
import { BancoDeDados } from '../services/database';

export default function EditarPerfil({ usuarioLogado, onSalvo, onVoltar, darkMode }) {
  const [nome, setNome] = useState(usuarioLogado.nome || '');
  const [foto, setFoto] = useState(usuarioLogado.foto || '');
  const [biografia, setBiografia] = useState(usuarioLogado.biografia || '');
  const [senha, setSenha] = useState(usuarioLogado.senha || '');
  const [carregando, setCarregando] = useState(false);

  // Função para redimensionar e converter a imagem com segurança
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
        
        // Converte para JPEG comprimido
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFoto(dataUrl);
      };
    };
    leitor.readAsDataURL(arquivo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const novosDados = { nome, foto, biografia, senha };
      
      // Atualiza no Supabase
      await BancoDeDados.atualizarPerfil(usuarioLogado.username, novosDados);

      // Atualiza a sessão local
      const usuarioAtualizado = { ...usuarioLogado, ...novosDados };
      BancoDeDados.fazerLogin(usuarioAtualizado);

      alert('Perfil atualizado com sucesso na nuvem! ✨');
      onSalvo(usuarioAtualizado);
    } catch (erro) {
      console.error('Erro ao salvar perfil:', erro);
      alert('Erro ao atualizar o perfil. Verifique os dados.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <button onClick={onVoltar} className="text-xs text-blue-500 hover:underline font-semibold">
          ← Voltar
        </button>
        <h2 className="text-lg font-bold">Editar Perfil</h2>
        <div></div>
      </div>

      <form onSubmit={handleSubmit} className={`p-8 rounded-3xl border shadow-lg space-y-5 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        <div className="flex flex-col items-center gap-3">
          <img src={foto || 'https://via.placeholder.com/150'} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 shadow-md" />
          <p className="text-xs opacity-60">@{usuarioLogado.username} (não pode ser alterado)</p>
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-md">
            📁 Escolher Foto do Dispositivo
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Nome Completo</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className={`w-full text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Biografia / Frase de Fé</label>
          <textarea
            value={biografia}
            onChange={(e) => setBiografia(e.target.value)}
            rows="3"
            className={`w-full text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className={`w-full text-sm rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50"
        >
          {carregando ? 'Salvando...' : 'Salvar Alterações'}
        </button>

      </form>
    </div>
  );
}