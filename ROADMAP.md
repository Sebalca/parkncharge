# Roadmap — Parkncharge

Marketplace de lugares de estacionamento ("Airbnb de parques"), com carregamento elétrico como atributo do lugar.
Lançamento no **Porto**. Site web (PWA) agora, app nativa depois.

**Decisões base**
- Anfitriões: particulares **e** empresas.
- Reservas: por hora, por dia e mensais. O anfitrião escolhe, por anúncio, reserva instantânea ou com aprovação.
- Pagamentos: combinados entre as partes até à v1.0; **Stripe Connect na v1.1**.
- Domínio: `parkncharge.frisk.pt` (login partilhado da plataforma); domínio próprio mais tarde.
- Dados: tabelas próprias num schema `parkncharge` no Supabase partilhado (ver [docs/modelo-dados.md](docs/modelo-dados.md)).
- Design: ecrãs do Figma "First teste parkncharge" em [`design/`](design/).
- Língua: só português (PT) por agora.
- Login: email + Google (conta frisk.pt partilhada). Sem ecrã de arranque.
- Sem conta pode-se ver tudo; a conta só é pedida para reservar ou para publicar um lugar.
- Estrutura inspirada no Airbnb (organização e fluxos, não o aspeto): pesquisa Onde · Início–Fim · Veículo, barra de categorias, carrosséis por zona, barra inferior Explorar / Favoritos / Reservas / Mensagens / Perfil, modo anfitrião separado.
- Carregador é categoria/filtro (sem separador próprio).
- Anúncios com aprovação manual; empresas: nome + NIF opcional; 1 a 6 fotos; morada exata só após reserva confirmada.
- Serviços extra "Clean Up" (lavagem) e "Workshop" (oficina): depois da v1.0.

> Antes de cada versão: perguntas e sugestões para fechar o âmbito. Só depois se implementa.

---

## v0.1 — Esqueleto e identidade
- [x] Repositório `parkncharge`, README e roadmap
- [x] Página provisória com a identidade do Figma (cores, logótipo)
- [x] Cloudflare Pages ligado ao repositório + `parkncharge.frisk.pt`
- [x] Design system em CSS (cores, tipografia, botões, campos, barra inferior de navegação)
- [x] Home provisória (saudação, localização, "Perto de si", convite a anfitriões)
- [x] Login/registo com email + Google, recuperação de palavra-passe, terminar sessão (`auth.js` do `plataforma-core`)
- [x] Registo do site na tabela `sites` do Supabase
- [x] v0.1a — reestruturação à Airbnb (início, pesquisa, categorias, perfil, rodapé, páginas de ajuda)

## v0.2 — Anúncios (lado do anfitrião)
- [x] Schema `parkncharge` com RLS: `host_profiles`, `listings`, `listing_private`, `listing_photos`, `listing_schedule` + bucket `parkncharge`
- [x] Perfil de anfitrião: particular ou empresa (NIF opcional)
- [x] Modo anfitrião (Hoje, Calendário, Lugares, Mensagens, Menu) com "Mudar para anfitrião/condutor"
- [x] Assistente de publicação em 9 passos: tipo, localização (mapa + pesquisa de morada), características, carregador, fotos (1–6, comprimidas), título, horário, preços, rever e enviar
- [x] Aprovação manual (`admin.html`): aprovar, recusar com motivo, retirar
- [x] Morada exata privada; no site só a posição aproximada (~300 m) e a zona
- [x] Lugares aprovados aparecem no início, agrupados por zona
- [x] Menu da conta em janela no canto superior direito *(v0.2b)*
- [x] 12 garagens de exemplo em São Mamede de Infesta e arredores, com selo "Exemplo" e ocupação simulada *(v0.2b — apagar antes da beta)*

## v0.3 — Home e pesquisa (lado do condutor)
- [x] Home "Perto de si": mapa (Leaflet + OpenStreetMap) com as disponíveis mais próximas (pinos com preço, ⚡ com carregador) e tempo a pé *(v0.2b)*
- [x] Lista em cartões das garagens da localidade (mesmo ocupadas), com estado Disponível / Ocupada / Fechada *(v0.2b)*
- [x] Localização atual: São Mamede de Infesta (fictícia) + botão "usar a minha localização" (GPS) *(v0.2b)*
- [x] Morada/zona pesquisada (grelha de resultados) *(v0.1a)*
- [x] Filtros: categorias e veículo *(v0.1a)*; várias categorias ao mesmo tempo *(v0.2c)*
- [ ] Filtros: ordenação (melhor avaliados, mais usados, proximidade) e hora de início/fim a filtrar pelo horário
- [ ] Mapa também nos resultados da pesquisa (alternar lista ↔ mapa no telemóvel)
- [ ] Pesquisa por proximidade no servidor (PostGIS) — por agora a distância é calculada no browser

