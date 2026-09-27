# PATCH NOTES — Parkncharge

Numeração: **versões** do plano (`v0.1`, `v0.2`, … ver `ROADMAP.md`) e **alterações pedidas entre versões** com letra (`v0.2a`, `v0.2b`, …).
A versão atual aparece no rodapé do site e no fundo do Perfil, e está em `APP_VERSAO` no `assets/app.js`.

---

## Decisões fixas (não contrariar sem avisar)

Regras que o Sebastião pediu explicitamente. Antes de qualquer alteração ou nova versão, confirmar que nada aqui é contrariado; se for preciso, **avisar primeiro e pedir confirmação**. As decisões com teste estão verificadas em `tests/regressao.cjs` (o código do teste é o mesmo `Dxx`).

**Forma de trabalhar**
- Antes de alterações ou de uma nova versão: fazer perguntas e dar sugestões para perceber exatamente o que se quer. Só depois implementar.
- Registar cada alteração neste ficheiro e subir a letra da versão (`APP_VERSAO`).
- Manter o `README.md`, o `ROADMAP.md` e o `docs/modelo-dados.md` atualizados.

**Geral**
- D01 Só português de Portugal por agora (textos preparados para tradução mais tarde).
- D02 Conta única da plataforma frisk.pt: login com **email + Google** através do `auth.js` do `plataforma-core`, no projeto Supabase partilhado "Sites". **Não** criar um projeto Supabase separado (foi pedido e depois recusado, para manter o login único).
- D03 Sem ecrã de arranque (splash): o site abre logo no Explorar.
- D04 Identidade do Figma "First teste parkncharge": azul `#436E91`, creme `#F3E9B5`, laranja `#E95322`; letras Josefin Sans (títulos) e Lato (texto).
- D05 Estrutura copiada do Airbnb (organização e fluxos), com a identidade Parkncharge (cores, logótipo, textos). Não copiar o aspeto nem a marca do Airbnb.
- D06 Site web primeiro (PWA instalável na v0.8), app nativa depois. Morada: `parkncharge.frisk.pt`; domínio próprio mais tarde.
- D07 Lançamento só no Porto.
- D08 Anfitriões particulares **e** empresas no mesmo mercado.
- D09 Reservas à hora, ao dia e ao mês. Em cada anúncio o anfitrião escolhe reserva instantânea ou com aprovação.
- D10 Pagamentos combinados entre condutor e anfitrião até à v1.0; **Stripe Connect só na v1.1**.
- D11 Dados do Parkncharge num schema próprio `parkncharge` (tabelas próprias), não na tabela genérica `user_site_data`.

**Explorar (condutor)**
- D20 Sem conta pode-se ver tudo; a conta só é pedida para reservar, guardar favoritos, falar com anfitriões ou publicar.
- D21 Barra inferior (telemóvel), como no Airbnb: **Explorar, Favoritos, Reservas, Mensagens, Perfil**. No computador: cabeçalho com "Arrendar o meu lugar" e menu do perfil.
- D22 Pesquisa em pílula no topo: **Onde · Quando (início e fim) · Veículo**, que abre um painel. Substitui o "Good Morning" do Figma.
- D23 O carregador é uma **categoria/filtro** ("Com carregador"), sem separador próprio. Categorias: Todos, Com carregador, Coberto, Subterrâneo, Fechado, Acesso fácil, Lugar só seu, Mensal, Motas, Carrinhas.
- D24 Sem pesquisa: lugares em carrosséis por zona ("Lugares em …"). Com pesquisa ou categoria: grelha.
- D25 A versão do site aparece no rodapé.
- D26 `assets/app.js` e `assets/style.css` são carregados com `?v=<versão>` em todas as páginas, para os visitantes receberem logo a versão nova.

