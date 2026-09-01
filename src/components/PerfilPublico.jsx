import React, { useState, useEffect } from 'react';
import { BancoDeDados } from '../services/database';

export default function PerfilPublico({ perfilAlvo, usuarioLogado, onVoltar, darkMode }) {
  const [publicacoesUsuario, setPublicacoesUsuario] = useState([]);
  const [perfisAtualizados, setPerfisAtualizados] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const pubs = await BancoDeDados.getPublicacoes();
      const perfis = await BancoDeDados.getPerfisCadastrados();
      setPublicacoesUsuario(pubs.filter(p => p.username === perfilAlvo.username));
      setPerfisAtualizados(perfis);
    }
    carregarDados();
  }, [perfilAlvo]);

  // Busca o perfil atualizado do alvo no banco para garantir status de amizade em tempo real
  const perfilAlvoAtualizado = perfisAtualizados.find(p => p.username === perfilAlvo.username) || perfilAlvo;
  const euNoBanco = perfisAtualizados.find(p => p.username === usuarioLogado.username) || { amigos: [], pedidos_enviados: [], pedidos_recebidos: [] };

  const ehAmigo = euNoBanco.amigos?.includes(perfilAlvoAtualizado.username);
  const envieiPedido = euNoBanco.pedidos_enviados?.includes(perfilAlvoAtualizado.username);
  const recebiPedido = euNoBanco.pedidos_recebidos?.includes(perfilAlvoAtualizado.username);
  const eMeuProprioPerfil = usuarioLogado.username === perfilAlvoAtualizado.username;
  const perfilVerificado = perfilAlvoAtualizado.verificado;

  if (!perfilAlvo) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm opacity-60">Perfil não encontrado.</p>
        <button onClick={onVoltar} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto rounded-3xl border shadow-xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      
      {/* Banner / Capa Superior Estilizada */}
      <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 relative p-4 flex justify-between items-start">
        <button 
          onClick={onVoltar} 
          className="bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl font-bold backdrop-blur-md transition flex items-center gap-1 shadow-md"
        >
          ← Voltar
        </button>
      </div>

      {/* Container Principal do Perfil */}
      <div className="px-6 pb-8 space-y-6 relative">
        
        {/* Foto de Perfil Centralizada com Efeito de Sobreposição */}
        <div className="flex flex-col items-center text-center -mt-16 space-y-3">
          <img 
            src={perfilAlvoAtualizado.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'} 
            alt="Avatar" 
            className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-2xl bg-slate-800" 
          />
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl font-extrabold tracking-tight">{perfilAlvoAtualizado.nome || 'Usuário'}</h2>
              {perfilVerificado && (
                <span className="relative inline-flex items-center justify-center flex-shrink-0 group/badge cursor-pointer" title="Perfil Verificado">
  <svg className="w-5 h-5 text-blue-500 transform transition hover:scale-110" viewBox="0 0 512 512" fill="currentColor">
    <path d="M256 0c11.4 0 21.6 7.4 25.1 18.2l10.9 33.1c4.8 14.5 18.5 24.6 33.9 24.6h34.8c12.2 0 23.2 4.9 31.3 12.9s12.9 19.1 12.9 31.3v34.8c0 15.4 10.1 29.1 24.6 33.9l33.1 10.9c10.8 3.5 18.2 13.7 18.2 25.1s-7.4 21.6-18.2 25.1l-33.1 10.9c-14.5 4.8-24.6 18.5-24.6 33.9v34.8c0 12.2-4.9 23.2-12.9 31.3s-19.1 12.9-31.3 12.9h-34.8c-15.4 0-29.1 10.1-33.9 24.6l-10.9 33.1c-3.5 10.8-13.7 18.2-25.1 18.2s-21.6-7.4-25.1-18.2l-10.9-33.1c-4.8-14.5-18.5-24.6-33.9-24.6h-34.8c-12.2 0-23.2-4.9-31.3-12.9s-12.9-19.1-12.9-31.3v-34.8c0-15.4-10.1-29.1-24.6-33.9L18.2 281.5C7.4 278 0 267.8 0 256s7.4-21.6 18.2-25.1l33.1-10.9c14.5-4.8 24.6-18.5 24.6-33.9v-34.8c0-12.2 4.9-23.2 12.9-31.3s19.1-12.9 31.3-12.9h34.8c15.4 0 29.1-10.1 33.9-24.6l10.9-33.1C234.4 7.4 244.6 0 256 0zm-35.3 194.7c-6.2 6.2-6.2 16.4 0 22.6l-64 64c-6.2 6.2-16.4 6.2-22.6 0l-32-32c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L144 245.3l53.3-53.3c6.2-6.2 16.4-6.2 22.6 0z" />
  </svg>
</span>
              )}
            </div>
            <p className="text-xs text-blue-400 font-bold mt-0.5">@{perfilAlvoAtualizado.username || 'usuario'}</p>
            
            <p className="text-xs opacity-80 mt-2 max-w-md leading-relaxed whitespace-pre-line">
              {perfilAlvoAtualizado.biografia || 'Praticando a fé e o amor ao próximo.'}
            </p>
          </div>

          {/* Botões de Ação Dinâmicos (Adicionar Amigo, Aceitar, Chat) */}
          {!eMeuProprioPerfil && (
            <div className="pt-2 flex gap-2">
              {ehAmigo ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  ✓ Amigos
                </span>
              ) : envieiPedido ? (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold">
                  Solicitação Pendente
                </span>
              ) : recebiPedido ? (
                <div className="flex gap-2">
                  <button 
                    onClick={async () => { await BancoDeDados.aceitarPedidoAmizade(usuarioLogado.username, perfilAlvoAtualizado.username); window.location.reload(); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Aceitar Amizade
                  </button>
                </div>
              ) : (
                <button 
                  onClick={async () => { await BancoDeDados.enviarPedidoAmizade(usuarioLogado.username, perfilAlvoAtualizado.username); window.location.reload(); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                >
                  Adicionar Amigo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Caixa de Estatísticas */}
        <div className={`p-4 rounded-2xl border grid grid-cols-2 text-center shadow-xs ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
          <div className="border-r border-slate-700/20">
            <span className="block text-base font-extrabold text-blue-500">{perfilAlvoAtualizado.amigos?.length || 0}</span>
            <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Amigos</span>
          </div>
          <div>
            <span className="block text-base font-extrabold text-indigo-500">{publicacoesUsuario.length}</span>
            <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Publicações</span>
          </div>
        </div>

        {/* Seção de Publicações Recentes do Usuário */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">Publicações Recentes</h3>
          {publicacoesUsuario.length === 0 ? (
            <p className="text-xs opacity-40 text-center py-8">Este usuário ainda não fez nenhuma publicação na comunidade.</p>
          ) : (
            publicacoesUsuario.map(pub => (
              <div key={pub.id} className={`p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-slate-800/20 border-slate-700/40' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-sm font-bold">{pub.tema}</h4>
                {pub.imagem && <img src={pub.imagem} alt="Pub" className="w-full h-40 object-cover rounded-xl" />}
                <p className="text-xs leading-relaxed opacity-90">{pub.texto}</p>
                <div className="flex justify-between items-center text-[10px] opacity-50 pt-2 border-t border-slate-700/20">
                  <span>❤️ {pub.curtidas || 0} Curtidas</span>
                  <span>💬 {pub.comentarios?.length || 0} Comentários</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}