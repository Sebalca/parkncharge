# Parkncharge — parkncharge.frisk.pt

## Objetivo

Um **"Airbnb de estacionamento"** para o Porto: um mercado onde quem tem um lugar livre o arrenda a quem precisa de estacionar.

- **Anfitriões** (particulares e empresas) publicam garagens, boxes, lugares em parques ou logradouros. Arrendam à hora, ao dia ou ao mês e ganham dinheiro com espaço que não usam.
- **Condutores** encontram um lugar perto do destino, filtram pelo que precisam (coberto, fechado, para carrinha…) e reservam.
- **Carregamento elétrico** é um atributo do lugar: o anfitrião indica o tipo de ligação, a potência e se a energia está incluída ou é paga à parte por kWh. Daí o nome *park 'n' charge*.
- **Aluguer de carros** (desde a v0.2c): no mesmo site, um separador "Alugar carro" para alugar carros de particulares e empresas à hora, ao dia ou ao mês, com a mesma lógica dos lugares.
- **Confiança:** cada anúncio é revisto antes de ficar visível. A morada exata só é revelada depois de a reserva ser confirmada. Cada anúncio tem avaliações e comentários; mais tarde serão nos dois sentidos e só depois de uma reserva.
- **Modelo de negócio (v1.1):** pagamentos dentro da plataforma com Stripe Connect e uma comissão por reserva. Até lá o pagamento é combinado entre as partes, para validar a procura.

O site faz parte da **plataforma `*.frisk.pt`**: vários sites que partilham a mesma infraestrutura (GitHub + Supabase + Cloudflare) e o mesmo sistema de contas. Um utilizador cria a conta uma vez e usa-a em todos os sites. Os dados do Parkncharge ficam separados dos outros sites.

A estrutura segue a do Airbnb (organização e fluxos: pesquisa, categorias, cartões, modo anfitrião, assistente de publicação). A identidade visual é a do Figma **"First teste parkncharge"** (ecrãs em [`design/`](design/)).

Plano de versões: [ROADMAP.md](ROADMAP.md) · Histórico e regras que não se podem quebrar: [PATCH NOTES.md](PATCH%20NOTES.md) · Base de dados: [docs/modelo-dados.md](docs/modelo-dados.md).

---

## Como está construído

| Peça | Para quê |
|---|---|
| **HTML + CSS + JavaScript puro** | Uma página HTML por ecrã, com CSS e JS comuns em `assets/`. Sem framework nem passo de build. |
| **GitHub** (`Sebalca/parkncharge`) | Código e versões. Cada `push` para `main` publica o site. |
| **Cloudflare Pages** (projeto `parkncharge`) | Serve a raiz do repositório em `parkncharge.frisk.pt` e `parkncharge.pages.dev` (DNS, SSL, CDN). |
| **Supabase** (projeto partilhado **"Sites"**) | Contas (login), base de dados PostgreSQL (schema `parkncharge`) e Storage (fotografias). |
| **plataforma-core** (`auth.js`) | Módulo partilhado por todos os sites: cliente Supabase com a chave **pública** e sessão guardada num cookie de `.frisk.pt`, para o login valer em todos os subdomínios. |
| **Leaflet + OpenStreetMap** | Mapa para marcar o lugar (tiles OSM) e pesquisa de moradas (Nominatim). Gratuitos, sem chave. |

### Ficheiros

