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
| Reservas, mensagens, avaliações, favoritos | `parkncharge.bookings`, `messages`, `reviews`, `favorites` |

## Estado
- v0.2 (aplicado): `host_profiles`, `listings`, `listing_private`, `listing_photos`, `listing_schedule`, bucket `parkncharge`.
- v0.2b (aplicado): `listings.is_demo` e `listings.demo_occupied` (exemplos e ocupação simulada, só o admin os liga). Exemplos em `supabase/seed/exemplos_sao_mamede.sql`.
- A seguir: `bookings` (v0.4), `messages` (v0.5), `reviews` e `favorites` (v0.6).

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
  `price_hour`, `price_day`, `price_month`, `instant_book`, `cover_photo`, `submitted_at`, `approved_at`, `approved_by`,
  `is_demo` (anúncio de exemplo), `demo_occupied` (ocupação simulada até às reservas)
- **listing_private** — `listing_id`, `address`, `postal_code`, `lat`, `lng`, `access_instructions`
- **listing_photos** — `id`, `listing_id`, `storage_path`, `position`
- **listing_schedule** — `listing_id`, `weekday` (0–6), `opens_at`, `closes_at`
- **bookings** — `id`, `listing_id`, `driver_id`, `period` (tstzrange), `booking_type` (hora/dia/mês), `total_price`,
  `status` (pedido/confirmada/recusada/cancelada/concluída), `created_at`
  - Restrição de exclusão (`btree_gist`) para impedir reservas confirmadas sobrepostas no mesmo lugar
- **messages** — `id`, `booking_id`, `sender_id`, `body`, `created_at`
- **reviews** — `id`, `booking_id`, `author_id`, `target` (lugar/condutor), `rating` 1–5, `comment`, `created_at`
- **favorites** — `user_id`, `listing_id`

## Regras de acesso (RLS)
- Anúncios `ativo`: leitura pública (sem `access_instructions`, servidas por função só ao condutor com reserva confirmada).
- Anúncios: só o anfitrião cria/edita os seus.
- Reservas e mensagens: só o condutor e o anfitrião dessa reserva.
- Avaliações: leitura pública; escrita só por participante de reserva concluída.
- Favoritos: só o próprio.
- Nenhuma service key no frontend nem no GitHub.

## Storage
- Bucket `parkncharge-listings` (leitura pública), escrita só na pasta `{user_id}/`.