## Aluguer de carros (nova linha, pedida em 10/10/2026)
- [x] Separador "Alugar carro" por cima da pesquisa, com o Explorar replicado para carros (mapa, localidade, outras zonas, filtros múltiplos) *(v0.2c)*
- [x] Página do carro com características, extras, horário de levantamento, zona, avaliações e preço estimado *(v0.2c)*
- [x] Base de dados de carros com as mesmas regras dos lugares + 10 carros de exemplo *(v0.2c)*
- [ ] Publicar carros no modo anfitrião (assistente) e aprová-los em `admin.html`
- [x] Reservas de carros *(v0.4)*
- [ ] Documentos do condutor (carta de condução) antes de levantar o carro
- [ ] Verificar o enquadramento legal do aluguer entre particulares antes da beta

## v0.4 — Página do lugar e reservas
- [x] Página do lugar: fotos, atributos, horário, zona no mapa, avaliação média, comentários *(v0.2c)*
- [x] Preço calculado para as datas escolhidas *(v0.2c)*
- [x] Botão "Reservar" / "Pedir reserva" a funcionar, para lugares e carros *(v0.4)*
- [x] Pedido de reserva com datas/horas, veículo, mensagem e preço calculado no servidor *(v0.4)*
- [x] Reserva instantânea ou com aprovação do anfitrião (prazo de 24 h ou até ao início) *(v0.4)*
- [x] Sem reservas sobrepostas (restrição na base de dados) e dentro do horário *(v0.4)*
- [x] Estados: pedido → confirmada → a decorrer → concluída / cancelada / recusada / expirada *(v0.4)*

## v0.5 — As minhas reservas e comunicação
- [x] "My rents": Reservas (condutor) e Hoje/Calendário (anfitrião) *(adiantado para a v0.4)*
- [ ] Mensagens condutor ↔ anfitrião por reserva
- [ ] Emails automáticos (pedido, confirmação, lembrete) via Edge Function
- [x] Morada e instruções de acesso só visíveis após confirmação *(adiantado para a v0.4)*

## v0.6 — Confiança
- [x] Avaliações e comentários dos anúncios (estrelas + texto, 1 por pessoa, editar/apagar) *(v0.2c — por agora qualquer conta)*
- [x] Avaliações só após reserva concluída *(v0.4)*
- [ ] Avaliações do anfitrião ao condutor (nos dois sentidos)
- [ ] Favoritos (coração)
- [ ] Denúncias e painel de administração

## v0.7 — Conta e apoio
- [ ] Menu lateral: perfil, os meus lugares, reservas, ajuda/FAQ, contacto, definições, terminar sessão
- [ ] Perfil global (nome, avatar, telefone) partilhado com a plataforma
- [ ] Páginas de ajuda, FAQ e contacto

## v0.8 — Beta fechada no Porto
- [ ] Apagar os exemplos (`delete from parkncharge.bookings where is_demo; delete from parkncharge.reviews where is_demo; delete from parkncharge.listings where is_demo; delete from parkncharge.cars where is_demo;`)
- [ ] PWA instalável (manifest, ícones, offline básico)
- [ ] Termos de utilização e política de privacidade (RGPD)
- [ ] Pagamento combinado entre as partes (indicação clara na reserva)
- [ ] Primeiros anfitriões convidados

## v0.9 — Pré-lançamento
- [ ] Revisão de segurança (RLS, advisors do Supabase)
- [ ] Testes em telemóvel e desktop
- [ ] SEO: páginas por zona do Porto
- [ ] Métricas de uso

## v1.0 — Lançamento público no Porto

---

## v1.1 — Pagamentos
- [ ] Stripe Connect (onboarding dos anfitriões, KYC)
- [ ] "Payment Methods" no perfil
- [ ] Comissão da plataforma, política de cancelamento e reembolsos

## Mais tarde
- Premium (ecrã já previsto no Figma)
- Serviços extra: lavagem ("Clean Up") e oficina ("Workshop")
- Domínio próprio (ex.: parkncharge.pt)
- App nativa
- Outras cidades
- Integração com carregadores inteligentes