```
index.html          Explorar: separadores Estacionar | Alugar carro, pesquisa, categorias, mapa, anúncios (público)
lugar.html          página de um lugar (?id=…)
carro.html          página de um carro (?id=…)
login.html          entrar / criar conta / recuperar palavra-passe
perfil.html         perfil e menu (modo condutor ou anfitrião)
anfitriao.html      modo anfitrião: os meus lugares, dados de anfitrião, Hoje, Calendário
publicar.html       assistente de publicação/edição de um lugar (9 passos)
admin.html          aprovação de anúncios (só administradores)
favoritos.html      em breve (v0.6)
reservas.html       em breve (v0.4)
mensagens.html      em breve (v0.5)
ajuda.html          centro de ajuda (âncoras #sobre, #anfitrioes, #carregadores, #cancelamentos, #seguranca)
termos.html         termos (em preparação, v0.8)
privacidade.html    privacidade / RGPD (em preparação, v0.8)
assets/app.js       código comum (objeto global PNC)
assets/item.js      página de um anúncio (lugar ou carro): galeria, características, avaliações, preço
assets/style.css    design system
assets/icon.svg     favicon
assets/demo/*.svg   ilustrações das garagens de exemplo
design/             ecrãs de referência do Figma
docs/modelo-dados.md          tabelas, regras e estado da base de dados
supabase/migrations/          SQL aplicado no Supabase, por ordem
supabase/seed/exemplos_sao_mamede.sql   cria (ou recria) as 12 garagens de exemplo
supabase/seed/exemplos_carros_avaliacoes.sql   cria os 10 carros e as avaliações de exemplo
tests/regressao.cjs           testes automáticos (Playwright)
CLAUDE.md                     processo obrigatório para cada alteração
PATCH NOTES.md                decisões fixas + histórico de versões
ROADMAP.md                    plano de versões até à v1.0 (e v1.1)
```

Cada página carrega, por esta ordem: `assets/app.js`, `supabase-js@2` (jsDelivr) e `plataforma-core@main/auth.js` (jsDelivr). Se o Supabase não carregar (sem rede), as páginas públicas continuam a abrir, só que sem lugares.

### Código comum (`assets/app.js` → `window.PNC`)

| Função / constante | Para quê |
|---|---|
| `APP_VERSAO` | Versão atual (rodapé e Perfil). Atualizar em cada alteração, junto com o `?v=` dos ficheiros em `assets/` nas páginas. |
| `renderChrome({active, host, header, footer})` | Desenha o cabeçalho (logótipo + **menu da conta**, a janela do canto superior direito), a barra inferior (telemóvel) e o rodapé. `host: true` usa a barra e o menu do anfitrião. |
| `MODES` | Configuração dos dois tipos de anúncio, `lugares` e `carros`: tabela, horário, página, categorias, títulos e campos a ler. O Explorar e a página do anúncio usam a mesma lógica para os dois. |
| `CAR_CATEGORIES`, `CAR_LABELS`, `SEATS` | Categorias de carros, nomes em português (combustível, caixa, extras) e opções de lugares mínimos. |
| `matchAll(lista, categorias, ids)` | Filtra por várias categorias ao mesmo tempo (o anúncio tem de cumprir todas). |
| `ratingOf()`, `fmtRating()`, `stars()` | Média e número de avaliações, formato "4,5" e estrelas em SVG. |
| `estimate(anúncio, início, fim)` | Preço estimado: a combinação mais barata de horas, dias (com horas a mais) e meses. |
| `DEFAULT_LOC` | Localização por defeito (fictícia): São Mamede de Infesta. |
| `openNow()`, `nextOpening()`, `availability(l)` | Estado de um lugar agora: `disponivel`, `ocupada` (simulada, `demo_occupied`) ou `fechada` (fora do horário, com a próxima abertura). |
| `db()` | Cliente Supabase já apontado para o schema `parkncharge` (`plataforma.schema('parkncharge')`). |
| `photoUrl(path)`, `BUCKET` | URL pública de uma fotografia no bucket `parkncharge` (ou do próprio site, para caminhos `assets/…` dos exemplos). |
| `currentUser()`, `requireLogin()`, `isAdmin()`, `displayName(user)` | Sessão. `requireLogin` envia para `login.html?next=…` e volta depois de entrar. O nome e o avatar vêm de `public.profiles`. |
| `CATEGORIES`, `VEHICLES`, `SPOT_TYPES`, `ZONES`, `CHARGERS`, `WEEKDAYS`, `STATUS` | Catálogos usados em todo o site (categorias com a função `match` do filtro, tipos de veículo, zonas do Porto…). |
| `icon(nome)`, `LOGO` | Ícones SVG inline e logótipo. |
| `euro()`, `mainPrice()`, `distance()`, `walkText()`, `esc()` | Formatação de preços (pt-PT), distância (haversine), minutos a pé e escape de HTML. |
| `toast()`, `authError()`, `dbError()` | Mensagens ao utilizador, com os erros do Supabase traduzidos. As mensagens dos triggers já vêm em português. |

