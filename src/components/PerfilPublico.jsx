import React, { useState, useEffect } from "react";
import { BancoDeDados } from "../services/database";

export default function PerfilPublico({
  perfilAlvo,
  usuarioLogado,
  onVoltar,
  darkMode,
}) {
  const [publicacoesUsuario, setPublicacoesUsuario] = useState([]);
  const [perfisAtualizados, setPerfisAtualizados] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const pubs = await BancoDeDados.getPublicacoes();
      const perfis = await BancoDeDados.getPerfisCadastrados();
      setPublicacoesUsuario(
        pubs.filter((p) => p.username === perfilAlvo.username),
      );
      setPerfisAtualizados(perfis);
    }
    carregarDados();
  }, [perfilAlvo]);

  // Busca o perfil atualizado do alvo no banco para garantir status de amizade em tempo real
  const perfilAlvoAtualizado =
    perfisAtualizados.find((p) => p.username === perfilAlvo.username) ||
    perfilAlvo;
  const euNoBanco = perfisAtualizados.find(
    (p) => p.username === usuarioLogado.username,
  ) || { amigos: [], pedidos_enviados: [], pedidos_recebidos: [] };

  const ehAmigo = euNoBanco.amigos?.includes(perfilAlvoAtualizado.username);
  const envieiPedido = euNoBanco.pedidos_enviados?.includes(
    perfilAlvoAtualizado.username,
  );
  const recebiPedido = euNoBanco.pedidos_recebidos?.includes(
    perfilAlvoAtualizado.username,
  );
  const eMeuProprioPerfil =
    usuarioLogado.username === perfilAlvoAtualizado.username;
  const perfilVerificado = perfilAlvoAtualizado.verificado;

  if (!perfilAlvo) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm opacity-60">Perfil não encontrado.</p>
        <button
          onClick={onVoltar}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div
      className={`max-w-2xl mx-auto rounded-3xl border shadow-xl overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}
    >
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
            src={
              perfilAlvoAtualizado.foto ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
            }
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-2xl bg-slate-800"
          />
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl font-extrabold tracking-tight">
                {perfilAlvoAtualizado.nome || "Usuário"}
              </h2>
              {perfilVerificado && (
                <span className="relative inline-flex items-center justify-center flex-shrink-0 group/badge cursor-pointer -translate-y-0.5" title="Perfil Verificado">
  <svg className="w-5 h-5 text-blue-500 transform transition hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-.65 0-1.28.31-1.66.85l-.78 1.13c-.38.55-1.03.86-1.69.81l-1.37-.11c-.78-.06-1.46.46-1.61 1.23l-.28 1.35c-.15.72-.63 1.3-1.28 1.62l-1.18.59c-.68.34-.97 1.17-.65 1.86l.6 1.25c.33.68.33 1.49 0 2.17l-.6 1.25c-.32.69-.03 1.52.65 1.86l1.18.59c.65.32 1.13.9 1.28 1.62l.28 1.35c.15.77.83 1.29 1.61 1.23l1.37-.11c.66-.05 1.31-.26 1.69-.81l.78 1.13c.38.54 1.01.85 1.66.85s1.28-.31 1.66-.85l.78-1.13c.38-.55 1.03-.86 1.69-.81l1.37.11c.78.06 1.46-.46 1.61-1.23l.28-1.35c.15-.72.63-1.3 1.28-1.62l1.18-.59c.68-.34.97-1.17.65-1.86l-.6-1.25c-.33-.68-.33-1.49 0-2.17l.6-1.25c.32-.69.03-1.52-.65-1.86l-1.18-.59c-.65-.32-1.13-.9-1.28-1.62l-.28-1.35c-.15-.77-.83-1.29-1.61-1.23l-1.37.11c-.66.05-1.31-.26-1.69-.81l-.78-1.13A2.01 2.01 0 0 0 12 2z" />
    <path d="m9.5 13.79-2.15-2.15a1 1 0 0 0-1.41 1.41l2.86 2.86a1 1 0 0 0 1.41 0l6.14-6.14a1 1 0 0 0-1.41-1.41L9.5 13.79z" fill="#ffffff" />
  </svg>
</span>
              )}
            </div>
            <p className="text-xs text-blue-400 font-bold mt-0.5">
              @{perfilAlvoAtualizado.username || "usuario"}
            </p>

            <p className="text-xs opacity-80 mt-2 max-w-md leading-relaxed whitespace-pre-line">
              {perfilAlvoAtualizado.biografia ||
                "Praticando a fé e o amor ao próximo."}
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
                    onClick={async () => {
                      await BancoDeDados.aceitarPedidoAmizade(
                        usuarioLogado.username,
                        perfilAlvoAtualizado.username,
                      );
                      window.location.reload();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Aceitar Amizade
                  </button>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    await BancoDeDados.enviarPedidoAmizade(
                      usuarioLogado.username,
                      perfilAlvoAtualizado.username,
                    );
                    window.location.reload();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                >
                  Adicionar Amigo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Caixa de Estatísticas */}
        <div
          className={`p-4 rounded-2xl border grid grid-cols-2 text-center shadow-xs ${darkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="border-r border-slate-700/20">
            <span className="block text-base font-extrabold text-blue-500">
              {perfilAlvoAtualizado.amigos?.length || 0}
            </span>
            <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">
              Amigos
            </span>
          </div>
          <div>
            <span className="block text-base font-extrabold text-indigo-500">
              {publicacoesUsuario.length}
            </span>
            <span className="text-[10px] opacity-60 uppercase tracking-widest font-bold">
              Publicações
            </span>
          </div>
        </div>

        {/* Seção de Publicações Recentes do Usuário */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">
            Publicações Recentes
          </h3>
          {publicacoesUsuario.length === 0 ? (
            <p className="text-xs opacity-40 text-center py-8">
              Este usuário ainda não fez nenhuma publicação na comunidade.
            </p>
          ) : (
            publicacoesUsuario.map((pub) => (
              <div
                key={pub.id}
                className={`p-4 rounded-2xl border space-y-2 ${darkMode ? "bg-slate-800/20 border-slate-700/40" : "bg-slate-50 border-slate-200"}`}
              >
                <h4 className="text-sm font-bold">{pub.tema}</h4>
                {pub.imagem && (
                  <img
                    src={pub.imagem}
                    alt="Pub"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                )}
                <p className="text-xs leading-relaxed opacity-90">
                  {pub.texto}
                </p>
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
