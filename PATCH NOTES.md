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
- D09 Reservas à hora, ao dia e ao mês. **Todas as reservas são instantâneas** (o anfitrião não aprova pedidos). (atualizada v0.4a — antes o anfitrião escolhia instantânea ou com aprovação)
- D10 Pagamentos combinados entre condutor e anfitrião até à v1.0; **Stripe Connect só na v1.1**.
- D11 Dados do Parkncharge num schema próprio `parkncharge` (tabelas próprias), não na tabela genérica `user_site_data`.

**Explorar (condutor)**
- D20 Sem conta pode-se ver tudo; a conta só é pedida para reservar, guardar favoritos, falar com anfitriões ou publicar.
- D21 Barra inferior (telemóvel), como no Airbnb: **Explorar, Favoritos, Reservas, Mensagens, Perfil**. Cabeçalho só com o logótipo e o menu da conta — **sem botão "Arrendar o meu lugar"** (está na janela do menu). (atualizada v0.2c)
- D22 Pesquisa em pílula no topo: **Onde · Quando (início e fim) · Veículo**, que abre um painel. Substitui o "Good Morning" do Figma.
- D23 O carregador é uma **categoria/filtro** ("Com carregador"), sem separador próprio. Categorias: Todos, Com carregador, Coberto, Subterrâneo, Fechado, Acesso fácil, Lugar só seu, Mensal, Motas, Carrinhas. **Podem ligar-se várias ao mesmo tempo** e o anúncio tem de cumprir todas; "Todos" limpa. (atualizada v0.2c)
- D24 Explorar sem pesquisa: **mapa "Perto de si"** com as garagens disponíveis mais próximas; por baixo, **todas as garagens da localidade onde estou (mesmo ocupadas)**; no fim, carrosséis das outras zonas. Com pesquisa por texto: grelha. Categoria e veículo filtram tudo. (atualizada v0.2b — antes só carrosséis por zona)
- D25 A versão do site aparece no rodapé.
- D27 O botão do canto superior direito (☰ + avatar) abre uma **janela** (como nas Finanças), não uma página: Entrar/Criar conta ou nome, Mudar para anfitrião/condutor, atalhos, Aprovação (admin), Perfil, Ajuda, Terminar sessão, e a versão no canto. Fecha ao clicar fora, mas não quando se carrega dentro e se larga fora. Existe também no telemóvel (cabeçalho compacto).
- D28 Localização por defeito: **São Mamede de Infesta** (fictícia, por agora). "Usar a minha localização" passa ao GPS real e descobre a localidade.
- D29 Estado de cada lugar: **Disponível agora** (aberto pelo horário e livre), **Ocupada** / **Alugado** (há uma reserva confirmada a decorrer) ou **Fechada agora** (fora do horário, com a próxima abertura). O mapa mostra só as disponíveis (até 8, num raio de 5 km).
- D26 `assets/app.js` e `assets/style.css` são carregados com `?v=<versão>` em todas as páginas, para os visitantes receberem logo a versão nova.

- D60 Por cima da pesquisa há os separadores **Estacionar | Alugar carro**. "Alugar carro" é uma réplica do Explorar (mapa, "Carros em <localidade>" mesmo alugados, outras zonas, filtros múltiplos, página do carro, avaliações), com categorias próprias (Elétrico, Híbrido, Automático, Citadino, Familiar, SUV, 7 lugares, Carrinhas, Cadeira de bebé, Engate) e o terceiro campo da pesquisa = Lugares.
- D61 Carregar num cartão (ou em "Ver lugar/carro" no mapa) abre a **página do anúncio**: `lugar.html?id=…` ou `carro.html?id=…`.
- D62 **Avaliações** (1–5 estrelas + comentário) em todos os anúncios, com a média e o número no cartão e na página. Só avalia quem fez uma **reserva concluída** desse anúncio (desde a v0.4), uma vez por anúncio, e pode editar ou apagar; ninguém avalia os próprios anúncios (regras no servidor). (atualizada v0.4)
- D63 Na página do anúncio, a caixa de reserva calcula o **preço** (a combinação mais barata de horas, dias e meses), igual ao que o servidor grava. (atualizada v0.4)

