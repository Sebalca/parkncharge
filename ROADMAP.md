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

## v0.2 — Anúncios (lado do anfitrião)
- [ ] Schema `parkncharge` com RLS: `host_profiles`, `listings`, `listing_photos`, `listing_schedule`
- [ ] Perfil de anfitrião: particular ou empresa (NIF opcional)
- [ ] Criar/editar lugar: morada + ponto no mapa, fotos (Storage), veículos aceites, categorias (solo, subterrâneo, fechado, carregador, acesso fácil), horário semanal, preços hora/dia/mês
- [ ] Carregamento elétrico: tipo de tomada, potência, preço da carga (incluído ou à parte)
- [ ] "Renting Address" = lista dos meus lugares

## v0.3 — Home e pesquisa (lado do condutor)
- [ ] Home "Close to you": mapa (Leaflet + OpenStreetMap) com pinos e tempo a pé, lista em cartões
- [ ] Localização atual ou morada pesquisada
- [ ] Filtros do Figma: categorias, ordenação (melhor avaliados, mais usados, proximidade), veículo, hora de início/fim
- [ ] Pesquisa por proximidade com PostGIS

## v0.4 — Página do lugar e reservas
- [ ] Página do lugar: fotos, atributos, horário, avaliação média, comentários, botão "Reservar"
- [ ] Pedido de reserva com datas/horas e preço calculado
- [ ] Reserva instantânea ou com aprovação do anfitrião
- [ ] Sem reservas sobrepostas (restrição na base de dados)
- [ ] Estados: pedido → confirmada → a decorrer → concluída / cancelada / recusada

## v0.5 — As minhas reservas e comunicação
- [ ] "My rents": reservas como condutor e como anfitrião
- [ ] Mensagens condutor ↔ anfitrião por reserva
- [ ] Emails automáticos (pedido, confirmação, lembrete) via Edge Function
- [ ] Instruções de acesso (código, piso, nº do lugar) só visíveis após confirmação

## v0.6 — Confiança
- [ ] Avaliações e comentários nos dois sentidos, só após reserva concluída
- [ ] Favoritos (coração)
- [ ] Denúncias e painel de administração

## v0.7 — Conta e apoio
- [ ] Menu lateral: perfil, os meus lugares, reservas, ajuda/FAQ, contacto, definições, terminar sessão
- [ ] Perfil global (nome, avatar, telefone) partilhado com a plataforma
- [ ] Páginas de ajuda, FAQ e contacto

## v0.8 — Beta fechada no Porto
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