### Design system (`assets/style.css`)

- Cores do Figma como variáveis CSS: `--pnc-blue #436E91`, `--pnc-cream #F3E9B5` (campos e chips), `--pnc-orange #E95322` (ações principais, pinos), `--pnc-bg #F5F5F5`, `--pnc-text #3A1D17`.
- Letras: Josefin Sans (títulos) e Lato (texto), do Google Fonts.
- Padrão dos ecrãs: zona azul no topo e uma "folha" clara com cantos arredondados por cima, como no Figma.
- Componentes: `.searchbar`, `.cats/.cat`, `.card`, `.rail`, `.grid-cards`, `.btn` (`.orange`, `.ghost`, `.danger`, `.small`), `.chip`, `.input`, `.switch`, `.option`, `.host-item`, `.status`, `.nav`, `.site-footer`, `.toast`.
- Primeiro para telemóvel: cabeçalho compacto (logótipo + botão da conta) e barra inferior.
- A partir de 700 px aparece o cabeçalho completo e o rodapé, a barra inferior esconde-se, a pesquisa mostra os três campos e as grelhas passam a 3 colunas (4 a partir de 1000 px, 5 a partir de 1300 px).

---

## Como funciona o site

### Explorar (`index.html`) — condutor, público
- **Separadores Estacionar | Alugar carro** por cima da pesquisa (`?tipo=carros`). Os dois modos são a mesma página com a configuração de `PNC.MODES`. O que muda é a tabela lida, as categorias, o terceiro campo da pesquisa (Veículo nos lugares, Lugares mínimos nos carros), os títulos e a página de destino.
- **Pesquisa** em pílula (Onde · Quando · Veículo) que abre um painel com:
  - zona, rua ou local (com sugestões das zonas do Porto) e botão "usar a minha localização";
  - início e fim;
  - veículo: Mota, Carro, Carrinha, Autocarro, Camião ou Autocaravana.
- A pesquisa fica no endereço (`?tipo=carros&onde=Boavista&inicio=…&fim=…&lugares=5&cat=eletrico,automatico`), por isso pode ser partilhada.
- **Categorias** em barra horizontal. **Podem ligar-se várias ao mesmo tempo** e o anúncio tem de cumprir todas; "Todos" limpa.
  - Lugares: Com carregador, Coberto, Subterrâneo, Fechado, Acesso fácil, Lugar só seu, Mensal, Motas, Carrinhas.
  - Carros: Elétrico, Híbrido, Automático, Citadino, Familiar, SUV, 7 lugares, Carrinhas, Cadeira de bebé, Engate.
- **Anúncios:** lê até 300 anúncios **ativos** do Supabase, com o horário (`listing_schedule` / `car_schedule`) e as notas das avaliações (`reviews(rating)`), e filtra no browser. Os dados de cada modo ficam em memória ao trocar de separador. Categorias, veículo e lugares filtram todas as secções.
- **Localização:** por agora arranca sempre em **São Mamede de Infesta** (fictícia).
  - "Usar a minha localização" passa ao GPS e descobre a localidade (Nominatim, reverse).
  - Se isso falhar, usa a zona do lugar mais próximo.
- **Sem pesquisa por texto**, a página tem três partes:
  1. **Perto de si:** mapa (Leaflet + OpenStreetMap) com a localização (ponto azul) e as garagens **disponíveis agora** mais próximas (até 8, num raio de 5 km).
     - Cada pino mostra o preço; é laranja com ⚡ se tiver carregador.
     - O popup mostra título, zona, minutos a pé e preço.
     - Os pinos usam a posição aproximada (~300 m). Os que calham no mesmo ponto são afastados um pouco.
  2. **Garagens em <localidade>:** todas as da localidade, **mesmo ocupadas**. Aparecem por esta ordem: disponíveis, fechadas, ocupadas; dentro de cada grupo, pela distância.
  3. **Lugares em <outra zona>:** carrosséis das outras zonas, das mais próximas para as mais longe.
- **Com pesquisa por texto** (zona ou título): grelha de resultados.
- **Estado de cada lugar** (`PNC.availability`):
  - **Disponível agora:** aberto pelo horário semanal e livre;
  - **Ocupada:** ocupação simulada (`demo_occupied`) até às reservas da v0.4;
  - **Fechada agora · abre … às …:** fora do horário.