**Reservas**
- D70 Reservas de **lugares e carros**, numa só tabela e com as mesmas regras. O preço e o estado são sempre decididos no servidor. Não há reservas sobrepostas: as confirmadas bloqueiam o período.
- D71 Toda a reserva fica **confirmada** logo (reserva instantânea, regra no servidor). Não há pedidos, aceitar/recusar nem prazos. (atualizada v0.4a — antes havia pedidos com aprovação em 24 h)
- D72 **Cancelar:** o condutor cancela uma reserva confirmada até ao início. O anfitrião cancela uma reserva confirmada, sempre com um **motivo**, que o condutor vê. A política de reembolso fica para a v1.1 (pagamentos).
- D73 **Horário:** num lugar, o período inteiro tem de caber no horário; num carro, levantar e entregar têm de estar dentro do horário. Reservas de **30 dias ou mais** ignoram o horário semanal.
- D74 A **morada exata** e as **instruções de acesso** (no carro: local de recolha, matrícula e instruções) aparecem ao condutor quando a reserva é confirmada, e até ao fim da reserva. São servidas por uma função no servidor, só a esse condutor.
- D75 **Gestão:** o condutor tem a página **Reservas** (Próximas, Anteriores, Canceladas). O anfitrião tem **Hoje** (chegadas, saídas, a decorrer) e **Calendário** (próximos 30 dias), onde pode cancelar com motivo. (atualizada v0.4a)
- D76 Estados mostrados: Confirmada, A decorrer, Concluída, Cancelada (Pedido, Recusada e Expirada só aparecem em reservas antigas). "A decorrer" e "Concluída" vêm das datas.
- D77 **Entrar como (só administrador):** no menu da conta e no Perfil, o admin pode entrar numa das **duas contas de teste** ("Condutor Teste" e "Anfitrião Teste") para experimentar o outro lado, com uma faixa laranja e o botão **Voltar à minha conta**. Nunca contas reais. A troca é feita no servidor (Edge Function `parkncharge-entrar-como`, que confirma que quem pede é admin); a chave de serviço fica só no Supabase. Na primeira entrada, o Anfitrião Teste fica dono de metade dos exemplos (e das reservas deles).

**Mensagens**
- D80 Uma **conversa por anúncio e por condutor** (como no Airbnb): começa com uma pergunta antes de reservar ("Contactar o anfitrião" na página do anúncio) e continua depois; as reservas desse condutor nesse anúncio aparecem no topo da conversa. Também se abre a partir das Reservas (condutor) e do Hoje/Calendário (anfitrião). A mensagem escrita ao reservar também vai para a conversa.
- D81 **Telefones e emails ficam escondidos** (•••) até haver uma reserva confirmada entre os dois nesse anúncio. Feito no servidor, ao gravar a mensagem.
- D82 Só os dois participantes (e o admin) veem a conversa. Ninguém edita nem apaga mensagens. O anfitrião só pode começar uma conversa com quem reservou o anúncio. A página Mensagens separa **Como condutor** e **Como anfitrião**, e a barra inferior mostra o número de conversas por ler.

**Anfitrião**
- D30 Modo anfitrião separado, com "Mudar para anfitrião" / "Mudar para condutor" no perfil. Barra inferior: **Hoje, Calendário, Lugares, Mensagens, Menu**.
- D31 **Aprovação manual** de cada anúncio antes de ficar visível. O anfitrião nunca se auto-aprova (regra no servidor). A aprovação faz-se em `admin.html`, só para administradores.
- D32 Empresas: nome obrigatório, NIF opcional (9 algarismos). Particulares: sem dados extra.
- D33 Entre **1 e 6 fotografias** por lugar; a primeira é a capa (pode-se escolher outra).
- D34 A **morada exata** só é mostrada ao condutor depois de a reserva ser confirmada. Antes disso, o público vê só a zona e uma posição aproximada (~300 m).
- D35 Serviços extra "Clean Up" (lavagem) e "Workshop" (oficina), que estão no Figma, ficam para depois da v1.0.
- D36 Recusar um anúncio exige um motivo, que o anfitrião vê na lista dos seus lugares.

