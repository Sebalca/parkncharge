# Modelo de dados — Parkncharge

Projeto Supabase partilhado da plataforma ("Sites"). SQL em [`supabase/migrations/`](../supabase/migrations/). Os dados do Parkncharge ficam num **schema próprio `parkncharge`**,
separados das tabelas genéricas (`profiles`, `sites`, `user_site_data`), porque são dados partilhados entre utilizadores
(anúncios públicos, reservas com dois lados).

## Global vs específico
| Dado | Onde |
|---|---|
| Nome, email, avatar, telefone | `public.profiles` (global, reutilizável) |
| Tipo de anfitrião, NIF, dados de empresa | `parkncharge.host_profiles` |
| Lugares, fotos, horários, preços | `parkncharge.listings`, `listing_photos`, `listing_schedule` |
| Morada exata, coordenadas, instruções de acesso | `parkncharge.listing_private` (só dono/admin) |
| Carros (dados públicos) | `parkncharge.cars`, `car_photos`, `car_schedule` |
| Local exato de recolha, matrícula, instruções | `parkncharge.car_private` (só dono/admin) |
| Avaliações de lugares e carros | `parkncharge.reviews` (públicas) |
| Reservas, mensagens, favoritos | `parkncharge.bookings`, `messages`, `favorites` |

## Estado
- v0.2 (aplicado): `host_profiles`, `listings`, `listing_private`, `listing_photos`, `listing_schedule`, bucket `parkncharge`.
- v0.2b (aplicado): `listings.is_demo` e `listings.demo_occupied` (exemplos e ocupação simulada, só o admin os liga). Exemplos em `supabase/seed/exemplos_sao_mamede.sql`.
- v0.2c (aplicado): carros (`cars`, `car_private`, `car_photos`, `car_schedule`, com as mesmas regras dos lugares) e `reviews` (lugares e carros). Exemplos em `supabase/seed/exemplos_carros_avaliacoes.sql`.
- v0.4 (aplicado): `bookings` (reservas de lugares e carros) e as funções `fits_schedule`, `booking_price`, `occupied_now`, `busy_periods`, `expire_requests`, `booking_access`. `reviews` passa a exigir reserva concluída. Exemplos em `supabase/seed/exemplos_reservas.sql`; `demo_occupied` deixou de ser usado.
- A seguir: `messages` (v0.5), `favorites` (v0.6).

## Regras nos triggers (v0.2)
- O anfitrião nunca se auto-aprova: só pode passar rascunho/recusado → pendente, pendente → rascunho, ativo ↔ pausado.
- Ao enviar (→ pendente) o servidor verifica: título, tipo, zona, pelo menos um preço, morada, pelo menos 1 foto, dados do carregador se tiver.
- Máximo 6 fotos; a primeira (menor `position`) é a capa.
- `approx_lat/lng` é calculado no servidor a partir da morada privada (grelha de ~300 m).

## Tabelas
- **host_profiles** — `user_id` (PK, → auth.users), `host_type` (particular/empresa), `company_name`, `nif`, `created_at`
- **listings** — `id`, `host_id`, `status` (rascunho/pendente/ativo/recusado/pausado), `rejection_reason`, `title`, `description`,
  `spot_type` (garagem/box/lugar_coberto/lugar_descoberto/parque), `zone`, `city`, `approx_lat`, `approx_lng`,
  `vehicle_types[]` (moto, carro, carrinha, autocarro, camiao, autocaravana),
  `is_covered`, `is_underground`, `is_closed`, `is_solo`, `easy_entry`, `max_height_m`,
  `has_charger`, `charger_type`, `charger_kw`, `charge_price_mode` (incluido/a_parte), `charge_price_kwh`,
  `price_hour`, `price_day`, `price_month`, `instant_book` (sempre true desde a v0.4a; sem efeito), `cover_photo`, `submitted_at`, `approved_at`, `approved_by`,
  `is_demo` (anúncio de exemplo), `demo_occupied` (ocupação simulada até às reservas)
