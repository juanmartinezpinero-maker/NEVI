import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

type Row = Record<string, unknown>;

async function q<T extends Row>(query: ReturnType<typeof sql>): Promise<T[]> {
  const db = await getDb();
  const res = (await db.execute(query)) as unknown as T[] | { rows: T[] };
  return Array.isArray(res) ? res : res.rows;
}

export async function getKpis() {
  const [k] = await q<{
    users: number;
    users_7d: number;
    users_24h: number;
    votes: number;
    votes_24h: number;
    votes_7d: number;
    verified_votes: number;
    published: number;
    pending: number;
    views_7d: number;
    viewers_7d: number;
    voters_7d: number;
    signups_7d: number;
  }>(sql`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from users where created_at > now() - interval '7 days') as users_7d,
      (select count(*)::int from users where created_at > now() - interval '1 day') as users_24h,
      (select count(*)::int from votes) as votes,
      (select count(*)::int from votes where created_at > now() - interval '1 day') as votes_24h,
      (select count(*)::int from votes where created_at > now() - interval '7 days') as votes_7d,
      (select count(*)::int from votes where verified) as verified_votes,
      (select count(*)::int from polls where status = 'published') as published,
      (select count(*)::int from polls where status = 'pending') as pending,
      (select count(*)::int from events where type = 'view' and created_at > now() - interval '7 days') as views_7d,
      (select count(distinct anon_id)::int from events where type = 'view' and created_at > now() - interval '7 days') as viewers_7d,
      (select count(distinct coalesce(user_id::text, anon_id))::int from events where type = 'vote' and created_at > now() - interval '7 days') as voters_7d,
      (select count(*)::int from events where type = 'signup' and created_at > now() - interval '7 days') as signups_7d
  `);
  return k;
}

/** Retención: % de usuarios registrados que vuelven a votar al día 1 y en los 7 días siguientes. */
export async function getRetention() {
  const [r] = await q<{ cohort_d1: number; ret_d1: number; cohort_d7: number; ret_d7: number }>(sql`
    with u as (select id, created_at from users)
    select
      (select count(*)::int from u where created_at < now() - interval '2 days') as cohort_d1,
      (select count(*)::int from u where created_at < now() - interval '2 days' and exists (
        select 1 from votes v where v.user_id = u.id and v.created_at >= u.created_at + interval '1 day' and v.created_at < u.created_at + interval '2 days')) as ret_d1,
      (select count(*)::int from u where created_at < now() - interval '8 days') as cohort_d7,
      (select count(*)::int from u where created_at < now() - interval '8 days' and exists (
        select 1 from votes v where v.user_id = u.id and v.created_at >= u.created_at + interval '1 day' and v.created_at < u.created_at + interval '8 days')) as ret_d7
  `);
  return r;
}

export async function getDailyVotes(days = 14) {
  return q<{ day: string; n: number }>(sql`
    select to_char(d.day, 'DD/MM') as day, coalesce(count(v.id), 0)::int as n
    from generate_series((now() - make_interval(days => ${days - 1}))::date, now()::date, interval '1 day') as d(day)
    left join votes v on v.created_at::date = d.day::date
    group by d.day order by d.day
  `);
}

/** Atribución por enlace de creador / código de referido. */
export async function getRefStats() {
  return q<{ ref: string; label: string | null; clicks: number; views: number; votes: number; signups: number }>(sql`
    select e.ref_code as ref, max(s.label) as label,
      count(*) filter (where e.type = 'link_click')::int as clicks,
      count(*) filter (where e.type = 'view')::int as views,
      count(*) filter (where e.type = 'vote')::int as votes,
      count(*) filter (where e.type = 'signup')::int as signups
    from events e left join share_links s on s.code = e.ref_code
    where e.ref_code is not null
    group by e.ref_code order by votes desc, clicks desc limit 50
  `);
}

export async function getShareChannels() {
  return q<{ channel: string; n: number }>(sql`
    select coalesce(meta->>'channel', '?') as channel, count(*)::int as n
    from events where type = 'share' and created_at > now() - interval '30 days'
    group by 1 order by 2 desc
  `);
}

export async function getTrafficSources() {
  return q<{ src: string; n: number }>(sql`
    select meta->>'src' as src, count(*)::int as n
    from events where type = 'view' and meta->>'src' is not null and created_at > now() - interval '30 days'
    group by 1 order by 2 desc
  `);
}

/** Señales de fraude: muchas votaciones desde el mismo hash de IP en 24 h. */
export async function getSuspiciousIps(threshold = 40) {
  return q<{ ip_hash: string; n: number; polls: number; anon: number }>(sql`
    select ip_hash, count(*)::int as n, count(distinct poll_id)::int as polls,
      count(*) filter (where not verified)::int as anon
    from votes where created_at > now() - interval '1 day' and ip_hash is not null
    group by ip_hash having count(*) > ${threshold} order by n desc limit 20
  `);
}