- **Cartão** (é um link para a página do anúncio):
  - foto de capa, selos "Carregador"/"Elétrico" e **"Exemplo"**, ❤ (favoritos, só visual até à v0.6);
  - título, ★ média (número de avaliações) ou "Novo", zona e minutos a pé;
  - coberto/carregador, ou combustível · caixa · lugares nos carros;
  - estado e preço principal (hora → dia → mês).
  - Os que não estão disponíveis ficam com a foto mais apagada. Os carros mostram "Alugado" / "Indisponível agora".
- **Por fazer:** as datas da pesquisa ainda não filtram. Mapa nos resultados e ordenação chegam na v0.3.
- Destaque "Tem um lugar livre?" e lista de zonas do Porto (links de pesquisa, também para SEO).

### Página do anúncio (`lugar.html`, `carro.html` → `assets/item.js`)
- O tipo vem de `<body data-tipo="lugar|carro">` e o anúncio do `?id=`. A página lê o anúncio com o horário e as fotos, e as avaliações à parte. **Nunca lê dados privados** (morada exata, matrícula).
- **Topo:** voltar, título, ★ média · n.º de avaliações (link para a secção), zona, selo "Exemplo", galeria (1 foto grande + 2 ao lado no computador).
- **Características:**
  - lugar: tipo, coberto, subterrâneo, fechado, só seu, acesso fácil, altura máxima, veículos aceites, tipo de reserva; bloco do carregador (ligação, kW, energia incluída ou €/kWh);
  - carro: marca/modelo, categoria e ano, combustível e autonomia, caixa, lugares/portas, km incluídos por dia, idade mínima, caução, tipo de reserva; extras (ar condicionado, GPS…).
- **Descrição**, **horário** da semana (o dia de hoje a negrito) e **zona** num mapa com um círculo de ~300 m. A morada exata é enviada depois da reserva.
- **Avaliações:**
  - média grande, estrelas e barras por número de estrelas, depois a lista (nome, mês, estrelas, comentário; selos "Exemplo" e "A sua avaliação").
  - Formulário de 1 a 5 estrelas + comentário: publicar, editar ou apagar a sua.
  - Sem sessão aparece "entre na sua conta"; o dono do anúncio vê que não pode avaliar.
- **Caixa de reserva** (fixa ao lado no computador; no telemóvel aparece logo depois da galeria):
  - preços (hora, dia, mês) e estado agora;
  - início e fim (ou levantar e entregar), com o total estimado (`PNC.estimate`);
  - botão "Reservas em breve" (desativado até à v0.4).

### Menu da conta (janela do canto superior direito)
- O botão ☰ + avatar abre uma **janela**, não uma página, em todas as páginas (também no telemóvel).
- **Sem sessão:** Entrar, Criar conta, Arrendar o meu lugar, Centro de ajuda.
- **Com sessão:**
  - nome e email;
  - Mudar para anfitrião/condutor;
  - atalhos: Reservas/Favoritos/Mensagens ou Os meus lugares/Publicar/Dados de anfitrião;
  - Aprovação de anúncios (admin), Perfil, Centro de ajuda, Terminar sessão.
- A versão aparece no canto da janela.
- Fecha ao clicar fora ou com Esc, mas não quando se carrega dentro e se larga fora. O avatar (ou a inicial) aparece no botão quando há sessão.

### Conta (`login.html`, `perfil.html`)
- Separadores **Entrar / Criar conta**, com email + palavra-passe e **Continuar com Google**.
  - Ao criar conta, o nome vai para `public.profiles` (global da plataforma).
  - Se o Supabase pedir confirmação de email, aparece um aviso.
- **Recuperar palavra-passe:** envia um email com um link que volta a `login.html`, onde se define a nova palavra-passe (evento `PASSWORD_RECOVERY`).
- `?next=/…` volta à página de onde se veio; só aceita caminhos internos.
- **Perfil:** cartão com nome, email e avatar, e o botão **Mudar para anfitrião / condutor**. O menu tem:
  - como condutor: reservas e favoritos;
  - como anfitrião: os meus lugares, dados de anfitrião e publicar;
  - para administradores: "Aprovação de anúncios";
  - ajuda e terminar sessão.

