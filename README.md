# parkncharge.frisk.pt

Marketplace de lugares de estacionamento — tipo Airbnb — com carregamento elétrico como atributo do lugar.
Particulares e empresas disponibilizam lugares; condutores reservam à hora, ao dia ou ao mês. Lançamento no Porto.

Parte da plataforma **frisk.pt**: conta única partilhada com os outros sites (login via [`plataforma-core`](https://github.com/Sebalca/plataforma-core)).

- **Roadmap:** [ROADMAP.md](ROADMAP.md)
- **Modelo de dados:** [docs/modelo-dados.md](docs/modelo-dados.md)
- **Design (Figma "First teste parkncharge"):** [design/](design/)

## Estrutura
```
index.html          # v0.1: página provisória
assets/style.css    # tokens de design (cores/tipografia do Figma)
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

## Segurança
- Só a chave pública (publishable/anon) do Supabase no frontend; tudo protegido por RLS.
- Service keys e segredos apenas em GitHub Secrets / variáveis da Cloudflare.

## Versões
- **v0.1** (em curso) — esqueleto, identidade, página provisória, login partilhado.
- Ver [ROADMAP.md](ROADMAP.md) para v0.2 → v1.0 e v1.1 (Stripe).
