import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/migrations/20260703000000_enforce_account_creation_rules.sql', 'utf8');
const config = readFileSync('supabase/config.toml', 'utf8');

assert.match(config, /\[auth\.hook\.before_user_created\]/);
assert.match(config, /hook_restrict_account_creation/);

assert.match(sql, /create table if not exists public\.signup_allowed_networks/);
assert.match(sql, /domain <> 'upr\.edu' and domain not like '%\.upr\.edu'/);
assert.match(sql, /ip << allowed\.cidr/);
assert.match(sql, /alter table public\.signup_allowed_networks enable row level security/);
assert.match(sql, /grant execute on function public\.hook_restrict_account_creation\(jsonb\) to supabase_auth_admin/);
assert.match(sql, /revoke execute on function public\.hook_restrict_account_creation\(jsonb\) from authenticated, anon, public/);

console.log('auth hook SQL checks passed');