**Anfitrião**
- D30 Modo anfitrião separado, com "Mudar para anfitrião" / "Mudar para condutor" no perfil. Barra inferior: **Hoje, Calendário, Lugares, Mensagens, Menu**.
- D31 **Aprovação manual** de cada anúncio antes de ficar visível. O anfitrião nunca se auto-aprova (regra no servidor). A aprovação faz-se em `admin.html`, só para administradores.
- D32 Empresas: nome obrigatório, NIF opcional (9 algarismos). Particulares: sem dados extra.
- D33 Entre **1 e 6 fotografias** por lugar; a primeira é a capa (pode-se escolher outra).
- D34 A **morada exata** só é mostrada ao condutor depois de a reserva ser confirmada. Antes disso, o público vê só a zona e uma posição aproximada (~300 m).
- D35 Serviços extra "Clean Up" (lavagem) e "Workshop" (oficina), que estão no Figma, ficam para depois da v1.0.
- D36 Recusar um anúncio exige um motivo, que o anfitrião vê na lista dos seus lugares.

**Segurança**
- S01 Nunca pôr chaves privadas no código (só a chave pública do Supabase, via `plataforma-core`). As regras de acesso são RLS no servidor.

---

## Histórico

### v0.2a — 27/09/2026
- README reescrito: objetivo, arquitetura, como funciona cada página, base de dados, segurança, deploy e processo de desenvolvimento.
- Novo `PATCH NOTES.md` (este ficheiro) com as decisões fixas e o histórico.
- Novo `CLAUDE.md` com o processo obrigatório para cada alteração.
- Testes de regressão (`tests/regressao.cjs`, Playwright) para as decisões fixas.
- Versão visível no rodapé e no fundo do Perfil (`APP_VERSAO`).
- `app.js` e `style.css` com `?v=0.2a` em todas as páginas: o Cloudflare manda o browser guardá-los 4 h e, sem isto, quem já tinha visitado o site via a versão antiga depois de cada publicação.
- A reestruturação de 26/09 passa a chamar-se `v0.1a` (antes `v0.1.1`), para seguir a numeração com letras.

### v0.2 — 26/09/2026
- Base de dados: schema `parkncharge` no projeto "Sites" com as tabelas `host_profiles`, `listings`, `listing_private`, `listing_photos` e `listing_schedule`, o bucket de fotos `parkncharge` e as regras de acesso (RLS). Regras testadas: sem auto-aprovação, moradas alheias invisíveis, pendentes invisíveis ao público.
- Supabase: schema `parkncharge` exposto na Data API; Redirect URLs `https://*.frisk.pt/**` e `https://parkncharge.pages.dev/**`. Também corrige o login com Google nos outros sites frisk.pt.
- Modo anfitrião (`anfitriao.html`): na primeira vez pede particular ou empresa; lista dos meus lugares com estado (Rascunho, Em análise, Ativo, Recusado com motivo, Pausado) e ações (continuar, editar, pausar, reativar, retirar da análise, apagar).
- Assistente de publicação (`publicar.html`) em 9 passos: tipo, localização (pesquisa de morada + mapa com marcador), características, carregador, fotografias (1 a 6, reduzidas antes de enviar), título, horário semanal, preços e tipo de reserva, rever e enviar. O rascunho é guardado a cada passo.
- Aprovação (`admin.html`): pendentes, ativos, recusados e pausados; aprovar, recusar com motivo, retirar.
- Explorar mostra os lugares aprovados, agrupados por zona.

### v0.1a — 26/09/2026
- Estrutura do Airbnb com a identidade Parkncharge:
  - pesquisa Onde · Quando · Veículo com painel;
  - barra de categorias;
  - carrosséis por zona e lista de zonas do Porto;
  - destaque "Tem um lugar livre?".
- Barra inferior Explorar / Favoritos / Reservas / Mensagens / Perfil. Cabeçalho e rodapé (Apoio, Anfitriões, Parkncharge) no computador.
- Perfil com "Mudar para anfitrião". Páginas Favoritos, Reservas e Mensagens (em breve), Ajuda, Termos e Privacidade.

### v0.1 — 26/09/2026
- Repositório `Sebalca/parkncharge`, roadmap até à v1.0 (Stripe na v1.1) e modelo de dados.
- Ecrãs do Figma guardados em `design/`. Design system em CSS com as cores e letras do Figma.
- Página inicial provisória e página de login (email + Google, recuperar palavra-passe, terminar sessão), só em português e sem ecrã de arranque.
- Cloudflare Pages ligado ao repositório, com `parkncharge.frisk.pt`. Site registado na tabela `sites` do Supabase.
