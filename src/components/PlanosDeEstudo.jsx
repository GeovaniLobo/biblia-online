import React, { useState, useEffect } from 'react';

export default function PlanosDeEstudo({ usuarioLogado, darkMode }) {
  const [planos, setPlanos] = useState([]);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  
  // Estados para criar um novo plano
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [totalDias, setTotalDias] = useState(7);

  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [diaAtivoIndex, setDiaAtivoIndex] = useState(0);

  // Estados para edição do dia específico selecionado
  const [textoEstudoDia, setTextoEstudoDia] = useState('');
  const [midiaDiaUrl, setMidiaDiaUrl] = useState('');
  const [tipoMidiaDia, setTipoMidiaDia] = useState('imagem');
  const [enviandoMidia, setEnviandoMidia] = useState(false);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem(`planos_estudo_${usuarioLogado.username}`);
    if (dadosSalvos) {
      setPlanos(JSON.parse(dadosSalvos));
    } else {
      const planoExemplo = [
        {
          id: 1,
          criador: usuarioLogado.username,
          titulo: 'Fortalecendo a Fé em 7 Dias',
          descricao: 'Um plano prático para renovar suas forças espirituais diariamente.',
          dias: Array.from({ length: 7 }, (_, i) => ({
            dia: i + 1,
            tituloDia: `Dia ${i + 1}: Caminhando em Oração`,
            conteudoEstudo: 'Insira aqui suas reflexões, anotações e versículos para este dia...',
            midia: '',
            tipoMidia: 'imagem',
            concluido: false
          }))
        }
      ];
      setPlanos(planoExemplo);
      localStorage.setItem(`planos_estudo_${usuarioLogado.username}`, JSON.stringify(planoExemplo));
    }
  }, [usuarioLogado.username]);

  const salvarPlanosStorage = (novosPlanos) => {
    setPlanos(novosPlanos);
    localStorage.setItem(`planos_estudo_${usuarioLogado.username}`, JSON.stringify(novosPlanos));
  };

  const criarPlanoEstudo = (e) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !novaDescricao.trim()) return;

    const diasArray = Array.from({ length: Number(totalDias) }, (_, i) => ({
      dia: i + 1,
      tituloDia: `Dia ${i + 1}: Jornada de Crescimento`,
      conteudoEstudo: '',
      midia: '',
      tipoMidia: 'imagem',
      concluido: false
    }));

    const novoPlanoObj = {
      id: Date.now(),
      criador: usuarioLogado.username,
      titulo: novoTitulo.trim(),
      descricao: novaDescricao.trim(),
      dias: diasArray
    };

    const atualizados = [novoPlanoObj, ...planos];
    salvarPlanosStorage(atualizados);

    setNovoTitulo('');
    setNovaDescricao('');
    setTotalDias(7);
    setModalCriarAberto(false);
  };

  const processarArquivo = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  };

  const salvarEdicaoDiaAtual = () => {
    if (!planoSelecionado) return;

    const diasAtualizados = [...planoSelecionado.dias];
    diasAtualizados[diaAtivoIndex] = {
      ...diasAtualizados[diaAtivoIndex],
      conteudoEstudo: textoEstudoDia,
      midia: midiaDiaUrl,
      tipoMidia: tipoMidiaDia
    };

    const planoAtualizado = { ...planoSelecionado, dias: diasAtualizados };
    setPlanoSelecionado(planoAtualizado);

    const novosPlanos = planos.map(p => p.id === planoAtualizado.id ? planoAtualizado : p);
    salvarPlanosStorage(novosPlanos);
    alert('Estudo do dia salvo com sucesso! 🚀');
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
    setPlanoSelecionado(planoAtualizado);

    const novosPlanos = planos.map(p => p.id === planoAtualizado.id ? planoAtualizado : p);
    salvarPlanosStorage(novosPlanos);
  };

  const calcularProgresso = (dias) => {
    if (!dias || dias.length === 0) return 0;
    const concluidos = dias.filter(d => d.concluido).length;
    return Math.round((concluidos / dias.length) * 100);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-4 py-8 space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Planos de Estudo Profissionais <span className="text-blue-500">📖</span>
          </h2>
          <p className="text-xs opacity-70 mt-1">Gerencie jornadas diárias com anotações, versículos e anexos multimídia.</p>
        </div>

        <button 
          onClick={() => setModalCriarAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2"
        >
          ✨ Criar Novo Plano
        </button>
      </div>

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
                <label className="text-xs font-bold opacity-70 block mb-1">Descrição:</label>
                <textarea 
                  rows="3"
                  placeholder="Objetivo do plano..." 
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  required
                  className={`w-full text-xs rounded-xl px-3.5 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold opacity-70 block mb-1">Duração (Dias):</label>
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
                Criar Plano com {totalDias} Dias 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Visualização de um Plano Específico (Com Editor por Dia) */}
      {planoSelecionado ? (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <button onClick={() => setPlanoSelecionado(null)} className="text-xs font-bold text-blue-500 hover:underline mb-1 inline-block">
                  ← Voltar para todos os planos
                </button>
                <h3 className="text-xl font-black">{planoSelecionado.titulo}</h3>
                <p className="text-xs opacity-75">{planoSelecionado.descricao}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Progresso Geral</span>
                <span className="block text-2xl font-black">{calcularProgresso(planoSelecionado.dias)}%</span>
              </div>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500" style={{ width: `${calcularProgresso(planoSelecionado.dias)}%` }}></div>
            </div>

            {/* Abas dos Dias */}
            <div className="flex gap-2 overflow-x-auto pb-2 pt-2">
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
                        : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Dia {d.dia}</span>
                  {d.concluido && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Editor do Dia Selecionado */}
          {(() => {
            const diaAtual = planoSelecionado.dias[diaAtivoIndex];
            return (
              <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center border-b pb-4 border-slate-800">
                  <div>
                    <h4 className="text-lg font-extrabold text-blue-400">Estudo do Dia {diaAtual.dia}</h4>
                    <p className="text-xs opacity-60">Escreva suas anotações, insira versículos e adicione mídias de apoio.</p>
                  </div>

                  <button 
                    onClick={() => alternarConclusaoDia(diaAtual.dia)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      diaAtual.concluido 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {diaAtual.concluido ? '✓ Dia Concluído' : 'Marcar como Concluído'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold opacity-70 block mb-2">Anotações, Reflexões e Versículos do Dia {diaAtual.dia}:</label>
                    <textarea 
                      rows="6"
                      value={textoEstudoDia}
                      onChange={(e) => setTextoEstudoDia(e.target.value)}
                      placeholder="Digite suas reflexões espirituais, orações ou versículos meditados hoje..."
                      className={`w-full text-xs sm:text-sm rounded-2xl p-4 border leading-relaxed ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                    ></textarea>
                  </div>

                  {/* Seção de Anexar Mídia */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-70 block">Mídia de Apoio (Foto ou Vídeo):</label>
                    <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center space-y-3">
                      {enviandoMidia ? (
                        <p className="text-xs font-bold text-blue-500 animate-pulse">Carregando arquivo...</p>
                      ) : midiaDiaUrl ? (
                        <div className="space-y-2">
                          {tipoMidiaDia === 'video' ? (
                            <video src={midiaDiaUrl} controls className="w-full h-48 object-cover rounded-xl" />
                          ) : (
                            <img src={midiaDiaUrl} alt="Mídia Anexada" className="w-full h-48 object-cover rounded-xl" />
                          )}
                          <button onClick={() => setMidiaDiaUrl('')} className="text-xs text-red-400 font-bold hover:underline">Remover Mídia</button>
                        </div>
                      ) : (
                        <label className="inline-block bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition border border-slate-700">
                          📁 Anexar Imagem ou Vídeo para este Dia
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
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={salvarEdicaoDiaAtual}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
                  >
                    Salvar Alterações do Dia {diaAtual.dia} 💾
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Lista de Planos */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planos.length === 0 ? (
            <div className={`col-span-2 p-12 text-center rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <p className="text-xs opacity-60">Nenhum plano cadastrado.</p>
            </div>
          ) : (
            planos.map(plano => {
              const progresso = calcularProgresso(plano.dias);
              return (
                <div 
                  key={plano.id}
                  onClick={() => {
                    setPlanoSelecionado(plano);
                    setDiaAtivoIndex(0);
                    setTextoEstudoDia(plano.dias[0]?.conteudoEstudo || '');
                    setMidiaDiaUrl(plano.dias[0]?.midia || '');
                    setTipoMidiaDia(plano.dias[0]?.tipoMidia || 'imagem');
                  }}
                  className={`p-6 rounded-3xl border shadow-md space-y-4 cursor-pointer transition hover:scale-[1.01] ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full">
                        {plano.dias.length} Dias
                      </span>
                      <h3 className="text-base font-extrabold mt-2">{plano.titulo}</h3>
                    </div>
                    <span className="text-sm font-black text-emerald-500">{progresso}%</span>
                  </div>

                  <p className="text-xs opacity-75 line-clamp-2">{plano.descricao}</p>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progresso}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] opacity-60 pt-2 border-t border-slate-800">
                    <span>Criado por @{plano.criador}</span>
                    <span className="font-bold text-blue-400">Abrir Plano de Estudos →</span>
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