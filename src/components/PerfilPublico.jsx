import React from 'react';

export default function PerfilPublico({ perfilAlvo, usuarioLogado, onVoltar, darkMode }) {
  if (!perfilAlvo) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm opacity-60">Perfil não encontrado.</p>
        <button onClick={onVoltar} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      <button 
        onClick={onVoltar} 
        className="text-xs text-blue-500 hover:underline font-semibold"
      >
        ← Voltar para a Comunidade
      </button>

      <div className="flex flex-col items-center text-center space-y-3">
        <img 
          src={perfilAlvo.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} 
          alt="Avatar" 
          className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-lg" 
        />
        <div>
          <h2 className="text-xl font-bold">{perfilAlvo.nome || 'Usuário'}</h2>
          <p className="text-xs text-blue-400 font-semibold">@{perfilAlvo.username || 'usuario'}</p>
          <p className="text-xs opacity-75 mt-2 max-w-md">{perfilAlvo.biografia || 'Praticando a fé e o amor ao próximo.'}</p>
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex justify-around text-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div>
          <span className="block text-sm font-bold">{perfilAlvo.amigos?.length || 0}</span>
          <span className="text-[10px] opacity-60 uppercase tracking-wider">Amigos</span>
        </div>
        <div>
          <span className="block text-sm font-bold">Comunidade</span>
          <span className="text-[10px] opacity-60 uppercase tracking-wider">Membro Ativo</span>
        </div>
      </div>
    </div>
  );
}