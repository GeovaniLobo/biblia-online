import React, { useState, useEffect } from 'react';
import { BancoDeDados } from '../services/database';

export default function PlanosDeEstudo({ usuarioLogado, darkMode }) {
  const [planos, setPlanos] = useState([]);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaCapaUrl, setNovaCapaUrl] = useState('');
  const [totalDias, setTotalDias] = useState(7);

  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [modoLeitura, setModoLeitura] = useState(false); // Tela de introdução vs Tela de leitura dos dias
  const [diaAtivoIndex, setDiaAtivoIndex] = useState(0);

  const [textoEstudoDia, setTextoEstudoDia] = useState('');
  const [midiaDiaUrl, setMidiaDiaUrl] = useState('');
  const [tipoMidiaDia, setTipoMidiaDia] = useState('imagem');
  const [enviandoMidia, setEnviandoMidia] = useState(false);

  const [abaAtivaFiltro, setAbaAtivaFiltro] = useState('todos');

  useEffect(() => {
    async function carregarPlanosGlobais() {
      let planosSalvos = [];
      if (typeof BancoDeDados.getPlanosEstudo === 'function') {
        planosSalvos = await BancoDeDados.getPlanosEstudo();
      } else {
        const local = localStorage.getItem('rede_planos_estudo_global');
        planosSalvos = local ? JSON.parse(local) : [];
      }

      if (!planosSalvos || planosSalvos.length === 0) {
        const planoExemplo = [
          {
            id: 1,
            criador: 'geovanilobo',
            titulo: 'Fundamentos de Uma Caminhada Firme',
            descricao: 'Um devocional prático para renovar suas forças espirituais, fortalecer sua fé e caminhar com propósito todos os dias.',
            capa: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
            dias: Array.from({ length: 7 }, (_, i) => ({
              dia: i + 1,
              tituloDia: `Dia ${i + 1}: Renovando as Forças`,
              conteudoEstudo: `Reflexão guiada para o dia ${i + 1}: Busquem ao Senhor e meditem em Sua palavra para guiar os seus passos.`,
              midia: '',
              tipoMidia: 'imagem',
              concluido: false
            }))
          }
        ];
        planosSalvos = planoExemplo;
        salvarPlanosGlobais(planoExemplo);
      }
      setPlanos(planosSalvos);
    }
    carregarPlanosGlobais();
  }, [usuarioLogado.username]);

  const salvarPlanosGlobais = (novosPlanos) => {
    setPlanos(novosPlanos);
    if (typeof BancoDeDados.salvarPlanosEstudo === 'function') {
      BancoDeDados.salvarPlanosEstudo(novosPlanos);
    } else {
      localStorage.setItem('rede_planos_estudo_global', JSON.stringify(novosPlanos));
    }
  };

  const processarArquivo = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const criarPlanoEstudo = async (e) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !novaDescricao.trim()) return;

    let capaFinal = novaCapaUrl.trim();
    if (!capaFinal) {
      capaFinal = 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1200&q=80';
    }

    const diasArray = Array.from({ length: Number(totalDias) }, (_, i) => ({
      dia: i + 1,
      tituloDia: `Dia ${i + 1}: Jornada de Crescimento`,
      conteudoEstudo: `Escreva aqui o conteúdo de estudo oficial para o dia ${i + 1}...`,
      midia: '',
      tipoMidia: 'imagem',
      concluido: false
    }));

    const novoPlanoObj = {
      id: Date.now(),
      criador: usuarioLogado.username,
      titulo: novoTitulo.trim(),
      descricao: novaDescricao.trim(),
      capa: capaFinal,
      dias: diasArray
    };

    const atualizados = [novoPlanoObj, ...planos];
    salvarPlanosGlobais(atualizados);

    setNovoTitulo('');
    setNovaDescricao('');
    setNovaCapaUrl('');
    setTotalDias(7);
    setModalCriarAberto(false);
  };

  const salvarEdicaoDiaAtual = () => {
    if (!planoSelecionado) return;

    if (planoSelecionado.criador !== usuarioLogado.username) {
      alert('Apenas o criador deste plano pode alterar o conteúdo oficial.');
      return;
    }

    const diasAtualizados = [...planoSelecionado.dias];
    diasAtualizados[diaAtivoIndex] = {
      ...diasAtualizados[diaAtivoIndex],
      conteudoEstudo: textoEstudoDia,
      midia: midiaDiaUrl,
      tipoMidia: tipoMidiaDia
    };

    const planoAtualizado = { ...planoSelecionado, dias: diasAtualizados };
    setPlanosSelecionadoComAtualizacao(planoAtualizado);
  };

  const setPlanosSelecionadoComAtualizacao = (planoAtualizado) => {
    setPlanoSelecionado(planoAtualizado);
    const novosPlanos = planos.map(p => p.id === planoAtualizado.id ? planoAtualizado : p);
    salvarPlanosGlobais(novosPlanos);
  };

  const alternarConclusaoDia = (diaNum) => {
    if (!planoSelecionado) return;

    const diasAtualizados = planoSelecionado.dias.map(d => {
      if (d.dia === diaNum) {
        return { ...d, concluido: !d.concluido };
      }
      return d;
    });

    const planoAtualizado = { ...planoSelecionado, dias: diasAtualizados };
    setPlanosSelecionadoComAtualizacao(planoAtualizado);
  };

  const calcularProgresso = (dias) => {
    if (!dias || dias.length === 0) return 0;
    const concluidos = dias.filter(d => d.concluido).length;
    return Math.round((concluidos / dias.length) * 100);
  };

  const planosFiltrados = planos.filter(p => {
    if (abaAtivaFiltro === 'meus') return p.criador === usuarioLogado.username;
    return true;
  });

  const souOCriador = planoSelecionado && planoSelecionado.criador === usuarioLogado.username;

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 py-8 space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Cabeçalho Principal */}
      {!planoSelecionado && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-700/40">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Planos de Estudo 📖
            </h2>
            <p className="text-xs opacity-70 mt-1">Jornadas devocionais para fortalecer sua caminhada diária.</p>
          </div>

          <button 
            onClick={() => setModalCriarAberto(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2"
          >
            ✨ Criar Novo Plano
          </button>
        </div>
      )}

      {/* Filtros de Início */}
      {!planoSelecionado && (
        <div className="flex gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800 w-fit">
          <button 
            onClick={() => setAbaAtivaFiltro('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaAtivaFiltro === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            🌟 Sugestões
          </button>
          <button 
            onClick={() => setAbaAtivaFiltro('meus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaAtivaFiltro === 'meus' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            👤 Meus Planos
          </button>
        </div>
      )}

      {/* Modal Criar Plano */}
      {modalCriarAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`max-w-md w-full p-6 rounded-3xl shadow-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-700">
              <h3 className="font-extrabold text-sm">Criar Novo Plano de Estudo</h3>
              <button onClick={() => setModalCriarAberto(false)} className="text-sm font-bold opacity-70">✕</button>
            </div>

            <form onSubmit={criarPlanoEstudo} className="space-y-4">
              <div>
                <label className="text-xs font-bold opacity-70 block mb-1">Título do Plano:</label>
                <input 
                  type="text" 
                  placeholder="Ex: Sabedoria em Provérbios" 
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  required
                  className={`w-full text-xs rounded-xl px-3.5 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold opacity-70 block mb-1">Descrição / Introdução:</label>
                <textarea 
                  rows="3"
                  placeholder="Sobre o que é este plano..." 
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  required
                  className={`w-full text-xs rounded-xl px-3.5 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold opacity-70 block mb-1">URL da Imagem de Capa (Opcional):</label>
                <input 
                  type="url" 
                  placeholder="https://exemplo.com/imagem.jpg" 
                  value={novaCapaUrl}
                  onChange={(e) => setNovaCapaUrl(e.target.value)}
                  className={`w-full text-xs rounded-xl px-3.5 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="text-xs font-bold opacity-70 block mb-1">Duração:</label>
                <select 
                  value={totalDias}
                  onChange={(e) => setTotalDias(e.target.value)}
                  className={`w-full text-xs rounded-xl px-3.5 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                >
                  <option value={3}>3 Dias</option>
                  <option value={7}>7 Dias (1 Semana)</option>
                  <option value={14}>14 Dias (2 Semanas)</option>
                  <option value={21}>21 Dias</option>
                  <option value={30}>30 Dias (1 Mês)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition">
                Publicar Plano 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TELA DE APRESENTAÇÃO DO PLANO (Estilo Bible.com) */}
      {planoSelecionado && !modoLeitura && (
        <div className="space-y-6">
          <button onClick={() => setPlanoSelecionado(null)} className="text-xs font-bold text-blue-500 hover:underline inline-block">
            ← Voltar para todos os planos
          </button>

          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{planoSelecionado.titulo}</h1>
            
            {/* Capa em Destaque */}
            <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative">
              <img src={planoSelecionado.capa} alt={planoSelecionado.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                <span className="text-xs bg-blue-600 text-white font-bold px-3 py-1.5 rounded-full shadow-lg">
                  Criado por @{planoSelecionado.criador}
                </span>
              </div>
            </div>

            {/* Ações e Progresso */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl">
                  {planoSelecionado.dias.length} Dias
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Progresso: {calcularProgresso(planoSelecionado.dias)}%
                </span>
              </div>

              <button 
                onClick={() => setModoLeitura(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg transition"
              >
                {calcularProgresso(planoSelecionado.dias) > 0 ? 'Continuar Leitura 📖' : 'Começar este Plano 🚀'}
              </button>
            </div>

            {/* Descrição Completa */}
            <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800 space-y-4 leading-relaxed text-sm opacity-90">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Sobre o Plano</h3>
              <p>{planoSelecionado.descricao}</p>
            </div>
          </div>
        </div>
      )}

      {/* TELA DE LEITURA DIÁRIA DO PLANO */}
      {planoSelecionado && modoLeitura && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setModoLeitura(false)} className="text-xs font-bold text-blue-500 hover:underline">
              ← Visão Geral do Plano
            </button>
            <span className="text-xs font-bold text-slate-400">
              Progresso: {calcularProgresso(planoSelecionado.dias)}%
            </span>
          </div>

          {/* Seletor de Dias */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {planoSelecionado.dias.map((d, index) => (
              <button
                key={d.dia}
                onClick={() => {
                  setDiaAtivoIndex(index);
                  setTextoEstudoDia(d.conteudoEstudo || '');
                  setMidiaDiaUrl(d.midia || '');
                  setTipoMidiaDia(d.tipoMidia || 'imagem');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition border ${
                  diaAtivoIndex === index 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                    : d.concluido 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Dia {d.dia}</span>
                {d.concluido && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
              </button>
            ))}
          </div>

          {/* Conteúdo do Dia */}
          {(() => {
            const diaAtual = planoSelecionado.dias[diaAtivoIndex];
            return (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Dia {diaAtual.dia} de {planoSelecionado.dias.length}</span>
                    <h3 className="text-xl font-black mt-1">{planoSelecionado.titulo}</h3>
                  </div>

                  <button 
                    onClick={() => alternarConclusaoDia(diaAtual.dia)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                      diaAtual.concluido 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {diaAtual.concluido ? '✓ Dia Concluído' : 'Marcar como Concluído'}
                  </button>
                </div>

                <div className="space-y-4">
                  {souOCriador ? (
                    <div>
                      <label className="text-xs font-bold text-blue-400 block mb-2">Painel do Criador (Edição Oficial):</label>
                      <textarea 
                        rows="8"
                        value={textoEstudoDia}
                        onChange={(e) => setTextoEstudoDia(e.target.value)}
                        className="w-full text-sm rounded-2xl p-4 border bg-slate-900 border-slate-700 text-white leading-relaxed"
                      ></textarea>
                      <button 
                        onClick={salvarEdicaoDiaAtual}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                      >
                        Salvar Alterações Oficiais 💾
                      </button>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed opacity-90 whitespace-pre-wrap">
                      {diaAtual.conteudoEstudo || "Nenhum conteúdo publicado para este dia ainda."}
                    </div>
                  )}

                  {midiaDiaUrl && (
                    <div className="pt-4">
                      {tipoMidiaDia === 'video' ? (
                        <video src={midiaDiaUrl} controls className="w-full h-64 object-cover rounded-2xl" />
                      ) : (
                        <img src={midiaDiaUrl} alt="Mídia do Estudo" className="w-full h-64 object-cover rounded-2xl" />
                      )}
                    </div>
                  )}

                  {souOCriador && (
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <label className="text-xs font-bold opacity-70 block">Anexar Mídia para este dia:</label>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setEnviandoMidia(true);
                            const url = await processarArquivo(file);
                            setEnviandoMidia(false);
                            setTipoMidiaDia(file.type.startsWith('video') ? 'video' : 'imagem');
                            setMidiaDiaUrl(url);
                          }
                        }} 
                        className="text-xs opacity-75"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* LISTA DE PLANOS (Sugestões) */}
      {!planoSelecionado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planosFiltrados.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-3xl border bg-slate-900/30 border-slate-800">
              <p className="text-xs opacity-60">Nenhum plano encontrado.</p>
            </div>
          ) : (
            planosFiltrados.map(plano => {
              const progresso = calcularProgresso(plano.dias);
              const eMeu = plano.criador === usuarioLogado.username;
              return (
                <div 
                  key={plano.id}
                  onClick={() => {
                    setPlanoSelecionado(plano);
                    setModoLeitura(false);
                    setDiaAtivoIndex(0);
                    setTextoEstudoDia(plano.dias[0]?.conteudoEstudo || '');
                    setMidiaDiaUrl(plano.dias[0]?.midia || '');
                    setTipoMidiaDia(plano.dias[0]?.tipoMidia || 'imagem');
                  }}
                  className="rounded-3xl border bg-slate-900/40 border-slate-800 overflow-hidden cursor-pointer transition hover:scale-[1.01] hover:border-blue-500/50 shadow-lg flex flex-col"
                >
                  <div className="h-40 w-full relative">
                    <img src={plano.capa} alt={plano.titulo} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    <span className="absolute bottom-3 left-3 text-[10px] bg-blue-600 text-white font-bold px-2.5 py-1 rounded-full">
                      {plano.dias.length} Dias
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-blue-400 font-bold">@{plano.criador}</span>
                        <span className="text-xs font-black text-emerald-400">{progresso}%</span>
                      </div>
                      <h3 className="text-base font-extrabold">{plano.titulo}</h3>
                      <p className="text-xs opacity-75 line-clamp-2 mt-1">{plano.descricao}</p>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-emerald-500" style={{ width: `${progresso}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}