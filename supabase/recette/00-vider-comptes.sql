-- STAGING ONLY ("recette"), run by .github/workflows/recette.yml before seed.sql.
-- `supabase db reset --linked` recreates the schemas but keeps the Auth users: they are removed
-- here so that the demo accounts can be created again. Never run against production.
do $$
begin
  if (select count(*) from auth.users) > 500 then
    raise exception 'Refusing to empty auth.users: more than 500 accounts, this does not look like the staging project.';
  end if;
end;
$$;
delete from auth.users;