**Dados de exemplo**
- D50 Garagens (12), carros (10) e avaliações (65) de exemplo, em São Mamede de Infesta e arredores, têm sempre o selo **"Exemplo"**, ilustrações próprias, moradas sem número e nomes inventados. Desde a v0.4, o estado Ocupada/Alugado dos exemplos vem de **10 reservas de exemplo** (condutores com nomes inventados), em vez da ocupação simulada. Só o admin pode criar exemplos (regra no servidor). Apagam-se todos antes da beta (v0.8). Scripts: `supabase/seed/exemplos_sao_mamede.sql`, `exemplos_carros_avaliacoes.sql` e `exemplos_reservas.sql`.

**Segurança**
- S01 Nunca pôr chaves privadas no código (só a chave pública do Supabase, via `plataforma-core`). As regras de acesso são RLS no servidor.

---

## Histórico

### v0.5 — 17/10/2026
- **Mensagens** entre condutor e anfitrião (`mensagens.html`):
  - uma conversa por anúncio e por condutor, que começa antes de reservar e continua depois;
  - **Contactar o anfitrião** na página do lugar/carro; botão **Mensagem** nas Reservas (condutor) e no Hoje/Calendário (anfitrião);
  - lista com **Como condutor / Como anfitrião**, último texto, hora e ponto laranja nas por ler; número de por ler na barra inferior;
  - dentro da conversa: as reservas desse condutor nesse anúncio, as mensagens por dia e um campo para escrever (Enter envia; atualiza a cada 8 s);
  - **telefones e emails escondidos** até haver uma reserva confirmada (no servidor), com aviso;
  - a mensagem escrita ao reservar também fica na conversa.
- Base de dados: tabelas `conversations` e `messages`, funções `open_conversation`, `mark_conversation_read`, `unread_conversations`; RLS testada (outro utilizador não vê nem escreve; anfitrião só abre conversa com quem reservou; ninguém edita/apaga).
- Sem emails automáticos por agora (decisão de 17/10/2026).
- Testes: D80, D81, D82.

### v0.4a — 17/10/2026
- **Reservas sempre instantâneas:** o anfitrião deixa de aprovar pedidos. Saiu a escolha do assistente de publicação, o "Pedir reserva", o prazo de 24 h e o Aceitar/Recusar do Hoje. Os 2 pedidos de exemplo pendentes passaram a confirmados. Decisões D09, D71, D75 e D76 atualizadas.
- **Entrar como (só para o administrador):** no menu da conta e no Perfil, "Experimentar como" → Condutor Teste ou Anfitrião Teste, com faixa laranja e "Voltar à minha conta". A troca é feita por uma Edge Function do Supabase que só aceita administradores e só entra nas duas contas de teste. O Anfitrião Teste fica dono de metade dos exemplos. Nova decisão D77.
- Testes: D09, D71 e D75 atualizados; D77 novo; S01 passa a verificar também a Edge Function.

### v0.4 — 17/10/2026
- **Reservas** de lugares e carros:
  - o botão "Reservar" (reserva instantânea) ou "Pedir reserva" (com aprovação) já funciona;
  - escolhe-se início e fim (no carro: levantar e entregar); o site avisa se fica fora do horário ou sobreposto e mostra o total;
  - campos opcionais: veículo (matrícula ou modelo) e mensagem ao anfitrião;
  - sem sessão, o botão leva ao login e volta à página.
