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
    } catch (err) {
      console.error("Erro ao buscar perfis:", err);
      return []; 
    }
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(perfil)
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("Erro ao salvar perfil no Supabase:", errText);
      }
    } catch (e) {
      console.error("Exceção ao salvar perfil:", e);
    }
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

  atualizarUltimoAcesso: async (username) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${username}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ultimo_acesso: Date.now() })
      });
    } catch (e) {
      console.error("Erro ao atualizar último acesso:", e);
    }
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

      const agora = Date.now();
      const limite24h = 24 * 60 * 60 * 1000;
      
      const storiesValidos = data.filter(s => {
        if (!s.id) return false;
        return (agora - Number(s.id)) <= limite24h;
      });

      return storiesValidos;
    } catch (err) { 
      console.error("Erro ao buscar stories:", err);
      return []; 
    }
  },

  salvarStory: async (story) => {
    try {
      const novoStoryComVisualizacoes = { ...story, visualizacoes: [], curtidas: [] };
      const response = await fetch(`${SUPABASE_URL}/rest/v1/stories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(novoStoryComVisualizacoes)
      });
      if (!response.ok) {
        console.error("Erro ao salvar story:", await response.text());
        return await BancoDeDados.getStories();
      }
      return await BancoDeDados.getStories();
    } catch (err) { 
      console.error("Exceção ao salvar story:", err);
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
    } catch (err) { 
      console.error("Erro ao excluir story:", err);
      return []; 
    }
  },

  // --- PUBLICAÇÕES ---
  getPublicacoes: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { 
      console.error("Erro ao buscar publicações:", err);
      return []; 
    }
  },

  salvarPublicacao: async (pub) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pub)
      });
      if (!response.ok) {
        console.error("Erro ao salvar publicação:", await response.text());
        return await BancoDeDados.getPublicacoes();
      }
      return await BancoDeDados.getPublicacoes();
    } catch (err) { 
      console.error("Exceção ao salvar publicação:", err);
      return []; 
    }
  },

  excluirPublicacao: async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, { method: 'DELETE', headers });
      return await BancoDeDados.getPublicacoes();
    } catch (err) { 
      console.error("Erro ao excluir publicação:", err);
      return []; 
    }
  },

  atualizarPublicacao: async (id, texto, tema) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ texto, tema })
      });
    } catch (e) {
      console.error("Erro ao atualizar publicação:", e);
    }
    return await BancoDeDados.getPublicacoes();
  },

  reagirPublicacao: async (id, tipoReacao, usernameUsuario) => {
    try {
      const pubs = await BancoDeDados.getPublicacoes();
      const p = pubs.find(x => x.id === id);
      if (p) {
        let reacoes = p.reacoes || { amei: [], amem: [], gloria: [], parabens: [], felicidades: [] };
        if (!reacoes.amei) reacoes = { amei: [], amem: [], gloria: [], parabens: [], felicidades: [] };

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

        if (p.username !== usernameUsuario) {
          await BancoDeDados.adicionarNotificacao(
            p.username,
            `@${usernameUsuario} reagiu à sua publicação com ${tipoReacao}.`,
            'reacao'
          );
        }
      }
    } catch (e) {
      console.error("Erro ao reagir na publicação:", e);
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
        const res = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ comentarios: novosComentarios })
        });
        if (!res.ok) {
          console.error("Erro ao adicionar comentário:", await res.text());
        }

        if (p.username !== comentario.username) {
          await BancoDeDados.adicionarNotificacao(
            p.username,
            `@${comentario.username} comentou na sua publicação.`,
            'comentario'
          );
        }
      }
    } catch (e) {
      console.error("Exceção ao adicionar comentário:", e);
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
            let reacoes = c.reacoes || { amei: [], amem: [], gloria: [], parabens: [], felicidades: [] };
            if (!reacoes.amei) reacoes = { amei: [], amem: [], gloria: [], parabens: [], felicidades: [] };

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

  // --- AMIZADES ---
  enviarPedidoAmizade: async (usernameRemetente, usernameDestinatario) => {
    try {
      // 1. Salva na nova tabela de amizades
      const response = await fetch(`${SUPABASE_URL}/rest/v1/amizades`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          remetente: usernameRemetente,
          destinatario: usernameDestinatario,
          status: 'pendente'
        })
      });

      // 2. Atualiza a coluna pedidos_recebidos no perfil do destinatário (caso sua interface use isso para exibir os pedidos)
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const destinatario = perfis.find(p => p.username === usernameDestinatario);
      if (destinatario) {
        const recebidos = destinatario.pedidos_recebidos || [];
        if (!recebidos.includes(usernameRemetente)) {
          recebidos.push(usernameRemetente);
          await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameDestinatario}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ pedidos_recebidos: recebidos })
          });
        }
      }

      if (response.ok) {
        await BancoDeDados.adicionarNotificacao(
          usernameDestinatario, 
          `@${usernameRemetente} enviou um pedido de amizade.`, 
          'amizade'
        );
      } else {
        console.error("Erro ao enviar pedido:", await response.text());
      }
    } catch (e) {
      console.error("Exceção em enviarPedidoAmizade:", e);
    }
  },

  // 2. Aceitar pedido de amizade
  aceitarPedidoAmizade: async (usernameLogado, usernameRemetente) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/amizades?or=(and(remetente.eq.${usernameRemetente},destinatario.eq.${usernameLogado}),and(remetente.eq.${usernameLogado},destinatario.eq.${usernameRemetente}))`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'aceito' })
        }
      );

      if (response.ok) {
        await BancoDeDados.adicionarNotificacao(
          usernameRemetente, 
          `@${usernameLogado} aceitou seu pedido de amizade! 🎉`, 
          'amizade'
        );
      } else {
        console.error("Erro ao aceitar pedido:", await response.text());
      }
      return await BancoDeDados.getPerfisCadastrados();
    } catch (e) {
      console.error("Exceção ao aceitar pedido:", e);
      return [];
    }
  },

  // 3. Recusar pedido de amizade
  recusarPedidoAmizade: async (usernameLogado, usernameRemetente) => {
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/amizades?or=(and(remetente.eq.${usernameRemetente},destinatario.eq.${usernameLogado}),and(remetente.eq.${usernameLogado},destinatario.eq.${usernameRemetente}))`,
        {
          method: 'DELETE',
          headers
        }
      );
      return await BancoDeDados.getPerfisCadastrados();
    } catch (e) {
      console.error("Erro ao recusar pedido:", e);
      return [];
    }
  },

  // 4. Buscar lista de amigos aceitos de um usuário
  buscarAmigosDoUsuario: async (username) => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/amizades?status=eq.aceito&or=(remetente.eq.${username},destinatario.eq.${username})`,
        { method: 'GET', headers }
      );
      if (!response.ok) return [];
      const data = await response.json();
      
      // Retorna a lista com o username do amigo (quem não for o próprio usuário)
      return data.map(item => item.remetente === username ? item.destinatario : item.remetente);
    } catch (err) {
      console.error("Erro ao buscar amigos:", err);
      return [];
    }
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

        const res1 = await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameLogado}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pedidos_recebidos: novosRecebidos, amigos: novosAmigosLogado })
        });
        if (!res1.ok) console.error("Erro ao aceitar pedido (logado):", await res1.text());

        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameRemetente}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pedidos_enviados: novosEnviados, amigos: novosAmigosRemetente })
        });
        if (!res2.ok) console.error("Erro ao aceitar pedido (remetente):", await res2.text());

        await BancoDeDados.adicionarNotificacao(usernameRemetente, `@${usernameLogado} aceitou seu pedido de amizade! 🎉`, 'amizade');
      }
      return await BancoDeDados.getPerfisCadastrados();
    } catch (e) {
      console.error("Exceção ao aceitar pedido:", e);
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
      console.error("Erro ao recusar pedido:", e);
      return [];
    }
  },

  // --- MENSAGENS E CHAT ---
  getMensagensChat: async (usuarioA, usuarioB) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat?select=*&or=(and(remetente.eq.${usuarioA},destinatario.eq.${usuarioB}),and(remetente.eq.${usuarioB},destinatario.eq.${usuarioA}))&order=id.asc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { 
      console.error("Erro ao buscar mensagens do chat:", err);
      return []; 
    }
  },

  enviarMensagemChat: async (novaMensagem) => {
    try {
      const payload = {
        id: novaMensagem.id,
        remetente: novaMensagem.remetente,
        destinatario: novaMensagem.destinatario,
        texto: novaMensagem.texto || '',
        midia: novaMensagem.midia || null,
        tipo_midia: novaMensagem.tipoMidia || null,
        visualizacao_unica: Boolean(novaMensagem.visualizacaoUnica),
        horario: novaMensagem.horario
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(payload) 
      });

      if (!response.ok) {
        console.error("Erro ao enviar mensagem do chat:", await response.text());
      } else {
        await BancoDeDados.adicionarNotificacao(novaMensagem.destinatario, `@${novaMensagem.remetente} enviou uma nova mensagem.`, 'mensagem');
      }
    } catch (err) {
      console.error("Exceção ao enviar mensagem:", err);
    }
  },

  // --- NOTIFICAÇÕES ---
  getNotificacoes: async (username) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes?select=*&destinatario=eq.${encodeURIComponent(username)}&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) {
        const errData = await response.text();
        console.error("Erro ao buscar notificações:", errData);
        return [];
      }
      return await response.json();
    } catch (err) { 
      console.error("Exceção ao buscar notificações:", err);
      return []; 
    }
  },

  adicionarNotificacao: async (usernameDestino, texto, tipo) => {
    try {
      const agora = new Date();
      const novaNotif = {
        id: Date.now(),
        destinatario: usernameDestino,
        texto,
        tipo,
        lida: false,
        data: agora.toISOString(),
        horario: agora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(novaNotif) 
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Falha ao inserir notificação no Supabase:", errText);
      }
    } catch (e) {
      console.error("Exceção ao adicionar notificação:", e);
    }
  },

  marcarNotificacoesLidas: async (username) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes?destinatario=eq.${encodeURIComponent(username)}`, { 
        method: 'PATCH', 
        headers, 
        body: JSON.stringify({ lida: true }) 
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("Erro ao marcar notificações como lidas:", errText);
      }
    } catch (e) {
      console.error("Exceção ao marcar notificações como lidas:", e);
    }
  },

  // --- PEDIDOS DE ORAÇÃO ---
  getPedidosOracao: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { 
      console.error("Erro ao buscar pedidos de oração:", err);
      return []; 
    }
  },

  salvarPedidoOracao: async (pedido) => {
    try {
      const payload = {
        id: pedido.id,
        username: pedido.username,
        autor: pedido.autor || pedido.username,
        texto: pedido.texto,
        apoios: 0
      };
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!response.ok) {
        console.error("Erro ao salvar pedido de oração:", await response.text());
        return await BancoDeDados.getPedidosOracao();
      }
      return await BancoDeDados.getPedidosOracao();
    } catch (err) { 
      console.error("Exceção ao salvar pedido de oração:", err);
      return []; 
    }
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
    } catch (err) { 
      console.error("Erro ao apoiar pedido de oração:", err);
      return []; 
    }
  },

  excluirPedidoOracao: async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao?id=eq.${id}`, { method: 'DELETE', headers });
      return await BancoDeDados.getPedidosOracao();
    } catch (err) { 
      console.error("Erro ao excluir pedido de oração:", err);
      return []; 
    }
  },

  limparConversaChat: async (usuarioA, usuarioB) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat?or=(and(remetente.eq.${usuarioA},destinatario.eq.${usuarioB}),and(remetente.eq.${usuarioB},destinatario.eq.${usuarioA}))`, {
        method: 'DELETE',
        headers
      });
      return [];
    } catch (err) {
      console.error("Erro ao limpar conversa:", err);
      return [];
    }
  },

  atualizarTemaUsuario: async (username, darkMode) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${username}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ dark_mode: darkMode })
      });
    } catch (e) {
      console.error("Erro ao atualizar tema no banco:", e);
    }
  },

  // --- PLANOS DE ESTUDO ---
  buscarPlanos: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/planos_estudo?select=*&order=created_at.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      const data = await response.json();
      return data || [];
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
      return [];
    }
  },

  criarPlano: async (planoObj) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/planos_estudo`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(planoObj)
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error("Erro ao criar plano:", err);
      return null;
    }
  },

  deletarPlano: async (planoId) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/planos_estudo?id=eq.${planoId}`, {
        method: 'DELETE',
        headers
      });
    } catch (err) {
      console.error("Erro ao deletar plano:", err);
    }
  },
};