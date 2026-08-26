import React, { useState } from 'react';
import { BancoDeDados } from '../services/database';

export default function Devocionais({ usuarioLogado, darkMode }) {
  const [devocionais, setDevocionais] = useState(() => {
    const salvos = localStorage.getItem(`devocionais_${usuarioLogado.username}`);
    return salvos ? JSON.parse(salvos) : [
      {
        id: 1,
        titulo: 'A Esperança que Não Decepciona',
        texto: 'Mesmo nos momentos de incerteza, a fé nos sustenta e guia os nossos passos para dias melhores.',
        privado: true,
        data: 'Hoje'
      }
    ];
  });

  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [privado, setPrivado] = useState(true);

  const salvarDevocional = (e) => {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) return;

    const novo = {
      id: Date.now(),
      titulo: titulo.trim(),
      texto: texto.trim(),
      privado,
      data: new Date().toLocaleDateString()
    };

    const atualizados = [novo, ...devocionais];
    setDevocionais(atualizados);
    localStorage.setItem(`devocionais_${usuarioLogado.username}`, JSON.stringify(atualizados));

    // Se for público, envia automaticamente para o feed da comunidade!
    if (!privado) {
      BancoDeDados.salvarPublicacao({
        id: Date.now(),
        autor: usuarioLogado.nome,
        username: usuarioLogado.username,
        avatar: usuarioLogado.foto,
        tema: `💡 Devocional: ${novo.titulo}`,
        texto: `"${novo.texto}"`,
        imagem: '',
        curtidas: 0,
        comentarios: []
      });
      alert('Devocional publicado publicamente no Feed da Comunidade! 🚀');
    } else {
      alert('Devocional salvo com sucesso (Privado)! 🔒');
    }
    
    setTitulo('');
    setTexto('');
    setPrivado(true);
  };

  const excluirDevocional = (id) => {
    const atualizados = devocionais.filter(d => d.id !== id);
    setDevocionais(atualizados);
    localStorage.setItem(`devocionais_${usuarioLogado.username}`, JSON.stringify(atualizados));
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto w-full">
      <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-md font-bold uppercase tracking-wider opacity-70">Escrever Novo Devocional ✍️</h3>
        <form onSubmit={salvarDevocional} className="space-y-3">
          <input
            type="text"
            placeholder="Título do devocional..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={`w-full text-sm rounded-xl px-3 py-2.5 border font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
          />
          <textarea
            rows="4"
            placeholder="Escreva suas reflexões espirituais..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className={`w-full text-sm rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
          ></textarea>
          
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={privado}
                onChange={(e) => setPrivado(e.target.checked)}
                className="w-4 h-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
              />
              <span>🔒 Manter trancado (Apenas para mim / Privado)</span>
            </label>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md"
            >
              Salvar Devocional 📖
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-bold opacity-70">Seus Devocionais Salvos 📚</h3>
        {devocionais.length === 0 ? (
          <p className="text-sm opacity-60">Nenhum devocional cadastrado ainda.</p>
        ) : (
          devocionais.map((dev) => (
            <div key={dev.id} className={`p-6 rounded-2xl border shadow-xs space-y-2 relative ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold">{dev.titulo}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${dev.privado ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {dev.privado ? '🔒 Privado' : '🌐 Público'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] opacity-50">{dev.data}</span>
                  <button
                    onClick={() => excluirDevocional(dev.id)}
                    className="text-xs text-red-400 hover:underline font-semibold"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed opacity-90">{dev.texto}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}