- A página do anúncio mostra os períodos **já reservados** e propõe por defeito o primeiro período livre dentro do horário.
- Confirmação no fim: "Reserva confirmada" ou "Pedido enviado" (com o prazo do anfitrião), com o link para as reservas.
- **Reservas** (condutor): Próximas / Anteriores / Canceladas, cancelar dentro das regras, ver a morada e as instruções quando confirmada, avaliar quando concluída.
- **Hoje** e **Calendário** (anfitrião): pedidos por responder (aceitar/recusar), chegadas e saídas do dia, reservas a decorrer e agenda dos próximos 30 dias; cancelar uma confirmada com motivo.
- Avaliações só para quem fez uma reserva concluída (D62 atualizada, confirmado). As avaliações existentes mantêm-se.
- Exemplos: a ocupação simulada foi trocada por 10 reservas de exemplo (3 a decorrer, 3 futuras, 2 pedidos por responder, 2 concluídas).
- Base de dados:
  - migrações `20261017_v04_reservas.sql`, `v04b` e `v04c`;
  - tabela `bookings` com restrição de exclusão contra sobreposições e trigger com todas as regras (horário, preço, estados, prazos, cancelamentos);
  - funções `occupied_now`, `busy_periods`, `expire_requests` e `booking_access`.
  - Regras testadas com 26 casos (condutor, outro condutor, anfitrião, anónimo, admin).
- Segurança: as funções internas dos triggers deixaram de estar expostas na API.

### v0.2c — 10/10/2026
- Página de cada garagem e carro (`lugar.html`, `carro.html`, código em `assets/item.js`):
  - galeria e características (tipo e atributos; no carro: marca, combustível, caixa, lugares, km/dia, idade mínima, caução, extras);
  - carregador, descrição, horário da semana e zona aproximada no mapa (círculo de ~300 m; a morada exata só depois da reserva);
  - avaliações e caixa de reserva com o preço estimado.
- Cartões e pinos do mapa abrem essa página.
- Avaliações e comentários em todos os anúncios: estrelas e média no cartão, resumo com barras, lista, formulário para escrever, editar ou apagar. Uma por pessoa e anúncio, nunca nos próprios (regras no servidor, testadas).
- Avaliações de exemplo (36 em garagens, 29 em carros), com o selo "Exemplo".
- Filtros: várias categorias ao mesmo tempo (o anúncio cumpre todas); "Todos" limpa (D23 alterada, confirmado).
- Cabeçalho sem o botão "Arrendar o meu lugar", que já está no menu da conta (D21 alterada, confirmado).
- Separador **Estacionar | Alugar carro** por cima da pesquisa. "Alugar carro" replica o Explorar com 10 carros de exemplo (6 em São Mamede de Infesta; um deles alugado) e ilustrações próprias.
- Base de dados (migração `20261010_v02c_carros_avaliacoes.sql`): tabelas `cars`, `car_private`, `car_photos`, `car_schedule` (mesmas regras dos lugares) e `reviews`. Publicar carros (anfitrião) fica para a próxima versão.
- Segurança: a função temporária usada para criar os carros de exemplo ficou desativada e sem permissões. Confirmado que não foi usada. Pode ser apagada no Supabase (`drop function parkncharge.tmp_seed_car(jsonb);`).

### v0.2b — 27/09/2026
- Menu da conta: o botão do canto superior direito abre uma janela (antes ia para a página Perfil). No telemóvel aparece um cabeçalho compacto com o mesmo botão. O cabeçalho completo passa a aparecer a partir de 700 px (antes 900 px).
- Explorar (D24 alterada, confirmado): mapa "Perto de si" com as garagens disponíveis mais próximas (pinos com preço, laranja ⚡ se tiver carregador, ponto azul para a localização), lista "Garagens em <localidade>" com todas, mesmo ocupadas, e carrosséis das outras zonas.
- Localização fixa em São Mamede de Infesta (fictícia) com botão "Usar a minha localização" (GPS + localidade pelo OpenStreetMap).
- Estado em cada cartão: Disponível agora / Ocupada / Fechada agora · abre às …
- 12 garagens de exemplo (7 em São Mamede de Infesta, 5 em Senhora da Hora, Custóias, Paranhos, Leça do Balio e Matosinhos), 2 ocupadas, com ilustrações em `assets/demo/`.
- Base de dados: colunas `is_demo` e `demo_occupied` (migração `20260927_v02b_demo.sql`), protegidas no trigger. Testado: um utilizador normal não as consegue ligar nem mexer em exemplos alheios.
- Grelhas sem transbordar em ecrãs médios (colunas `minmax(0, 1fr)`).
- Roadmap: marcados os pontos da v0.3 já feitos.

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
