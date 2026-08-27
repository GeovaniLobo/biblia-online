export const BancoDeDados = {
  // --- PERFIS & AUTENTICAÇÃO ---
  getPerfisCadastrados() {
    const perfis = localStorage.getItem('perfis_cadastrados_biblia');
    return perfis ? JSON.parse(perfis) : [];
  },

  salvarNovoPerfilNaRede(novoPerfil) {
    let perfis = this.getPerfisCadastrados();
    const index = perfis.findIndex(p => p.username === novoPerfil.username);
    if (index !== -1) {
      // Atualiza mantendo dados existentes
      perfis[index] = { ...perfis[index], ...novoPerfil };
    } else {
      perfis.push({
        amigos: [],
        pedidos_enviados: [],
        pedidos_recebidos: [],
        biografia: 'Praticando a fé e o amor ao próximo.',
        ...novoPerfil
      });
    }
    localStorage.setItem('perfis_cadastrados_biblia', JSON.stringify(perfis));
    return perfis;
  },

  getUsuarioLogado() {
    const usuario = localStorage.getItem('usuario_logado_biblia');
    return usuario ? JSON.parse(usuario) : null;
  },

  fazerLogin(perfil) {
    localStorage.setItem('usuario_logado_biblia', JSON.stringify(perfil));
  },

  fazerLogout() {
    localStorage.removeItem('usuario_logado_biblia');
  },

  atualizarPerfilLogado(perfilAtualizado) {
    localStorage.setItem('usuario_logado_biblia', JSON.stringify(perfilAtualizado));
    this.salvarNovoPerfilNaRede(perfilAtualizado);
  },

  // --- PUBLICAÇÕES & FEED ---
  getPublicacoes() {
    const pubs = localStorage.getItem('publicacoes_biblia');
    return pubs ? JSON.parse(pubs) : [];
  },

  salvarPublicacao(novaPub) {
    let pubs = this.getPublicacoes();
    pubs.unshift(novaPub);
    localStorage.setItem('publicacoes_biblia', JSON.stringify(pubs));
    return pubs;
  },

  excluirPublicacao(id) {
    let pubs = this.getPublicacoes();
    pubs = pubs.filter(p => p.id !== id);
    localStorage.setItem('publicacoes_biblia', JSON.stringify(pubs));
    return pubs;
  },

  atualizarPublicacao(id, novoTexto, novoTema) {
    let pubs = this.getPublicacoes();
    const pub = pubs.find(p => p.id === id);
    if (pub) {
      pub.texto = novoTexto;
      pub.tema = novoTema;
      localStorage.setItem('publicacoes_biblia', JSON.stringify(pubs));
    }
    return pubs;
  },

  curtirPublicacao(id, usernameAutor) {
    let pubs = this.getPublicacoes();
    const pub = pubs.find(p => p.id === id);
    if (pub) {
      pub.curtidas = (pub.curtidas || 0) + 1;
      localStorage.setItem('publicacoes_biblia', JSON.stringify(pubs));
    }
    return pubs;
  },

  adicionarComentarioPub(id, comentarioObj, usernameAutor) {
    let pubs = this.getPublicacoes();
    const pub = pubs.find(p => p.id === id);
    if (pub) {
      if (!pub.comentarios) pub.comentarios = [];
      pub.comentarios.push(comentarioObj);
      localStorage.setItem('publicacoes_biblia', JSON.stringify(pubs));
    }
    return pubs;
  },

  // --- PEDIDOS DE ORAÇÃO ---
  getPedidosOracao() {
    const pedidos = localStorage.getItem('pedidos_oracao_biblia');
    return pedidos ? JSON.parse(pedidos) : [];
  },

  salvarPedidoOracao(pedido) {
    let pedidos = this.getPedidosOracao();
    pedidos.unshift(pedido);
    localStorage.setItem('pedidos_oracao_biblia', JSON.stringify(pedidos));
    return pedidos;
  },

  apoiarPedidoOracao(id) {
    let pedidos = this.getPedidosOracao();
    const p = pedidos.find(item => item.id === id);
    if (p) {
      p.apoios = (p.apoios || 0) + 1;
      localStorage.setItem('pedidos_oracao_biblia', JSON.stringify(pedidos));
    }
    return pedidos;
  },

  excluirPedidoOracao(id) {
    let pedidos = this.getPedidosOracao();
    pedidos = pedidos.filter(p => p.id !== id);
    localStorage.setItem('pedidos_oracao_biblia', JSON.stringify(pedidos));
    return pedidos;
  },

  // --- CHAT PRIVADO & MENSAGENS ---
  getMensagensChat(user1, user2) {
    const todas = JSON.parse(localStorage.getItem('mensagens_chat_biblia') || '[]');
    return todas.filter(m => 
      (m.remetente === user1 && m.destinatario === user2) || 
      (m.remetente === user2 && m.destinatario === user1)
    );
  },

  enviarMensagemChat(mensagem) {
    let todas = JSON.parse(localStorage.getItem('mensagens_chat_biblia') || '[]');
    todas.push(mensagem);
    localStorage.setItem('mensagens_chat_biblia', JSON.stringify(todas));
    
    // Adiciona notificação para o destinatário
    this.adicionarNotificacao(mensagem.destinatario, `@${mensagem.remetente} enviou uma nova mensagem.`, 'mensagem');
    return todas;
  },

  // --- NOTIFICAÇÕES ---
  getNotificacoes(username) {
    const todas = JSON.parse(localStorage.getItem('notificacoes_biblia') || '{}');
    return todas[username] || [];
  },

  adicionarNotificacao(usernameDestino, texto, tipo = 'geral') {
    let todas = JSON.parse(localStorage.getItem('notificacoes_biblia') || '{}');
    if (!todas[usernameDestino]) todas[usernameDestino] = [];
    todas[usernameDestino].unshift({
      id: Date.now(),
      texto,
      tipo,
      lida: false,
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('notificacoes_biblia', JSON.stringify(todas));
  },

  marcarNotificacoesLidas(username) {
    let todas = JSON.parse(localStorage.getItem('notificacoes_biblia') || '{}');
    if (todas[username]) {
      todas[username].forEach(n => n.lida = true);
      localStorage.setItem('notificacoes_biblia', JSON.stringify(todas));
    }
  },

  // --- AMIZADES ---
  enviarPedidoAmizade(meuUser, userAlvo) {
    let perfis = this.getPerfisCadastrados();
    let eu = perfis.find(p => p.username === meuUser);
    let alvo = perfis.find(p => p.username === userAlvo);
    if (eu && alvo) {
      if (!eu.pedidos_enviados) eu.pedidos_enviados = [];
      if (!alvo.pedidos_recebidos) alvo.pedidos_recebidos = [];
      if (!eu.pedidos_enviados.includes(userAlvo)) eu.pedidos_enviados.push(userAlvo);
      if (!alvo.pedidos_recebidos.includes(meuUser)) alvo.pedidos_recebidos.push(meuUser);
      localStorage.setItem('perfis_cadastrados_biblia', JSON.stringify(perfis));
      this.adicionarNotificacao(userAlvo, `@${meuUser} enviou um pedido de amizade.`, 'amizade');
    }
  },

  aceitarPedidoAmizade(meuUser, userAlvo) {
    let perfis = this.getPerfisCadastrados();
    let eu = perfis.find(p => p.username === meuUser);
    let alvo = perfis.find(p => p.username === userAlvo);
    if (eu && alvo) {
      eu.pedidos_recebidos = (eu.pedidos_recebidos || []).filter(u => u !== userAlvo);
      alvo.pedidos_enviados = (alvo.pedidos_enviados || []).filter(u => u !== meuUser);
      if (!eu.amigos) eu.amigos = [];
      if (!alvo.amigos) alvo.amigos = [];
      if (!eu.amigos.includes(userAlvo)) eu.amigos.push(userAlvo);
      if (!alvo.amigos.includes(meuUser)) alvo.amigos.push(meuUser);
      localStorage.setItem('perfis_cadastrados_biblia', JSON.stringify(perfis));
      this.adicionarNotificacao(userAlvo, `@${meuUser} aceitou seu pedido de amizade.`, 'amizade');
    }
  },

  rejeitarPedidoAmizade(meuUser, userAlvo) {
    let perfis = this.getPerfisCadastrados();
    let eu = perfis.find(p => p.username === meuUser);
    let alvo = perfis.find(p => p.username === userAlvo);
    if (eu && alvo) {
      eu.pedidos_recebidos = (eu.pedidos_recebidos || []).filter(u => u !== userAlvo);
      alvo.pedidos_enviados = (alvo.pedidos_enviados || []).filter(u => u !== meuUser);
      localStorage.setItem('perfis_cadastrados_biblia', JSON.stringify(perfis));
    }
  },

  getStories() {
    return JSON.parse(localStorage.getItem('stories_biblia') || '[]');
  }
};