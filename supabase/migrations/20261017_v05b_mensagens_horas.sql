-- Parkncharge v0.5 — hora exata das mensagens e da leitura (clock_timestamp), para o "por ler" ser fiável

create or replace function parkncharge.messages_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare c record; clean text;
begin
  select * into c from parkncharge.conversations where id = new.conversation_id;
  if c.id is null then raise exception 'Conversa não encontrada'; end if;
  new.sender_id := auth.uid();
  if new.sender_id is null or new.sender_id not in (c.guest_id, c.host_id) then raise exception 'Só os participantes podem escrever nesta conversa'; end if;
  new.body := trim(new.body);
  if new.body = '' then raise exception 'Escreva uma mensagem'; end if;
  new.created_at := clock_timestamp(); new.masked := false;
  if not parkncharge.conversation_has_booking(c.id) then
    clean := parkncharge.mask_contacts(new.body);
    if clean <> new.body then new.body := clean; new.masked := true; end if;
  end if;
  update parkncharge.conversations
     set last_message_at = new.created_at, last_preview = left(new.body, 120), last_sender_id = new.sender_id,
         guest_read_at = case when new.sender_id = c.guest_id then new.created_at else guest_read_at end,
         host_read_at  = case when new.sender_id = c.host_id  then new.created_at else host_read_at end
   where id = c.id;
  return new;
end;
$$;
create or replace function parkncharge.mark_conversation_read(p_conv uuid)
returns void language sql security definer set search_path = ''
as $$
  update parkncharge.conversations
     set guest_read_at = case when guest_id = auth.uid() then clock_timestamp() else guest_read_at end,
         host_read_at  = case when host_id  = auth.uid() then clock_timestamp() else host_read_at end
   where id = p_conv and auth.uid() in (guest_id, host_id);
$$;
