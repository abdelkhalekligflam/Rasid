alter table public.profiles add column if not exists avatar_image text;
alter table public.profiles add constraint profiles_avatar_image_valid check (avatar_image is null or (length(avatar_image) <= 24000 and avatar_image ~ '^data:image/webp;base64,[A-Za-z0-9+/=]+$'));