### Modo anfitrião (`anfitriao.html`)
- Barra inferior própria: **Hoje, Calendário, Lugares, Mensagens, Menu**.
- **Primeira vez:** escolher **Particular** ou **Empresa** (nome obrigatório, NIF opcional com 9 algarismos) → `parkncharge.host_profiles`. Pode ser alterado em "Dados de anfitrião" (`?v=perfil`).
- **Os meus lugares:** lista com a foto, o estado e ações que dependem do estado.

  | Estado | Significado | Ações |
  |---|---|---|
  | Rascunho | ainda não enviado | Continuar, Apagar |
  | Em análise | à espera de aprovação | Ver, Retirar da análise |
  | Ativo | visível no Explorar | Editar, Pausar |
  | Recusado | com o motivo à vista | Corrigir e reenviar, Apagar |
  | Pausado | escondido pelo anfitrião | Reativar, Editar |

- **Hoje** e **Calendário:** por agora só explicam que chegam com as reservas (v0.4).

### Publicar um lugar (`publicar.html`)
Assistente em 9 passos, com barra de progresso. **Cada passo é guardado ao carregar em "Seguinte"**, por isso um rascunho pode ser continuado mais tarde (`?id=…`).

1. **Tipo:** Garagem, Box, Lugar coberto, Lugar descoberto ou Parque. Preenche os atributos prováveis por defeito.
2. **Localização:**
   - pesquisa de morada (Nominatim, só Portugal) ou clique/arrasto do marcador no mapa;
   - código postal e zona;
   - a morada e as coordenadas vão para `listing_private` (privado).
3. **Características:** veículos aceites, coberto, subterrâneo, fechado, lugar só seu, acesso fácil, altura máxima.
4. **Carregador:** tipo (Schuko, Tipo 2, CCS, CHAdeMO, outro), potência, energia incluída ou preço por kWh.
5. **Fotografias:** 1 a 6.
   - Cada foto é reduzida no browser (máx. 1600 px, JPEG) e enviada para `parkncharge/{user}/{lugar}/{uuid}.jpg`.
   - Pode-se apagar e escolher a capa (★).
6. **Título** (sugerido a partir do tipo, zona e carregador) e descrição.
7. **Horário semanal:** dia a dia, com as opções "24 h" e os atalhos "24 h, todos os dias" e "Dias úteis 8h–20h".
8. **Preços:** hora, dia e/ou mês (pelo menos um). Escolher entre **reserva instantânea** e **aprovo cada pedido**.
9. **Rever** tudo, acrescentar as **instruções de acesso** (privadas) e **Enviar para aprovação**. Num anúncio ativo, o botão é "Guardar alterações".

### Aprovação (`admin.html`) — só administradores
- Só entra quem tem `public.profiles.is_admin = true`. A página verifica com a função `parkncharge.is_admin()`, e as regras do servidor também.
- Filtros Pendentes / Ativos / Recusados / Pausados. Cada anúncio mostra:
  - fotos (clicáveis);
  - morada com link para o mapa;
  - anfitrião (particular ou empresa, NIF);
  - atributos, carregador, horário, tipo de reserva, descrição e instruções de acesso.
- **Aprovar** publica o anúncio (grava `approved_at` e `approved_by`). **Recusar** e **Retirar** pedem sempre um motivo, que o anfitrião vê.

---

## Dados

Tudo no projeto Supabase partilhado **"Sites"** (`aehitgqsfcpzuunyzpsh`), em duas partes:

| Dado | Onde |
|---|---|
| Nome, email, avatar (globais da conta frisk.pt) | `auth.users` + `public.profiles` |
| Registo do site na plataforma | `public.sites` (id `parkncharge`) |
| Perfil de anfitrião (particular/empresa, NIF) | `parkncharge.host_profiles` |
| Anúncios (dados públicos, estado, preços, atributos, posição aproximada) | `parkncharge.listings` |
| Morada exata, coordenadas, instruções de acesso | `parkncharge.listing_private` |
| Fotografias (caminho e ordem) | `parkncharge.listing_photos` + bucket Storage `parkncharge` |
| Horário semanal | `parkncharge.listing_schedule` |
| Carros (dados públicos), fotos, horário de levantamento | `parkncharge.cars`, `car_photos`, `car_schedule` |
| Local exato de recolha, matrícula, instruções | `parkncharge.car_private` |
| Avaliações (lugares e carros) | `parkncharge.reviews` |

