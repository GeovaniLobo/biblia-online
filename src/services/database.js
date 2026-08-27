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

  getPublicacoes: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      return [];
    }
  },

  salvarPublicacao: async (pub) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pub)
    });
    if (!response.ok) throw new Error('Erro ao salvar publicação.');
    return await BancoDeDados.getPublicacoes();
  },

  excluirPublicacao: async (id) => {
    await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, { method: 'DELETE', headers });
    return await BancoDeDados.getPublicacoes();
  },

  atualizarPublicacao: async (id, texto, tema) => {
    await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ texto, tema })
    });
    return await BancoDeDados.getPublicacoes();
  },

  curtirPublicacao: async (id) => {
    const pubs = await BancoDeDados.getPublicacoes();
    const p = pubs.find(x => x.id === id);
    if (p) {
      const novasCurtidas = (p.curtidas || 0) + 1;
      await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ curtidas: novasCurtidas })
      });
    }
    return await BancoDeDados.getPublicacoes();
  },

  adicionarComentarioPub: async (id, comentario) => {
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
    return await BancoDeDados.getPublicacoes();
  },

  // Métodos de Chat em Tempo Real via Supabase
  getMensagensChat: async (usuarioA, usuarioB) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat?select=*&or=(and(remetente.eq.${usuarioA},destinatario.eq.${usuarioB}),and(remetente.eq.${usuarioB},destinatario.eq.${usuarioA}))&order=id.asc`, {
        method: 'GET',
        headers
      });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      return [];
    }
  },

  enviarMensagemChat: async (novaMensagem) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/mensagens_chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(novaMensagem)
      });
      if (!response.ok) throw new Error('Erro ao enviar mensagem.');
      return await response.json();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  },

  // Stories e Notificações (LocalStorage auxiliar)
  getStories: () => {
    const s = localStorage.getItem('supa_stories');
    return s ? JSON.parse(s) : [];
  },
  salvarStory: (story) => {
    const atual = BancoDeDados.getStories();
    const novos = [story, ...atual];
    localStorage.setItem('supa_stories', JSON.stringify(novos));
    return novos;
  },
  registrarVisualizacaoStory: (storyId, usernameVisitante) => {
    const stories = BancoDeDados.getStories();
    const atualizados = stories.map(st => {
      if (st.id === storyId) {
        const vis = st.visualizadores || [];
        if (!vis.includes(usernameVisitante)) {
          return { ...st, visualizadores: [...vis, usernameVisitante] };
        }
      }
      return st;
    });
    localStorage.setItem('supa_stories', JSON.stringify(atualizados));
  },
  getNotificacoes: (username) => {
    const n = localStorage.getItem(`supa_notif_${username}`);
    return n ? JSON.parse(n) : [];
  },
  adicionarNotificacao: (usernameDestino, texto, tipo) => {
    const atuais = BancoDeDados.getNotificacoes(usernameDestino);
    const nova = { texto, tipo, lida: false, horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    localStorage.setItem(`supa_notif_${usernameDestino}`, JSON.stringify([nova, ...atuais]));
  },
  marcarNotificacoesLidas: (username) => {
    const atuais = BancoDeDados.getNotificacoes(username);
    const lidas = atuais.map(n => ({ ...n, lida: true }));
    localStorage.setItem(`supa_notif_${username}`, JSON.stringify(lidas));
  },

  enviarPedidoAmizade: async () => {},
  aceitarPedidoAmizade: async () => {},
  rejeitarPedidoAmizade: async () => {}
};