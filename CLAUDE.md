# Instruções para o Claude — repositório `parkncharge`

Site: parkncharge.frisk.pt (Cloudflare Pages, sem build; cada push para `main` publica).
Base de dados: projeto Supabase partilhado "Sites" (`aehitgqsfcpzuunyzpsh`), schema `parkncharge`.
Responder sempre em português de Portugal, de forma concisa.

## Processo obrigatório em cada alteração

1. **Perguntar antes** de alterar ou começar uma versão: fazer perguntas e dar sugestões (o Sebastião prefere clarificar primeiro).
2. **Ler `PATCH NOTES.md` → "Decisões fixas"** e confirmar que o pedido não contraria nenhuma.
   Se contrariar (ou uma versão nova do `ROADMAP.md` o fizer), **avisar e pedir confirmação antes de mexer**; se ele confirmar, atualizar a decisão.
3. Implementar. Alterações à base de dados: nova migração em `supabase/migrations/` (nunca editar uma já aplicada), aplicar no Supabase e testar a RLS com SQL (anónimo, outro utilizador, dono, admin).
4. **Correr os testes**: `NODE_PATH=$(npm root -g) node tests/regressao.cjs` — tem de dar 0 falhas.
   Uma falha = uma decisão fixa quebrada: corrigir, ou avisar se a mudança foi pedida (e então atualizar o teste e a decisão).
5. **Registar** no `PATCH NOTES.md` (nova entrada no topo do Histórico):
   - alteração pedida entre versões → letra seguinte (`v0.2a` → `v0.2b`);
   - nova versão do roadmap → `v0.3`, `v0.4`… (e marcar no `ROADMAP.md`).
   Se o pedido criar uma regra nova ("quero sempre…", "nunca…"), acrescentá-la às Decisões fixas e, se possível, um teste.
6. Atualizar `APP_VERSAO` em `assets/app.js`, e o `README.md` / `docs/modelo-dados.md` se mudou o funcionamento ou os dados.
7. Commit + push para `main` (`git fetch && git rebase origin/main` antes); verificar o site publicado.

## Regras
- Nunca credenciais privadas no código (só a chave pública do Supabase, via `plataforma-core`).
- Regras de negócio importantes (aprovação, limites, privacidade da morada) ficam **no servidor** (triggers/RLS), não só no browser.
- Nunca pôr dados reais de utilizadores (moradas, NIF, fotos) no repositório.
