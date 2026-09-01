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
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-xl font-extrabold tracking-tight">{perfilAlvoAtualizado.nome || 'Usuário'}</h2>
            {perfilAlvoAtualizado.verificado && (
              <span className="text-blue-500 inline-flex items-center" title="Perfil Verificado">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </span>
            )}
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