- **listing_private** — `listing_id`, `address`, `postal_code`, `lat`, `lng`, `access_instructions`
- **listing_photos** — `id`, `listing_id`, `storage_path`, `position`
- **listing_schedule** — `listing_id`, `weekday` (0–6), `opens_at`, `closes_at`
- **bookings** — `id`, `listing_id` **ou** `car_id`, `driver_id`, `host_id` (copiado do anúncio), `driver_name` (primeiro nome), `starts_at`, `ends_at`, `period` (tstzrange gerado),
  `status` (pedido/confirmada/recusada/cancelada/expirada — "a decorrer" e "concluída" vêm das datas), `total_price`, `price_label`, `vehicle_note`, `message`,
  `expires_at` (prazo do pedido: 24 h ou até ao início), `decided_at`, `cancel_reason`, `cancelled_by` (condutor/anfitriao/admin), `is_demo`, `created_at`, `updated_at`
  - Restrições de exclusão (`btree_gist`) por lugar e por carro: pedidos ativos e confirmadas não se sobrepõem
  - Trigger `bookings_guard`: anúncio ativo, não o próprio, início no futuro, 30 min a 1 ano, `fits_schedule`, preço por `booking_price`; desde a v0.4a o estado é **sempre confirmada**; transições permitidas: anfitrião cancela com motivo; condutor cancela até ao início; o admin pode tudo; os dados da reserva nunca mudam (pedido/recusada/expirada ficam só no histórico)
  - Funções: `occupied_now()` (ocupados agora, público), `busy_periods(lugar, carro)` (períodos ocupados sem dizer de quem, público), `expire_requests()`, `booking_access(reserva)` (morada/instruções só para o condutor de reserva confirmada até ao fim, o anfitrião e o admin)
- **conversations** (v0.5) — `id`, `listing_id` **ou** `car_id`, `guest_id` (condutor), `host_id`, `guest_name`, `host_name` (primeiros nomes), `last_message_at`, `last_preview`, `last_sender_id`, `guest_read_at`, `host_read_at`, `created_at`
  - Uma por anúncio e condutor (índices únicos). Cria-se só pela função `open_conversation(lugar, carro, condutor?)`: o condutor abre a sua (anúncio ativo, não o próprio); o anfitrião só abre com quem reservou o anúncio
  - `mark_conversation_read(conversa)` e `unread_conversations()` (por ler como condutor / como anfitrião)
- **messages** (v0.5) — `id`, `conversation_id`, `sender_id`, `body` (1–2000), `masked` (tinha contactos escondidos), `created_at`
  - Trigger `messages_guard`: só participantes; se não houver reserva confirmada nesse anúncio entre os dois, `mask_contacts` troca emails e números com 9+ algarismos por •••; atualiza a última mensagem da conversa
- **test_accounts** (v0.4a) — `user_id`, `kind` (condutor/anfitriao): as duas contas de teste do "Entrar como". Leitura só admin. `setup_test_account()` só com a chave de serviço (Edge Function `parkncharge-entrar-como`)
- **cars** — como `listings`, mas com `brand`, `model`, `year`, `category` (citadino/familiar/suv/carrinha/monovolume/desportivo), `fuel` (gasolina/gasoleo/hibrido/eletrico/gpl), `transmission` (manual/automatica), `seats`, `doors`, `range_km`, `features[]` (ac, gps, bluetooth, cadeira_bebe, engate, teto_panoramico, camara_marcha_atras, cruise_control), `km_included_day`, `min_age`, `deposit`
- **car_private** — `car_id`, `address`, `lat`, `lng`, `plate`, `pickup_instructions`
- **car_photos** — `id`, `car_id`, `storage_path`, `position` (máx. 6)
- **car_schedule** — `car_id`, `weekday`, `opens_at`, `closes_at` (quando se pode levantar)
- **reviews** — `id`, `listing_id` **ou** `car_id`, `author_id`, `author_name` (primeiro nome copiado do perfil, que não é público), `rating` 1–5, `comment`, `is_demo`, `created_at`, `updated_at`
  - 1 por pessoa e anúncio (índices únicos, exceto exemplos); o trigger `reviews_guard` impede avaliar anúncios não ativos ou os próprios e só deixa o admin criar exemplos
  - v0.4: só quem tem uma reserva confirmada já terminada desse anúncio pode avaliar
- **favorites** — `user_id`, `listing_id`

## Regras de acesso (RLS)
- Anúncios `ativo`: leitura pública (sem `access_instructions`, servidas por função só ao condutor com reserva confirmada).
- Anúncios: só o anfitrião cria/edita os seus.
- Reservas: só o condutor, o anfitrião dessa reserva e o admin veem e alteram (sem apagar); anónimos só veem os períodos ocupados, pela função `busy_periods`.
- Mensagens (v0.5): só o condutor e o anfitrião da conversa (e o admin) leem; escrevem só os dois, em nome próprio; ninguém edita nem apaga.
- Avaliações: leitura pública; escrita só por quem tem uma reserva concluída.
- Favoritos: só o próprio.
- Nenhuma service key no frontend nem no GitHub.

## Storage
- Bucket `parkncharge-listings` (leitura pública), escrita só na pasta `{user_id}/`.
