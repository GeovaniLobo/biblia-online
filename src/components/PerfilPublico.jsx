import React, { useState } from 'react';
import { BancoDeDados } from '../services/database';

export default function PerfilPublico({ perfilAlvo, usuarioLogado, onVoltar, darkMode, onToggleDarkMode }) {
  const [ abaPerfil, setAbaPerfil ] = useState('posts'); // 'posts', 'devocionais', 'amigos'

  const perfis = BancoDeDados.getPerfisCadastrados();
  const perfilAtualDados = perfis.find(p => p.username === usuarioLogado.username) || { amigos: [], pedidosEnviados: [], pedidosRecebidos: [] };
  const alvoDados = perfis.find(p => p.username === perfilAlvo.username) || perfilAlvo;

  const jaEhAmigo = perfilAtualDados.amigos?.includes(alvoDados.username);
  const envieiPedido = perfilAtualDados.pedidosEnviados?.includes(alvoDados.username);
  const recebiPedido = perfilAtualDados.pedidosRecebidos?.includes(alvoDados.username);
  const ehMeuPerfil = alvoDados.username === usuarioLogado.username;

  const publicacoes = BancoDeDados.getPublicacoes().filter(p => p.username === alvoDados.username);
  
  const devocionaisDoAlvo = (() => {
    const salvos = localStorage.getItem(`devocionais_${alvoDados.username}`);
    return salvos ? JSON.parse(salvos).filter(d => !d.privado) : [];
  })();

  const listaAmigosDetalhes = perfis.filter(p => alvoDados.amigos?.includes(p.username));

  const handleAmizade = () => {
    if (jaEhAmigo) {
      BancoDeDados.rejeitarPedidoAmizade(usuarioLogado.username, alvoDados.username);
      let listaPerfis = BancoDeDados.getPerfisCadastrados();
      listaPerfis = listaPerfis.map(p => {
        if (p.username === usuarioLogado.username) {
          p.amigos = p.amigos.filter(a => a !== alvoDados.username);
        }
        if (p.username === alvoDados.username) {
          p.amigos = p.amigos.filter(a => a !== usuarioLogado.username);
        }
        return p;
      });
      localStorage.setItem('perfis_comunidade_db', JSON.stringify(listaPerfis));
      window.location.reload();
    } else if (!envieiPedido) {
      BancoDeDados.enviarPedidoAmizade(usuarioLogado.username, alvoDados.username);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-20">
      
      {/* BARRA SUPERIOR DO PERFIL COM ÍCONE DE INÍCIO REAL E DARK MODE */}
      <div className="flex justify-between items-center">
        <button 
          onClick={onVoltar} 
          title="Início / Comunidade"
          className={`p-2.5 rounded-xl border transition flex items-center justify-center ${darkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs'}`}
        >
          {/* Ícone SVG real de Início (Casinha) */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        </button>

        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl text-xs border transition ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-slate-800 shadow-xs'}`}
          >
            {darkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
          </button>
        )}
      </div>

      {/* CABEÇALHO DO PERFIL COM BANNER E ESPAÇAMENTO CORRIGIDO */}
      <div className={`rounded-3xl border shadow-lg overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Banner de Fundo */}
        <div className="h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Bloco principal do perfil ajustado para não invadir o banner */}
        <div className="px-8 pb-8 pt-6 relative flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Foto de perfil posicionada corretamente sobreposta de forma limpa */}
          <img 
            src={alvoDados.foto} 
            alt="Avatar" 
            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-800 -mt-20 md:-mt-20 flex-shrink-0" 
          />

          <div className="flex-1 text-center md:text-left space-y-1 pt-1">
            <h2 className="text-2xl font-black">{alvoDados.nome}</h2>
            <p className="text-xs text-blue-400 font-bold">@{alvoDados.username}</p>
            <p className="text-sm opacity-90 pt-1 max-w-lg">{alvoDados.biografia}</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto pt-2">
            {!ehMeuPerfil && (
              <div>
                {jaEhAmigo ? (
                  <button 
                    onClick={handleAmizade} 
                    className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition border border-red-500/30"
                  >
                    ✓ Amigos (Desfazer)
                  </button>
                ) : envieiPedido ? (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-2 rounded-xl font-semibold border border-amber-500/30">⏳ Pedido Enviado</span>
                ) : recebiPedido ? (
                  <button onClick={() => { BancoDeDados.aceitarPedidoAmizade(usuarioLogado.username, alvoDados.username); window.location.reload(); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold">
                    Aceitar Pedido
                  </button>
                ) : (
                  <button onClick={handleAmizade} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md">
                    + Adicionar Amigo
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                const link = `${window.location.origin}/#/${alvoDados.username}`;
                navigator.clipboard.writeText(link);
                alert(`Link do perfil copiado: ${link}`);
              }}
              className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold transition border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
            >
              🔗 Compartilhar Perfil
            </button>
          </div>
        </div>

        {/* ESTATÍSTICAS DO PERFIL */}
        <div className={`grid grid-cols-3 border-t text-center py-4 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <div>
            <p className="text-lg font-black">{publicacoes.length}</p>
            <p className="text-[11px] opacity-60 uppercase tracking-wider font-semibold">Publicações</p>
          </div>
          <div>
            <p className="text-lg font-black">{devocionaisDoAlvo.length}</p>
            <p className="text-[11px] opacity-60 uppercase tracking-wider font-semibold">Devocionais</p>
          </div>
          <div>
            <p className="text-lg font-black">{alvoDados.amigos?.length || 0}</p>
            <p className="text-[11px] opacity-60 uppercase tracking-wider font-semibold">Amigos</p>
          </div>
        </div>

      </div>

      {/* ABAS DE NAVEGAÇÃO DO PERFIL */}
      <div className="flex gap-2 border-b pb-2 dark:border-slate-800">
        <button
          onClick={() => setAbaPerfil('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaPerfil === 'posts' ? 'bg-blue-600 text-white shadow-md' : 'opacity-70 hover:opacity-100'}`}
        >
          📖 Publicações & Versículos ({publicacoes.length})
        </button>
        <button
          onClick={() => setAbaPerfil('devocionais')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaPerfil === 'devocionais' ? 'bg-blue-600 text-white shadow-md' : 'opacity-70 hover:opacity-100'}`}
        >
          💡 Devocionais Públicos ({devocionaisDoAlvo.length})
        </button>
        <button
          onClick={() => setAbaPerfil('amigos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaPerfil === 'amigos' ? 'bg-blue-600 text-white shadow-md' : 'opacity-70 hover:opacity-100'}`}
        >
          👥 Amigos ({listaAmigosDetalhes.length})
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {abaPerfil === 'posts' && (
        <div className="space-y-4">
          {publicacoes.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center opacity-60 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <p className="text-sm">Este usuário ainda não fez publicações ou marcações na Bíblia.</p>
            </div>
          ) : (
            publicacoes.map(pub => (
              <div key={pub.id} className={`p-6 rounded-2xl border shadow-xs space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <h4 className="text-lg font-bold">{pub.tema}</h4>
                {pub.imagem && <img src={pub.imagem} alt="Pub" className="w-full h-64 object-cover rounded-xl" />}
                <p className="text-sm leading-relaxed opacity-90">{pub.texto}</p>
                <div className="text-xs opacity-50 pt-2 border-t dark:border-slate-800">
                  ❤️ {pub.curtidas || 0} Curtidas • 💬 {pub.comentarios?.length || 0} Comentários
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {abaPerfil === 'devocionais' && (
        <div className="space-y-4">
          {devocionaisDoAlvo.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center opacity-60 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <p className="text-sm">Nenhum devocional público compartilhado por este usuário.</p>
            </div>
          ) : (
            devocionaisDoAlvo.map(dev => (
              <div key={dev.id} className={`p-6 rounded-2xl border shadow-xs space-y-2 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold">{dev.titulo}</h4>
                  <span className="text-[10px] opacity-50">{dev.data}</span>
                </div>
                <p className="text-sm leading-relaxed opacity-90">{dev.texto}</p>
              </div>
            ))
          )}
        </div>
      )}

      {abaPerfil === 'amigos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listaAmigosDetalhes.length === 0 ? (
            <div className={`col-span-2 p-10 rounded-2xl border text-center opacity-60 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <p className="text-sm">Nenhum amigo na lista no momento.</p>
            </div>
          ) : (
            listaAmigosDetalhes.map(amigo => (
              <div key={amigo.username} className={`p-4 rounded-2xl border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <div className="flex items-center gap-3">
                  <img src={amigo.foto} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-blue-500" />
                  <div>
                    <h5 className="font-bold text-sm">{amigo.nome}</h5>
                    <p className="text-xs text-blue-400">@{amigo.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => { window.location.hash = `#/${amigo.username}`; }}
                  className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition"
                >
                  Ver Perfil
                </button>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}