Descrição completa das colunas e das próximas tabelas (reservas, mensagens, favoritos): [docs/modelo-dados.md](docs/modelo-dados.md). O SQL está em [`supabase/migrations/`](supabase/migrations/).

### Regras no servidor (triggers)
- **`listings_guard`** (antes de inserir/alterar um anúncio):
  - o dono nunca muda;
  - quem não é admin só pode passar **rascunho/recusado → pendente**, **pendente → rascunho** e **ativo ↔ pausado**, por isso nunca se auto-aprova;
  - ao enviar para análise, verifica título, tipo, zona, pelo menos um preço, morada, pelo menos uma foto e os dados do carregador (se tiver);
  - quando o admin aprova, grava quem e quando.
- **`sync_approx_location`:** ao gravar a morada, calcula `approx_lat/approx_lng` numa grelha de ~300 m. É esta posição que o público vê.
- **`photos_limit` / `photos_cover`:** máximo de 6 fotografias; a de menor `position` passa a `cover_photo`.
- **Carros:** `cars_guard`, `sync_car_approx`, `car_photos_limit` e `car_photos_cover` fazem o mesmo para os carros. Ao enviar para análise exigem categoria, combustível, caixa, lugares, local de recolha e fotografia.
- **`reviews_guard`** (avaliações):
  - o autor é sempre quem tem a sessão;
  - o nome mostrado é o primeiro nome do perfil, copiado (o perfil não é público);
  - só se avaliam anúncios ativos e nunca os próprios;
  - quem não é admin não pode criar exemplos nem mudar o autor ou o anúncio.
  - Índices únicos garantem uma avaliação por pessoa e anúncio.

### Segurança (RLS)
| Tabela | Quem lê | Quem escreve |
|---|---|---|
| `listings` | todos veem os **ativos**; o dono vê os seus; o admin vê tudo | o dono (e o admin, para aprovar) |
| `listing_private` | só o dono e o admin | só o dono |
| `listing_photos`, `listing_schedule` | quem pode ver o anúncio | só o dono |
| `host_profiles` | o próprio e o admin | o próprio |
| `cars`, `car_photos`, `car_schedule` | iguais a `listings` e às suas fotos/horário | o dono (e o admin) |
| `car_private` | só o dono e o admin | só o dono |
| `reviews` | todos | o autor (inserir, editar, apagar); o admin pode apagar |
| Storage `parkncharge` | leitura pública (fotos dos anúncios) | só na pasta `{user_id}/` do próprio; máx. 5 MB; JPEG, PNG ou WebP |

- As regras foram testadas com SQL como anónimo, outro utilizador, dono e admin.
- No código só existe a **chave pública** do Supabase (via `plataforma-core`). Service keys e passwords **nunca** vão para o GitHub nem para o browser.

---

## Desenvolvimento

### Processo (ver `CLAUDE.md`)
1. Esclarecer o pedido antes de mexer: perguntas e sugestões.
2. Confirmar que não contraria nenhuma **decisão fixa** do `PATCH NOTES.md`; se contrariar, avisar e pedir confirmação.
3. Implementar. Mudanças na base de dados vão numa **nova** migração em `supabase/migrations/`, aplicada no Supabase, com a RLS testada.
4. Correr os testes (0 falhas).
5. Registar no `PATCH NOTES.md`:
   - letra seguinte (`v0.2a` → `v0.2b`) para ajustes;
   - `v0.3`, `v0.4`… para versões do roadmap, marcadas também no `ROADMAP.md`.
6. Atualizar `APP_VERSAO` em `assets/app.js` e, se preciso, este README e o modelo de dados.
7. Commit e push para `main` (publica sozinho) e verificar o site.

