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

  getPublicacoes: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { return []; }
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

  reagirPublicacao: async (id, tipoReacao, usernameUsuario) => {
    const pubs = await BancoDeDados.getPublicacoes();
    const p = pubs.find(x => x.id === id);
    if (p) {
      let reacoes = p.reacoes || { amem: [], gloria: [], amor: [] };
      if (!reacoes.amem) reacoes = { amem: [], gloria: [], amor: [] };

      Object.keys(reacoes).forEach(tipo => {
        reacoes[tipo] = (reacoes[tipo] || []).filter(u => u !== usernameUsuario);
      });

      reacoes[tipoReacao].push(usernameUsuario);
      const totalReacoes = (reacoes.amem.length + reacoes.gloria.length + reacoes.amor.length);

      await fetch(`${SUPABASE_URL}/rest/v1/publicacoes?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ reacoes, curtidas: totalReacoes })
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

  aceitarPedidoAmizade: async (usernameMeu, usernameAmigo) => {
    try {
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const eu = perfis.find(p => p.username === usernameMeu);
      const outro = perfis.find(p => p.username === usernameAmigo);
      if (!eu || !outro) return;

      const meusPedidos = (eu.pedidos_recebidos || []).filter(u => u !== usernameAmigo);
      const meusAmigos = eu.amigos || [];
      if (!meusAmigos.includes(usernameAmigo)) meusAmigos.push(usernameAmigo);

      const outrosPedidos = (outro.pedidos_enviados || []).filter(u => u !== usernameMeu);
      const outrosAmigos = outro.amigos || [];
      if (!outrosAmigos.includes(usernameMeu)) outrosAmigos.push(usernameMeu);

      await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameMeu}`, { method: 'PATCH', headers, body: JSON.stringify({ pedidos_recebidos: meusPedidos, amigos: meusAmigos }) });
      await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameAmigo}`, { method: 'PATCH', headers, body: JSON.stringify({ pedidos_enviados: outrosPedidos, amigos: outrosAmigos }) });
      await BancoDeDados.adicionarNotificacao(usernameAmigo, `@${usernameMeu} aceitou seu pedido de amizade.`, 'amizade');
    } catch (e) {}
  },

  rejeitarPedidoAmizade: async (usernameMeu, usernameAmigo) => {
    try {
      const perfis = await BancoDeDados.getPerfisCadastrados();
      const eu = perfis.find(p => p.username === usernameMeu);
      const outro = perfis.find(p => p.username === usernameAmigo);
      if (!eu || !outro) return;

      const meusPedidos = (eu.pedidos_recebidos || []).filter(u => u !== usernameAmigo);
      const outrosPedidos = (outro.pedidos_enviados || []).filter(u => u !== usernameMeu);

      await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameMeu}`, { method: 'PATCH', headers, body: JSON.stringify({ pedidos_recebidos: meusPedidos }) });
      await fetch(`${SUPABASE_URL}/rest/v1/perfis?username=eq.${usernameAmigo}`, { method: 'PATCH', headers, body: JSON.stringify({ pedidos_enviados: outrosPedidos }) });
    } catch (e) {}
  },

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

  // --- STORIES ---
  getStories: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { return []; }
  },

  salvarStory: async (story) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stories`, { method: 'POST', headers, body: JSON.stringify(story) });
      return await BancoDeDados.getStories();
    } catch (err) { return []; }
  },

  getPedidosOracao: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao?select=*&order=id.desc`, { method: 'GET', headers });
      if (!response.ok) return [];
      return await response.json();
    } catch (err) { return []; }
  },

  salvarPedidoOracao: async (pedido) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/pedidos_oracao`, { method: 'POST', headers, body: JSON.stringify(pedido) });
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