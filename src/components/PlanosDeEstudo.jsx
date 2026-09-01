import React, { useState, useEffect, useRef } from 'react';
import { BancoDeDados } from '../services/database';

export default function PlanosDeEstudo({ usuarioLogado, darkMode }) {
  const [planos, setPlanos] = useState([]);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaCapaUrl, setNovaCapaUrl] = useState('');
  const [totalDias, setTotalDias] = useState(7);

  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [modoLeitura, setModoLeitura] = useState(false);
  const [diaAtivoIndex, setDiaAtivoIndex] = useState(0);

  const [textoEstudoDia, setTextoEstudoDia] = useState('');
  const [perguntaPratica, setPerguntaPratica] = useState('');
  const [midiaDiaUrl, setMidiaDiaUrl] = useState('');
  const [tipoMidiaDia, setTipoMidiaDia] = useState('imagem');
  const [enviandoMidia, setEnviandoMidia] = useState(false);

  const [novoComentarioDia, setNovoComentarioDia] = useState('');
  const [comentariosDias, setComentariosDias] = useState({});
  const [perfisUsuarios, setPerfisUsuarios] = useState({});

  const [mostrarModalConquista, setMostrarModalConquista] = useState(false);
  const [abaAtivaFiltro, setAbaAtivaFiltro] = useState('todos');
  const editorRef = useRef(null);

  useEffect(() => {
    async function carregarDadosGlobais() {
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
            titulo: 'Como se aproximar de Deus nos dias de hoje',
            descricao: 'Um devocional profundo de 7 dias para silenciar o barulho do mundo e cultivar uma intimidade real com o Criador.',
            capa: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
            dias: Array.from({ length: 7 }, (_, i) => ({
              dia: i + 1,
              tituloDia: `Dia ${i + 1}: Jornada Espiritual`,
              conteudoEstudo: `<p>Reflexão guiada para o dia ${i + 1}: Busquem ao Senhor e meditem em Sua palavra para guiar os seus passos em meio às correrias modernas.</p>`,
              perguntaPratica: `Qual distração você pode remover hoje para passar 10 minutos em silêncio com Deus?`,
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

      // Carregar comentários públicos globais
      let comentariosSalvos = {};
      if (typeof BancoDeDados.getComentariosPlanos === 'function') {
        comentariosSalvos = await BancoDeDados.getComentariosPlanos();
      } else {
        const localComentarios = localStorage.getItem('rede_comentarios_planos_global');
        comentariosSalvos = localComentarios ? JSON.parse(localComentarios) : {};
      }
      setComentariosDias(comentariosSalvos || {});

      // Carregar avatares dos perfis da comunidade
      let perfis = [];
      if (typeof BancoDeDados.getPerfisCadastrados === 'function') {
        perfis = await BancoDeDados.getPerfisCadastrados();
      } else {
        const localPerfis = localStorage.getItem('perfis_cadastrados_comunidade');
        perfis = localPerfis ? JSON.parse(localPerfis) : [];
      }
      const mapaPerfis = {};
      perfis.forEach(p => {
        mapaPerfis[p.username] = p.foto;
      });
      setPerfisUsuarios(mapaPerfis);
    }
    carregarDadosGlobais();
  }, [usuarioLogado.username]);

  const salvarPlanosGlobais = (novosPlanos) => {
    setPlanos(novosPlanos);
    if (typeof BancoDeDados.salvarPlanosEstudo === 'function') {
      BancoDeDados.salvarPlanosEstudo(novosPlanos);
    } else {
      localStorage.setItem('rede_planos_estudo_global', JSON.stringify(novosPlanos));
    }
  };

  const salvarComentariosGlobais = (novosComentarios) => {
    setComentariosDias(novosComentarios);
    if (typeof BancoDeDados.salvarComentariosPlanos === 'function') {
      BancoDeDados.salvarComentariosPlanos(novosComentarios);
    } else {
      localStorage.setItem('rede_comentarios_planos_global', JSON.stringify(novosComentarios));
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
      capaFinal = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80';
    }

    const diasArray = Array.from({ length: Number(totalDias) }, (_, i) => ({
      dia: i + 1,
      tituloDia: `Dia ${i + 1}: Caminho de Fé`,
      conteudoEstudo: `<p>Escreva aqui o conteúdo de estudo oficial para o dia ${i + 1}...</p>`,
      perguntaPratica: `Como você aplicará os ensinamentos deste dia na sua rotina?`,
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

  const aplicarFormatacao = (comando, valor = null) => {
    document.execCommand(comando, false, valor);
    if (editorRef.current) {
      setTextoEstudoDia(editorRef.current.innerHTML);
    }
  };

  const salvarEdicaoDiaAtual = () => {
    if (!planoSelecionado) return;

    if (planoSelecionado.criador !== usuarioLogado.username) {
      alert('Apenas o criador deste plano pode alterar o conteúdo oficial.');
      return;
    }

    const conteudoFinal = editorRef.current ? editorRef.current.innerHTML : textoEstudoDia;

    const diasAtualizados = [...planoSelecionado.dias];
    diasAtualizados[diaAtivoIndex] = {
      ...diasAtualizados[diaAtivoIndex],
      conteudoEstudo: conteudoFinal,
      perguntaPratica: perguntaPratica,
      midia: midiaDiaUrl,
      tipoMidia: tipoMidiaDia
    };

    const planoAtualizado = { ...planoSelecionado, dias: diasAtualizados };
    setPlanosSelecionadoComAtualizacao(planoAtualizado);
    alert('Alterações salvas com sucesso! 🚀');
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

    const progressoAntigo = calcularProgresso(planoSelecionado.dias);
    const planoAtualizado = { ...planoSelecionado, dias: diasAtualizados };
    const progressoNovo = calcularProgresso(planoAtualizado.dias);

    setPlanosSelecionadoComAtualizacao(planoAtualizado);

    if (progressoAntigo < 100 && progressoNovo === 100) {
      setMostrarModalConquista(true);
    }
  };

  const adicionarComentarioDia = (e, planoId, diaNum) => {
    e.preventDefault();
    if (!novoComentarioDia.trim()) return;

    const chave = `${planoId}_dia_${diaNum}`;
    const listaAtual = comentariosDias[chave] || [];
    const novoComentarioObj = {
      id: Date.now(),
      username: usuarioLogado.username,
      avatar: usuarioLogado.foto || perfisUsuarios[usuarioLogado.username] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
      texto: novoComentarioDia.trim(),
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const atualizados = { ...comentariosDias, [chave]: [...listaAtual, novoComentarioObj] };
    salvarComentariosGlobais(atualizados);
    setNovoComentarioDia('');
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
      
      {mostrarModalConquista && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 shadow-2xl text-white text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
              🏆
            </div>
            <h3 className="text-xl font-black text-emerald-400">Jornada Concluída!</h3>
            <p className="text-xs opacity-80 leading-relaxed">
              Parabéns, @{usuarioLogado.username}! Você concluiu 100% do plano de estudo com dedicação e constância na Palavra. Sua fé foi fortalecida! ✨
            </p>
            <button 
              onClick={() => setMostrarModalConquista(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition"
            >
              Continuar Caminhada 🚀
            </button>
          </div>
        </div>
      )}

      {!planoSelecionado && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-700/20">
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

      {!planoSelecionado && (
        <div className="flex gap-2 bg-slate-900/10 p-1.5 rounded-2xl border border-slate-800/20 w-fit">
          <button 
            onClick={() => setAbaAtivaFiltro('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaAtivaFiltro === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            🌟 Sugestões
          </button>
          <button 
            onClick={() => setAbaAtivaFiltro('meus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${abaAtivaFiltro === 'meus' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            👤 Meus Planos
          </button>
        </div>
      )}

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
                  placeholder="Ex: Como se aproximar de Deus" 
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

      {planoSelecionado && !modoLeitura && (
        <div className="space-y-6">
          <button onClick={() => setPlanoSelecionado(null)} className="text-xs font-bold text-blue-500 hover:underline inline-block">
            ← Voltar para todos os planos
          </button>

          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{planoSelecionado.titulo}</h1>
            
            <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-xl border border-slate-800/40 relative">
              <img src={planoSelecionado.capa} alt={planoSelecionado.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                  <img 
                    src={perfisUsuarios[planoSelecionado.criador] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
                    alt="Criador" 
                    className="w-5 h-5 rounded-full object-cover" 
                  />
                  <span className="text-xs text-white font-bold">Criado por @{planoSelecionado.criador}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-transparent border border-slate-800/40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-slate-800/20 text-slate-300 px-3 py-1.5 rounded-xl">
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

            <div className="p-6 rounded-3xl bg-transparent border border-slate-800/30 space-y-4 leading-relaxed text-sm opacity-90">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Sobre o Plano</h3>
              <p>{planoSelecionado.descricao}</p>
            </div>
          </div>
        </div>
      )}

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

          <div className="flex gap-2 overflow-x-auto pb-2">
            {planoSelecionado.dias.map((d, index) => (
              <button
                key={d.dia}
                onClick={() => {
                  setDiaAtivoIndex(index);
                  const conteudo = d.conteudoEstudo || '';
                  setTextoEstudoDia(conteudo);
                  if (editorRef.current) editorRef.current.innerHTML = conteudo;
                  setPerguntaPratica(d.perguntaPratica || '');
                  setMidiaDiaUrl(d.midia || '');
                  setTipoMidiaDia(d.tipoMidia || 'imagem');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0 transition border ${
                  diaAtivoIndex === index 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                    : d.concluido 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : 'bg-transparent border-slate-800/50 text-slate-400 hover:text-white'
                }`}
              >
                <span>Dia {d.dia}</span>
                {d.concluido && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
              </button>
            ))}
          </div>

          {(() => {
            const diaAtual = planoSelecionado.dias[diaAtivoIndex];
            const chaveComentario = `${planoSelecionado.id}_dia_${diaAtual.dia}`;
            const listaComentarios = comentariosDias[chaveComentario] || [];

            return (
              <div className="p-2 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-slate-800/30">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Dia {diaAtual.dia} de {planoSelecionado.dias.length}</span>
                    <h3 className="text-xl font-black mt-1">{planoSelecionado.titulo}</h3>
                  </div>

                  <button 
                    onClick={() => alternarConclusaoDia(diaAtual.dia)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                      diaAtual.concluido 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-slate-800/30 text-slate-300 hover:bg-slate-700 border border-slate-700/40'
                    }`}
                  >
                    {diaAtual.concluido ? '✓ Dia Concluído' : 'Marcar como Concluído'}
                  </button>
                </div>

                <div className="space-y-6">
                  {souOCriador ? (
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-blue-400 block">Editor de Conteúdo Profissional:</label>
                      
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
                        <button type="button" onClick={() => aplicarFormatacao('bold')} className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 rounded text-white" title="Negrito"><b>B</b></button>
                        <button type="button" onClick={() => aplicarFormatacao('italic')} className="px-2.5 py-1 text-xs italic bg-slate-800 hover:bg-slate-700 rounded text-white" title="Itálico"><i>I</i></button>
                        <button type="button" onClick={() => aplicarFormatacao('underline')} className="px-2.5 py-1 text-xs underline bg-slate-800 hover:bg-slate-700 rounded text-white" title="Sublinhado"><u>U</u></button>
                        <span className="w-px h-5 bg-slate-700 self-center mx-1"></span>
                        <button type="button" onClick={() => aplicarFormatacao('fontSize', '4')} className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-white" title="Título">Título</button>
                        <button type="button" onClick={() => aplicarFormatacao('fontSize', '3')} className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-white" title="Normal">Normal</button>
                      </div>

                      <div 
                        ref={editorRef}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onInput={(e) => setTextoEstudoDia(e.currentTarget.innerHTML)}
                        className="w-full min-h-[200px] text-sm sm:text-base rounded-2xl p-4 border border-slate-800/50 bg-transparent focus:outline-none focus:border-blue-500 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: diaAtual.conteudoEstudo || '' }}
                      ></div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-amber-400 block">Desafio ou Pergunta Prática ("Pratique Hoje"):</label>
                        <input 
                          type="text"
                          value={perguntaPratica}
                          onChange={(e) => setPerguntaPratica(e.target.value)}
                          placeholder="Ex: Como você pode demonstrar amor hoje?"
                          className="w-full text-xs rounded-xl px-3 py-2 border border-slate-800 bg-transparent text-inherit"
                        />
                      </div>

                      <button 
                        onClick={salvarEdicaoDiaAtual}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md"
                      >
                        Salvar Alterações Oficiais 💾
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div 
                        className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed opacity-95"
                        dangerouslySetInnerHTML={{ __html: diaAtual.conteudoEstudo || "Nenhum conteúdo publicado para este dia ainda." }}
                      ></div>

                      {diaAtual.perguntaPratica && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                          <h5 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">🎯 Pratique Hoje</h5>
                          <p className="text-xs sm:text-sm">{diaAtual.perguntaPratica}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {midiaDiaUrl && (
                    <div className="pt-4">
                      {tipoMidiaDia === 'video' ? (
                        <video src={midiaDiaUrl} controls className="w-full max-h-96 object-contain rounded-2xl border border-slate-800/40" />
                      ) : (
                        <img src={midiaDiaUrl} alt="Mídia do Estudo" className="w-full max-h-96 object-contain rounded-2xl border border-slate-800/40" />
                      )}
                    </div>
                  )}

                  {souOCriador && (
                    <div className="pt-4 border-t border-slate-800/30 space-y-2">
                      <label className="text-xs font-bold text-blue-400 block">Anexar Imagem ou Vídeo (Upload Direto):</label>
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
                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                      {enviandoMidia && <p className="text-xs text-blue-400 animate-pulse">Carregando arquivo...</p>}
                    </div>
                  )}

                  {/* SEÇÃO DE COMENTÁRIOS PÚBLICOS DA COMUNIDADE COM FOTO DE PERFIL */}
                  <div className="pt-6 border-t border-slate-800/40 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      💬 Reflexões e Comentários da Comunidade ({listaComentarios.length})
                    </h4>

                    <form onSubmit={(e) => adicionarComentarioDia(e, planoSelecionado.id, diaAtual.dia)} className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Deixe sua reflexão ou encorajamento neste dia..."
                        value={novoComentarioDia}
                        onChange={(e) => setNovoComentarioDia(e.target.value)}
                        className="w-full text-xs rounded-xl px-3.5 py-2.5 border border-slate-800/60 bg-transparent text-inherit focus:outline-none focus:border-blue-500"
                      />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex-shrink-0">
                        Comentar
                      </button>
                    </form>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {listaComentarios.length === 0 ? (
                        <p className="text-xs opacity-50 text-center py-4">Nenhum comentário neste dia ainda. Seja o primeiro a compartilhar!</p>
                      ) : (
                        listaComentarios.map((c) => (
                          <div 
                            key={c.id} 
                            className="p-3 rounded-2xl bg-transparent border border-slate-800/30 text-xs space-y-2 shadow-xs"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={c.avatar || perfisUsuarios[c.username] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
                                  alt="Avatar" 
                                  className="w-6 h-6 rounded-full object-cover" 
                                />
                                <span className="font-bold text-blue-500">@{c.username}</span>
                              </div>
                              <span className="text-[10px] opacity-50">{c.horario}</span>
                            </div>
                            <p className="opacity-90 leading-relaxed pl-8 text-inherit">{c.texto}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* LISTA DE PLANOS */}
      {!planoSelecionado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planosFiltrados.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-3xl border bg-transparent border-slate-800/20">
              <p className="text-xs opacity-60">Nenhum plano encontrado.</p>
            </div>
          ) : (
            planosFiltrados.map(plano => {
              const progresso = calcularProgresso(plano.dias);
              const avatarCriador = perfisUsuarios[plano.criador] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
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
                  className="rounded-3xl border bg-transparent border-slate-800/40 overflow-hidden cursor-pointer transition hover:scale-[1.01] hover:border-blue-500/50 shadow-sm flex flex-col"
                >
                  <div className="h-40 w-full relative">
                    <img src={plano.capa} alt={plano.titulo} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <span className="absolute bottom-3 left-3 text-[10px] bg-blue-600 text-white font-bold px-2.5 py-1 rounded-full">
                      {plano.dias.length} Dias
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <img src={avatarCriador} alt="Avatar" className="w-4 h-4 rounded-full object-cover" />
                          <span className="text-[10px] text-blue-400 font-bold">@{plano.criador}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-400">{progresso}%</span>
                      </div>
                      <h3 className="text-base font-extrabold">{plano.titulo}</h3>
                      <p className="text-xs opacity-75 line-clamp-2 mt-1">{plano.descricao}</p>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800/30 rounded-full overflow-hidden mt-2">
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