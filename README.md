# parkncharge.frisk.pt

Marketplace de lugares de estacionamento — tipo Airbnb — com carregamento elétrico como atributo do lugar.
Particulares e empresas disponibilizam lugares; condutores reservam à hora, ao dia ou ao mês. Lançamento no Porto.

Parte da plataforma **frisk.pt**: conta única partilhada com os outros sites (login via [`plataforma-core`](https://github.com/Sebalca/plataforma-core)).

- **Roadmap:** [ROADMAP.md](ROADMAP.md)
- **Modelo de dados:** [docs/modelo-dados.md](docs/modelo-dados.md)
- **Design (Figma "First teste parkncharge"):** [design/](design/)

## Estrutura
```
index.html          # Explorar: pesquisa, categorias, lugares por zona (público)
login.html          # entrar / criar conta / recuperar palavra-passe
perfil.html         # perfil e menu (condutor / anfitrião)
anfitriao.html      # modo anfitrião: os meus lugares, dados de anfitrião
publicar.html       # assistente de publicação (9 passos)
admin.html          # aprovação de anúncios (só administradores)
favoritos.html, reservas.html, mensagens.html  # em breve
ajuda.html, termos.html, privacidade.html
supabase/migrations # SQL aplicado no projeto Supabase "Sites"
assets/style.css    # design system (cores/tipografia do Figma)
assets/app.js       # ícones, barra de navegação, utilitários
assets/icon.svg     # favicon
design/             # ecrãs de referência do Figma
docs/               # modelo de dados e notas técnicas
```
Site estático em HTML/CSS/JS, sem build. Funciona aberto localmente e no Cloudflare Pages.

## Identidade (do Figma)
| Token | Cor |
|---|---|
| Azul principal | `#436E91` |
| Creme (campos/chips) | `#F3E9B5` |
| Laranja (destaques, pinos) | `#E95322` |
| Fundo | `#F5F5F5` |
| Texto | `#3A1D17` |

## Deploy (Cloudflare Pages)
1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → `parkncharge`.
   - Framework preset: *None* · Build command: *(vazio)* · Output directory: `/`
2. Custom domains → `parkncharge.frisk.pt`.
3. Supabase (projeto partilhado "Sites"):
   - Authentication → URL Configuration → Redirect URLs: `https://*.frisk.pt/**` e `https://parkncharge.pages.dev/**` ✔
   - Integrations → Data API → Exposed schemas: `parkncharge` ✔

## Segurança
- Só a chave pública (publishable/anon) do Supabase no frontend; tudo protegido por RLS.
- Service keys e segredos apenas em GitHub Secrets / variáveis da Cloudflare.

## Versões
- **v0.1** — design system, login partilhado (email + Google). Só PT. v0.1.1: estrutura à Airbnb.
- **v0.2** — modo anfitrião, assistente de publicação, aprovação manual, schema `parkncharge`.
- Ver [ROADMAP.md](ROADMAP.md) para v0.2 → v1.0 e v1.1 (Stripe).
