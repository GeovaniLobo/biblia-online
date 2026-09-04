const SUPABASE_URL = 'https://apodufxahgxlghmlzagq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vDRu0b_QIKsCCqt7ZgPwdg_G0QTJ8Eo';

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

export const BancoDeDados = {
  getUsuarioLogado: () => {
    const salvo = localStorage.getItem('usuario_logado_supa');
    return salvo ? JSON.parse(salvo) : null;
  },

  fazerLogin: (usuario) => {
    localStorage.setItem('usuario_logado_supa', JSON.stringify(usuario));
  },

  fazerLogout: () => {
    localStorage.removeItem('usuario_logado_supa');
  },

  getPerfisCadastrados: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis?select=*`, { method: 'GET', headers });
      if (!response.ok) return [];
      const data = await response.json();
      return data || [];
    } catch (err) { return []; }
  },

  cadastrarPerfil: async (novoPerfil) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis`, {
      method: 'POST',
      headers,
      body: JSON.stringify(novoPerfil)
    });
    if (!response.ok) throw new Error('Erro ao cadastrar perfil.');
    return await response.json();
  },

  salvarNovoPerfilNaRede: async (perfil) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/perfis`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(perfil)
      });
    } catch (e) {}
  },

  atualizarPerfil: async (username, novosDados) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${username}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(novosDados)
    });
    if (!response.ok) throw new Error('Erro ao atualizar perfil.');
    return await response.json();
  },

  // --- UPLOAD DE MÍDIA PARA O SUPABASE STORAGE ---
  uploadMidiaStory: async (file) => {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/stories-midia/${fileName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': file.type || 'application/octet-stream',
          'X-Upsert': 'true'
        },
        body: file
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar arquivo para o Storage.');
      }

      return `${SUPABASE_URL}/storage/v1/object/public/stories-midia/${fileName}`;
    } catch (err) {
      console.error("Erro no upload:", err);
      return null;
    }
  },

  // --- STORIES ---
  getStories: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      const data = await response.json();
      
      if (!data) return [];

      // Filtra automaticamente apenas os stories postados nas últimas 24 horas (24 * 60 * 60 * 1000 ms)
      const agora = Date.now();
      const limite24h = 24 * 60 * 60 * 1000;
      
      const storiesValidos = data.filter(s => {
        if (!s.id) return false;
        // O id do story é gerado com Date.now() no momento da criação
        return (agora - Number(s.id)) <= limite24h;
      });

      return storiesValidos;
    } catch (err) { 
      return []; 
    }
  },

  registrarVisualizacaoStory: async (storyId, dadosVisualizador) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${storyId}&select=visualizacoes`, { method: 'GET', headers });
      if (!res.ok) return await BancoDeDados.getStories();
      
      const data = await res.json();
      let vistas = (data && data[0] && data[0].visualizacoes) || [];
      
      const jaViu = vistas.some(v => v.username === dadosVisualizador.username);
      
      if (!jaViu) {
        vistas.push(dadosVisualizador);
        
        await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${Number(storyId)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ visualizacoes: vistas })
        });
      }
      return await BancoDeDados.getStories();
    } catch (err) {
      console.error("Erro ao registrar visualização:", err);
      return await BancoDeDados.getStories();
    }
  },

  curtirStory: async (storyId, usernameUsuario) => {
    try {
      const stories = await BancoDeDados.getStories();
      const s = stories.find(x => x.id === storyId);
      if (s) {
        let curtidas = s.curtidas || [];
        if (!Array.isArray(curtidas)) curtidas = [];

        const jaCurtiu = curtidas.includes(usernameUsuario);

        if (jaCurtiu) {
          curtidas = curtidas.filter(u => u !== usernameUsuario);
        } else {
          curtidas.push(usernameUsuario);
          
          if (s.username !== usernameUsuario) {
            await BancoDeDados.adicionarNotificacao(
              s.username,
              `@${usernameUsuario} curtiu seu story! ❤️`,
              'curtida'
            );
          }
        }

        await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${storyId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ curtidas })
        });
      }
      return await BancoDeDados.getStories();
    } catch (err) {
      console.error("Erro ao curtir story:", err);
      return await BancoDeDados.getStories();
    }
  },

  excluirStory: async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stories?id=eq.${id}`, { method: 'DELETE', headers });
      return await BancoDeDados.getStories();
    } catch (err) { return []; }
  },

  // --- PUBLICAÇÕES ---
  getPublicacoes: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { return []; }
  },

  salvarPublicacao: async (pub) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pub)
      });
      if (!response.ok) return await BancoDeDados.getPublicacoes();
      return await BancoDeDados.getPublicacoes();
    } catch (err) { return []; }
  },

  excluirPublicacao: async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, { method: 'DELETE', headers });
      return await BancoDeDados.getPublicacoes();
    } catch (err) { return []; }
  },

  atualizarPublicacao: async (id, texto, tema) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ texto, tema })
      });
    } catch (e) {}
    return await BancoDeDados.getPublicacoes();
  },

  reagirPublicacao: async (id, tipoReacao, usernameUsuario) => {
    try {
      const pubs = await BancoDeDados.getPublicacoes();
      const p = pubs.find(x => x.id === id);
      if (p) {
        // Padronizado para usar 'aleluia' consistentemente
        let reacoes = p.reacoes || { amem: [], aleluia: [], amor: [] };
        if (!reacoes.amem) reacoes = { amem: [], aleluia: [], amor: [] };

        Object.keys(reacoes).forEach(tipo => {
          reacoes[tipo] = (reacoes[tipo] || []).filter(u => u !== usernameUsuario);
        });

        if (reacoes[tipoReacao]) {
          reacoes[tipoReacao].push(usernameUsuario);
        }
        
        const totalReacoes = Object.values(reacoes).reduce((acc, curr) => acc + curr.length, 0);

        await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ reacoes, curtidas: totalReacoes })
        });
      }
    } catch (e) {
      console.error("Erro ao reagir na publicação:", e);
    }
    return await BancoDeDados.getPublicacoes();
  },

  reagirComentarioPub: async (publicacaoId, comentarioId, tipoReacao, username) => {
    try {
      const pubs = await BancoDeDados.getPublicacoes();
      const p = pubs.find(x => x.id === publicacaoId);
      if (p && p.comentarios) {
        const novosComentarios = p.comentarios.map(c => {
          if (c.id === comentarioId) {
            // Padronizado para usar 'aleluia' consistentemente
            let reacoes = c.reacoes || { amem: [], aleluia: [], amor: [] };
            if (!reacoes.amem) reacoes = { amem: [], aleluia: [], amor: [] };

            Object.keys(reacoes).forEach(tipo => {
              reacoes[tipo] = (reacoes[tipo] || []).filter(u => u !== username);
            });

            if (reacoes[tipoReacao]) {
              reacoes[tipoReacao].push(username);
            }
            return { ...c, reacoes };
          }
          return c;
        });

        await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${publicacaoId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ comentarios: novosComentarios })
        });
      }
    } catch (e) {
      console.error("Erro ao reagir no comentário:", e);
    }
    return await BancoDeDados.getPublicacoes();
  },

  adicionarComentarioPub: async (id, comentario) => {
    try {
      const pubs = await BancoDeDados.getPublicacoes();
      const p = pubs.find(x => x.id === id);
      if (p) {
        const comentariosAtuais = p.comentarios || [];
        const novosComentarios = [...comentariosAtuais, comentario];
        await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ comentarios: novosComentarios })
        });
      }
    } catch (e) {}
    return await BancoDeDados.getPublicacoes();
  },

  reagirComentarioPub: async (publicacaoId, comentarioId, tipoReacao, username) => {
    try {
      const pubs = await BancoDeDados.getPublicacoes();
      const p = pubs.find(x => x.id === publicacaoId);
      if (p && p.comentarios) {
        const novosComentarios = p.comentarios.map(c => {
          if (c.id === comentarioId) {
            let reacoes = c.reacoes || { amem: [], gloria: [], amor: [] };
            if (!reacoes.amem) reacoes = { amem: [], gloria: [], amor: [] };

            Object.keys(reacoes).forEach(tipo => {
              reacoes[tipo] = (reacoes[tipo] || []).filter(u => u !== username);
            });

            reacoes[tipoReacao].push(username);
            return { ...c, reacoes };
          }
          return c;
        });

        await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${publicacaoId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ comentarios: novosComentarios })
        });
      }
    } catch (e) {}
    return await BancoDeDados.getPublicacoes();
  },

  // --- AMIZADES ---
  enviarPedidoAmizade: async (usernameRemetente, usernameDestinatario) => {
    try {
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const remetente = perfis.find(p => p.username === usernameRemetente);
      const destinatario = perfis.find(p => p.username === usernameDestinatario);
      if (!remetente || !destinatario) return;

      const enviados = remetente.pedidos_enviados || [];
      const recebidos = destinatario.pedidos_recebidos || [];

      if (!enviados.includes(usernameDestinatario)) {
        enviados.push(usernameDestinatario);
        recebidos.push(usernameRemetente);
        await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameRemetente}`, { method: 'PATCH', headers, body: JSON.stringify({ pedidos_enviados: enviados }) });
        await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameDestinatario}`, { method: 'PATCH', headers, body: JSON.stringify({ pedidos_recebidos: recebidos }) });
        await BancoDeDados.adicionarNotificacao(usernameDestinatario, `@${usernameRemetente} enviou um pedido de amizade.`, 'amizade');
      }
    } catch (e) {}
  },

  aceitarPedidoAmizade: async (usernameLogado, usernameRemetente) => {
    try {
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const logado = perfis.find(p => p.username === usernameLogado);
      const remetente = perfis.find(p => p.username === usernameRemetente);

      if (logado && remetente) {
        const novosRecebidos = (logado.pedidos_recebidos || []).filter(u => u !== usernameRemetente);
        const novosEnviados = (remetente.pedidos_enviados || []).filter(u => u !== usernameLogado);

        const novosAmigosLogado = [...(logado.amigos || [])];
        if (!novosAmigosLogado.includes(usernameRemetente)) novosAmigosLogado.push(usernameRemetente);

        const novosAmigosRemetente = [...(remetente.amigos || [])];
        if (!novosAmigosRemetente.includes(usernameLogado)) novosAmigosRemetente.push(usernameLogado);

        await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameLogado}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pedidos_recebidos: novosRecebidos, amigos: novosAmigosLogado })
        });

        await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameRemetente}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pedidos_enviados: novosEnviados, amigos: novosAmigosRemetente })
        });

        await BancoDeDados.adicionarNotificacao(usernameRemetente, `@${usernameLogado} aceitou seu pedido de amizade! 🎉`, 'amizade');
      }
      return await BancoDeDados.getPerfisCadastrados();
    } catch (e) {
      return [];
    }
  },

  recusarPedidoAmizade: async (usernameLogado, usernameRemetente) => {
    try {
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const logado = perfis.find(p => p.username === usernameLogado);
      const remetente = perfis.find(p => p.username === usernameRemetente);

      if (logado && remetente) {
        const novosRecebidos = (logado.pedidos_recebidos || []).filter(u => u !== usernameRemetente);
        const novosEnviados = (remetente.pedidos_enviados || []).filter(u => u !== usernameLogado);

        await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameLogado}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pedidos_recebidos: novosRecebidos })
        });

        await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameRemetente}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pedidos_enviados: novosEnviados })
        });
      }
      return await BancoDeDados.getPerfisCadastrados();
    } catch (e) {
      return [];
    }
  },

  // --- MENSAGENS E CHAT ---
  getMensagensChat: async (usuarioA, usuarioB) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat?select=*&or=(and(remetente.eq.${usuarioA},destinatario.eq.${usuarioB}),and(remetente.eq.${usuarioB},destinatario.eq.${usuarioA}))&order=id.asc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { return []; }
  },

  enviarMensagemChat: async (novaMensagem) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat`, { method: 'POST', headers, body: JSON.stringify(novaMensagem) });
      if (response.ok) {
        await BancoDeDados.adicionarNotificacao(novaMensagem.destinatario, `@${novaMensagem.remetente} enviou uma nova mensagem.`, 'mensagem');
      }
    } catch (err) {}
  },

  // --- NOTIFICAÇÕES ---
  getNotificacoes: async (username) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes?select=*&destinatario=eq.${username}&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { return []; }
  },

  adicionarNotificacao: async (usernameDestino, texto, tipo) => {
    try {
      const novaNotif = {
        id: Date.now(),
        destinatario: usernameDestino,
        texto,
        tipo,
        lida: false,
        horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      await fetch(`${SUPABASE_URL}/rest/v1/notificacoes`, { method: 'POST', headers, body: JSON.stringify(novaNotif) });
    } catch (e) {}
  },

  marcarNotificacoesLidas: async (username) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/notificacoes?destinatario=eq.${username}`, { method: 'PATCH', headers, body: JSON.stringify({ lida: true }) });
    } catch (e) {}
  },

  // --- PEDIDOS DE ORAÇÃO ---
  getPedidosOracao: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { return []; }
  },

  salvarPedidoOracao: async (pedido) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao`, { method: 'POST', headers, body: JSON.stringify(pedido) });
      if (!response.ok) return await BancoDeDados.getPedidosOracao();
      return await BancoDeDados.getPedidosOracao();
    } catch (err) { return []; }
  },

  apoiarPedidoOracao: async (id) => {
    try {
      const pedidos = await BancoDeDados.getPedidosOracao();
      const p = pedidos.find(item => item.id === id);
      if (p) {
        const novosApoios = (p.apoios || 0) + 1;
        await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify({ apoios: novosApoios }) });
      }
      return await BancoDeDados.getPedidosOracao();
    } catch (err) { return []; }
  },

  excluirPedidoOracao: async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao?id=eq.${id}`, { method: 'DELETE', headers });
      return await BancoDeDados.getPedidosOracao();
    } catch (err) { return []; }
  }
};