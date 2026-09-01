import React, { useState, useEffect } from 'react';
import { BancoDeDados } from '../services/database';

export default function PlanosDeEstudo({ usuarioLogado, darkMode }) {
  const [planos, setPlanos] = useState([]);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  
  // Estados para criar um novo plano
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [totalDias, setTotalDias] = useState(7); // Padrão 7 dias

  const [planoSelecionado, setPlanoSelecionado] = useState(null);

  useEffect(() => {
    async function carregarPlanos() {
      // Se houver suporte a planos no BancoDeDados, carregamos de lá ou do localStorage como fallback
      const dadosSalvos = localStorage.getItem(`planos_estudo_${usuarioLogado.username}`);
      if (dadosSalvos) {
        setPlanos(JSON.parse(dadosSalvos));
      } else {
        // Plano inicial de exemplo sugerido
        const planoExemplo = [
          {
            id: 1,
            criador: usuarioLogado.username,
            titulo: 'Fortalecendo a Fé em 7 Dias',
            descricao: 'Um plano prático para renovar suas forças espirituais diariamente.',
            dias: Array.from({ length: 7 }, (_, i) => ({
              dia: i + 1,
              tituloDia: `Dia ${i + 1}: Reflexão e Oração`,
              concluido: false
            }))
          }
        ];
        setPlanos(planoExemplo);
        localStorage.setItem(`planos_estudo_${usuarioLogado.username}`, JSON.stringify(planoExemplo));
      }
    }
    carregarPlanos();
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
      tituloDia: `Dia ${i + 1}: Jornada Espiritual`,
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

  const alternarDiaConcluido = (planoId, diaNumero) => {
    const atualizados = planos.map(plano => {
      if (plano.id === planoId) {
        const novosDias = plano.dias.map(d => {
          if (d.dia === diaNumero) {
            return { ...d, concluido: !d.concluido };
          }
          return d;
        });
        return { ...plano, dias: novosDias };
      }
      return plano;
    });

    salvarPlanosStorage(atualizados);
    if (planoSelecionado && planoSelecionado.id === planoId) {
      setPlanoSelecionado(atualizados.find(p => p.id === planoId));
    }
  };

  const calcularProgresso = (dias) => {
    if (!dias || dias.length === 0) return 0;
    const concluidos = dias.filter(d => d.concluido).length;
    return Math.round((concluidos / dias.length) * 100);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-4 py-8 space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Planos de Estudo Diário <span className="text-blue-500">📖</span>
          </h2>
          <p className="text-xs opacity-70 mt-1">Crie jornadas diárias, acompanhe seu progresso e fortaleça seu aprendizado espiritual.</p>
        </div>

        <button 
          onClick={() => setModalCriarAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2"
        >
          ✨ Criar Novo Plano
        </button>
      </div>

      {/* Modal para Criar Novo Plano */}
      {modalCriarAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className={`max-w-md w-full p-6 rounded-3xl shadow-2xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-700">
              <h3 className="font-extrabold text-sm">✨ Criar Plano de Estudo Funcional</h3>
              <button onClick={() => setModalCriarAberto(false)} className="text-sm font-bold opacity-70 hover:opacity-100">✕</button>
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
                <label className="text-xs font-bold opacity-70 block mb-1">Descrição / Objetivo:</label>
                <textarea 
                  rows="3"
                  placeholder="Descreva o propósito deste plano de estudo..." 
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
                  <option value={3}>3 Dias (Rápido)</option>
                  <option value={7}>7 Dias (1 Semana)</option>
                  <option value={14}>14 Dias (2 Semanas)</option>
                  <option value={21}>21 Dias (Hábito)</option>
                  <option value={30}>30 Dias (1 Mês)</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
              >
                Salvar e Iniciar Plano 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Visualizador de Detalhes do Plano Selecionado */}
      {planoSelecionado ? (
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <button 
                onClick={() => setPlanoSelecionado(null)}
                className="text-xs font-bold text-blue-500 hover:underline mb-2 inline-block"
              >
                ← Voltar para todos os planos
              </button>
              <h3 className="text-xl font-black">{planoSelecionado.titulo}</h3>
              <p className="text-xs opacity-75">{planoSelecionado.descricao}</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Progresso Geral</span>
              <span className="block text-xl font-black">{calcularProgresso(planoSelecionado.dias)}%</span>
            </div>
          </div>

          {/* Barra de Progresso Bonita */}
          <div className="w-full h-3 bg-slate-700/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${calcularProgresso(planoSelecionado.dias)}%` }}
            ></div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider opacity-60">Checklist Diário</h4>
            <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {planoSelecionado.dias.map((d) => (
                <div 
                  key={d.dia}
                  onClick={() => alternarDiaConcluido(planoSelecionado.id, d.dia)}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    d.concluido 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : darkMode ? 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${d.concluido ? 'bg-emerald-500 text-white' : 'border border-slate-500 text-slate-400'}`}>
                      {d.concluido ? '✓' : d.dia}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${d.concluido ? 'line-through opacity-80' : ''}`}>{d.tituloDia}</p>
                      <span className="text-[10px] opacity-60">Dia {d.dia} da jornada</span>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-xl ${d.concluido ? 'bg-emerald-500 text-white' : 'bg-slate-700/20 opacity-60'}`}>
                    {d.concluido ? 'Concluído' : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Lista de Planos Ativos */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planos.length === 0 ? (
            <div className={`col-span-2 p-12 text-center rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <p className="text-xs opacity-60">Nenhum plano de estudo criado ainda. Comece criando o seu primeiro!</p>
            </div>
          ) : (
            planos.map(plano => {
              const progresso = calcularProgresso(plano.dias);
              return (
                <div 
                  key={plano.id}
                  onClick={() => setPlanoSelecionado(plano)}
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

                  <div className="w-full h-2 bg-slate-700/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progresso}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] opacity-60 pt-2 border-t border-slate-700/20">
                    <span>Criado por @{plano.criador}</span>
                    <span className="font-bold text-blue-400">Ver Detalhes →</span>
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