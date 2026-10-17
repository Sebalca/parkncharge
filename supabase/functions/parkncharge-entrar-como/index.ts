// Parkncharge — "Entrar como" (v0.4a)
// Só administradores. Devolve um código de entrada único para uma das DUAS contas de teste
// (nunca para contas reais). A chave de serviço vem do ambiente do Supabase, nunca do código.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CONTAS: Record<string, { email: string; nome: string }> = {
  condutor: { email: "teste.condutor@parkncharge.frisk.pt", nome: "Condutor Teste" },
  anfitriao: { email: "teste.anfitriao@parkncharge.frisk.pt", nome: "Anfitrião Teste" },
};
const ORIGENS = ["https://parkncharge.frisk.pt"];

function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ORIGENS.includes(o) ? o : ORIGENS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "Método não permitido" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) quem pede tem de ser administrador
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(token);
  if (!who?.user) return json(req, 401, { error: "Sessão inválida" });
  const { data: prof } = await admin.from("profiles").select("is_admin").eq("id", who.user.id).maybeSingle();
  if (!prof?.is_admin) return json(req, 403, { error: "Só para administradores" });

  // 2) só as contas de teste da lista
  let body: { conta?: string } = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const conta = CONTAS[body.conta ?? ""];
  if (!conta) return json(req, 400, { error: "Conta de teste desconhecida" });

  // 3) cria a conta na primeira vez (sem email enviado)
  const { error: ce } = await admin.auth.admin.createUser({
    email: conta.email, email_confirm: true,
    user_metadata: { nome: conta.nome, full_name: conta.nome }, app_metadata: { teste: true },
  });
  if (ce && !/already|registered|exists/i.test(ce.message)) return json(req, 500, { error: ce.message });

  // 4) código de entrada único (não envia email)
  const { data: link, error: le } = await admin.auth.admin.generateLink({ type: "magiclink", email: conta.email });
  if (le || !link?.properties?.hashed_token) return json(req, 500, { error: le?.message ?? "Sem código" });

  const { error: se } = await admin.schema("parkncharge").rpc("setup_test_account", { p_user: link.user.id, p_kind: body.conta });
  if (se) return json(req, 500, { error: se.message });

  return json(req, 200, { token_hash: link.properties.hashed_token, email: conta.email, nome: conta.nome });
});