### Testes
```bash
NODE_PATH=$(npm root -g) node tests/regressao.cjs
```
- Os testes abrem o site com o Playwright (Chromium), **sem sessão e sem rede**: o Supabase, as letras e os mapas são bloqueados.
- Verificam as páginas (navegação, pesquisa, categorias, carrosséis/grelha, erros de JavaScript) e as regras do servidor no SQL das migrações.
- Cada teste tem o código de uma **decisão fixa** (D01, D21, D31…): se um falhar, alguma regra combinada foi quebrada.

### Correr localmente
Servir a pasta (`python3 -m http.server` ou `npx serve .`) e abrir `http://localhost:8000`.
- O login e os dados precisam de rede (Supabase).
- Em `localhost` a sessão não é partilhada com os outros sites, porque o cookie é do domínio `.frisk.pt`.

### Publicação
- **Cloudflare Pages** (projeto `parkncharge`, ligado ao GitHub): cada push para `main` publica em ~1 minuto.
- Configuração: sem framework, sem comando de build, pasta de saída `/`.
- Domínio personalizado `parkncharge.frisk.pt` (CNAME para `parkncharge.pages.dev`).
- O browser guarda `assets/*` em cache durante 4 h (`max-age=14400`). Por isso cada página carrega `assets/app.js?v=<versão>` e `assets/style.css?v=<versão>`: ao mudar a versão, todos recebem os ficheiros novos.

### Supabase (configuração feita)
- Schema `parkncharge` criado com `supabase/migrations/20260926_v02_listings.sql` e **exposto** em Integrations → Data API → Exposed schemas.
- Authentication → URL Configuration → Redirect URLs: `https://*.frisk.pt/**` e `https://parkncharge.pages.dev/**`. São necessários para o Google, a confirmação de email e a recuperação de palavra-passe.
- Administradores: `public.profiles.is_admin = true`.
- Pendente (plataforma): ativar "Leaked password protection" em Authentication → Attack Protection.

### Serviços externos
- jsDelivr: `@supabase/supabase-js@2`, `sebalca/plataforma-core@main/auth.js`, `leaflet@1.9.4` (Explorar e assistente).
- Google Fonts: Josefin Sans e Lato.
- OpenStreetMap: tiles do mapa (Explorar e assistente) e Nominatim (pesquisa de moradas no assistente; localidade ao usar o GPS). O uso é leve: uma pesquisa por clique. Se o tráfego crescer, passar para um fornecedor com chave.

### Exemplos (garagens, carros e avaliações)
- **12 garagens fictícias:** 7 em São Mamede de Infesta e 5 em Senhora da Hora, Custóias, Paranhos, Leça do Balio e Matosinhos. 2 estão ocupadas e 1 só abre em dias úteis.
- **10 carros fictícios:** 6 em São Mamede de Infesta e 4 em Senhora da Hora, Paranhos, Custóias e Matosinhos. Há elétricos, híbrido, 7 lugares, carrinha e GPL; 1 está alugado e 2 só existem em dias úteis.
- **65 avaliações de exemplo** (2 a 4 por anúncio), com nomes inventados.
- Tudo na conta do administrador, com `is_demo = true`, o selo "Exemplo", ilustrações em `assets/demo/` e moradas sem número de porta.
- **Recriar:** correr `supabase/seed/exemplos_sao_mamede.sql` e depois `supabase/seed/exemplos_carros_avaliacoes.sql` no editor SQL do Supabase.
- **Apagar tudo** (antes da beta, v0.8): `delete from parkncharge.listings where is_demo; delete from parkncharge.cars where is_demo; delete from parkncharge.reviews where is_demo;`

### Limitações conhecidas (v0.2c)
- Favoritos, Reservas e Mensagens são páginas "em breve". O botão de reservar mostra só o preço estimado.
- Os carros ainda não se publicam pelo modo anfitrião (só existem os de exemplo); a aprovação em `admin.html` é só de lugares.
- As avaliações são abertas a qualquer conta até haver reservas (v0.4).
- As datas da pesquisa ainda não filtram.
- A ocupação é simulada nos exemplos; os lugares reais só ficam "ocupados" com as reservas (v0.4).
- A localização arranca fixa em São Mamede de Infesta até se usar o GPS.
- A distância usa a posição aproximada (~300 m) e é calculada no browser (PostGIS mais tarde).
- Termos e privacidade ainda por escrever (antes da beta, v0.8).
