/**
 * Carga encuestas de DEMOSTRACIÓN con votos FICTICIOS (marcadas con is_demo = true).
 * Uso: npm run db:seed            (no hace nada si ya hay datos demo)
 *      npm run db:seed -- --reset (borra y vuelve a crear las encuestas demo)
 */
import { eq } from "drizzle-orm";
import { getDb } from "../src/db/connect";
import * as schema from "../src/db/schema";
import { compactKey, normalize, slugify } from "../src/lib/text";

type Opt = [label: string, emoji: string, weight: number];
type DemoPoll = {
  title: string;
  category: string;
  emoji: string;
  options: Opt[];
  allowOther?: boolean;
  votes: number;
  writeIns?: [string, number][];
  sponsored?: boolean;
  description?: string;
};

const POLLS: DemoPoll[] = [
  { title: "¿Pepsi o Coca-Cola?", category: "marcas", emoji: "🥤", votes: 3200, options: [["Coca-Cola", "🔴", 62], ["Pepsi", "🔵", 38]] },
  { title: "¿Messi o Cristiano?", category: "deportes", emoji: "🐐", votes: 4100, options: [["Messi", "🇦🇷", 57], ["Cristiano", "🇵🇹", 43]] },
  {
    title: "¿Cuál es la mejor serie de la historia?",
    category: "entretenimiento",
    emoji: "📺",
    votes: 2600,
    allowOther: true,
    options: [["Breaking Bad", "🧪", 30], ["Juego de Tronos", "🐉", 22], ["Los Soprano", "🍝", 10], ["Friends", "☕", 15], ["La Casa de Papel", "🎭", 9]],
    writeIns: [["The Office", 60], ["the office", 25], ["Succession", 40], ["Dark", 55], ["Stranger Things", 70], ["stranger thing", 12], ["Peaky Blinders", 45]],
  },
  {
    title: "¿En qué país se come mejor?",
    category: "paises",
    emoji: "🍽️",
    votes: 3500,
    allowOther: true,
    options: [["España", "🇪🇸", 26], ["Italia", "🇮🇹", 27], ["México", "🇲🇽", 20], ["Japón", "🇯🇵", 14], ["Francia", "🇫🇷", 6], ["Perú", "🇵🇪", 7]],
    writeIns: [["Turquía", 40], ["Tailandia", 35], ["Grecia", 30], ["Corea del Sur", 22]],
  },
  { title: "¿Playa o montaña?", category: "estilo-de-vida", emoji: "🏖️", votes: 2900, options: [["Playa", "🏖️", 58], ["Montaña", "🏔️", 42]] },
  {
    title: "¿Cuál es la mejor película de todos los tiempos?",
    category: "entretenimiento",
    emoji: "🎬",
    votes: 2200,
    allowOther: true,
    options: [["El Padrino", "🌹", 24], ["Titanic", "🚢", 12], ["Pulp Fiction", "🍔", 14], ["Interstellar", "🪐", 19], ["El Señor de los Anillos", "💍", 21], ["Forrest Gump", "🍫", 10]],
    writeIns: [["Gladiator", 45], ["Matrix", 50], ["Origen", 30]],
  },
  {
    title: "¿Qué país tiene las personas más atractivas?",
    category: "paises",
    emoji: "😍",
    votes: 2700,
    allowOther: true,
    options: [["Brasil", "🇧🇷", 22], ["Colombia", "🇨🇴", 19], ["Italia", "🇮🇹", 16], ["Suecia", "🇸🇪", 12], ["Argentina", "🇦🇷", 14], ["España", "🇪🇸", 17]],
    writeIns: [["Venezuela", 55], ["Corea", 30]],
  },
  { title: "¿Tortilla de patatas con o sin cebolla?", category: "comida", emoji: "🥔", votes: 3900, options: [["Con cebolla", "🧅", 66], ["Sin cebolla", "🚫", 34]] },
  { title: "¿iPhone o Android?", category: "tecnologia", emoji: "📱", votes: 3100, options: [["iPhone", "🍎", 49], ["Android", "🤖", 51]] },
  { title: "¿Piña en la pizza?", category: "comida", emoji: "🍍", votes: 2800, options: [["Sí, por supuesto", "✅", 41], ["Jamás", "❌", 59]] },
  {
    title: "¿Cuál es la mejor comida del mundo?",
    category: "comida",
    emoji: "🌮",
    votes: 1900,
    allowOther: true,
    options: [["Pizza", "🍕", 22], ["Sushi", "🍣", 18], ["Tacos", "🌮", 17], ["Paella", "🥘", 12], ["Hamburguesa", "🍔", 14]],
    writeIns: [["Ceviche", 40], ["Lasaña", 30], ["Asado", 45], ["Ramen", 25]],
  },
  { title: "¿Café o té?", category: "estilo-de-vida", emoji: "☕", votes: 2100, options: [["Café", "☕", 71], ["Té", "🍵", 29]] },
  { title: "¿Netflix o HBO Max?", category: "entretenimiento", emoji: "🍿", votes: 1700, options: [["Netflix", "🟥", 55], ["HBO Max", "🟪", 45]] },
  { title: "¿Real Madrid o Barcelona?", category: "deportes", emoji: "⚽", votes: 4400, options: [["Real Madrid", "⚪", 51], ["Barcelona", "🔵", 49]] },
  {
    title: "¿Cuál es la mejor red social?",
    category: "tecnologia",
    emoji: "💬",
    votes: 1600,
    allowOther: true,
    options: [["Instagram", "📸", 30], ["TikTok", "🎵", 32], ["YouTube", "▶️", 22], ["X (Twitter)", "✖️", 8], ["Facebook", "👍", 4]],
    writeIns: [["Reddit", 35], ["Twitch", 18], ["WhatsApp", 20]],
  },
  { title: "¿Perros o gatos?", category: "estilo-de-vida", emoji: "🐶", votes: 3300, options: [["Perros", "🐶", 60], ["Gatos", "🐱", 40]] },
  { title: "¿Nike o Adidas?", category: "marcas", emoji: "👟", votes: 2000, options: [["Nike", "✔️", 54], ["Adidas", "〰️", 46]] },
  {
    title: "¿Qué inteligencia artificial usas más?",
    category: "tecnologia",
    emoji: "🤖",
    votes: 1400,
    allowOther: true,
    options: [["ChatGPT", "💬", 45], ["Claude", "✳️", 20], ["Gemini", "♊", 18], ["Copilot", "🧭", 9], ["Ninguna", "🙅", 8]],
    writeIns: [["Perplexity", 25], ["DeepSeek", 30]],
  },
  { title: "¿Verano o invierno?", category: "estilo-de-vida", emoji: "☀️", votes: 1800, options: [["Verano", "☀️", 63], ["Invierno", "❄️", 37]] },
  {
    title: "¿Cuál es el mejor deporte para ver?",
    category: "deportes",
    emoji: "🏟️",
    votes: 1500,
    options: [["Fútbol", "⚽", 48], ["Baloncesto", "🏀", 17], ["Tenis", "🎾", 12], ["Fórmula 1", "🏎️", 15], ["Pádel", "🏓", 8]],
  },
  { title: "¿McDonald's o Burger King?", category: "marcas", emoji: "🍟", votes: 2300, options: [["McDonald's", "🟡", 52], ["Burger King", "👑", 48]] },
  {
    title: "¿Cuál es la ciudad más bonita del mundo?",
    category: "paises",
    emoji: "🏙️",
    votes: 1300,
    allowOther: true,
    options: [["París", "🗼", 22], ["Roma", "🏛️", 20], ["Nueva York", "🗽", 15], ["Kioto", "⛩️", 12], ["Barcelona", "🌊", 16], ["Buenos Aires", "💃", 15]],
    writeIns: [["Praga", 40], ["Ámsterdam", 30], ["Estambul", 25]],
  },
  {
    title: "¿Qué snack de marca elegirías para una peli? (demo patrocinada)",
    category: "marcas",
    emoji: "🍿",
    votes: 600,
    sponsored: true,
    description: "Ejemplo de cómo se verá una encuesta patrocinada. La marca es ficticia.",
    options: [["Palomitas Ficticias", "🍿", 45], ["Nachos Demo", "🧀", 30], ["Chuches Ejemplo", "🍬", 25]],
  },
];

// Distribuciones ficticias de la audiencia demo.
const COUNTRIES: [string, number][] = [["ES", 34], ["MX", 15], ["AR", 10], ["CO", 8], ["US", 6], ["CL", 5], ["PE", 4], ["VE", 3], ["EC", 2], ["UY", 2], ["BR", 3], ["IT", 2], ["FR", 2], ["DE", 2], ["GB", 2]];
const AGES: [string, number][] = [["16-17", 6], ["18-24", 30], ["25-34", 28], ["35-44", 18], ["45-54", 10], ["55-64", 5], ["65+", 3]];
const GENDERS: [string, number][] = [["mujer", 47], ["hombre", 47], ["no-binario", 2], ["no-indica", 4]];

let seed = 42;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
function pick<T>(items: [T, number][]): T {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
}

async function main() {
  const db = await getDb();
  const reset = process.argv.includes("--reset");
  const existing = await db.select({ id: schema.polls.id }).from(schema.polls).where(eq(schema.polls.isDemo, true));
  if (existing.length && !reset) {
    console.log(`Ya hay ${existing.length} encuestas demo. Usa --reset para regenerarlas.`);
    process.exit(0);
  }
  if (existing.length) {
    await db.delete(schema.polls).where(eq(schema.polls.isDemo, true));
    await db.delete(schema.sponsors).where(eq(schema.sponsors.name, "Marca Demo (ficticia)"));
    console.log("Encuestas demo anteriores eliminadas");
  }

  const [sponsor] = await db.insert(schema.sponsors).values({ name: "Marca Demo (ficticia)", status: "active" }).returning();
  const today = new Date().toISOString().slice(0, 10);
  let totalVotes = 0;

  for (const [index, p] of POLLS.entries()) {
    const ageDays = Math.floor(rand() * 20) + 1;
    const publishedAt = new Date(Date.now() - ageDays * 864e5);
    const [poll] = await db
      .insert(schema.polls)
      .values({
        slug: slugify(p.title),
        title: p.title,
        normalizedTitle: normalize(p.title),
        description: p.description ?? null,
        category: p.category,
        emoji: p.emoji,
        allowOther: Boolean(p.allowOther),
        status: "published",
        isDemo: true,
        featuredOn: index === 0 ? today : null,
        sponsorId: p.sponsored ? sponsor.id : null,
        publishedAt,
      })
      .returning();
    const options = await db
      .insert(schema.pollOptions)
      .values(p.options.map(([label, emoji], i) => ({ pollId: poll.id, label, emoji, normalizedLabel: normalize(label), position: i })))
      .returning();

    // Respuestas libres: las variantes («the office» / «The Office») se agrupan en una sola entrada.
    const writeInIds = new Map<string, string>();
    const writeInWeights: [string, number][] = [];
    for (const [label, count] of p.writeIns ?? []) {
      const key = compactKey(label);
      if (!writeInIds.has(key)) {
        const [wi] = await db.insert(schema.writeIns).values({ pollId: poll.id, label, normalized: key }).returning();
        writeInIds.set(key, wi.id);
      }
      writeInWeights.push([writeInIds.get(key)!, count]);
    }
    const writeInTotal = writeInWeights.reduce((a, [, n]) => a + n, 0);

    const rows: (typeof schema.votes.$inferInsert)[] = [];
    const optionWeights: [string, number][] = options.map((o, i) => [o.id, p.options[i][2]]);
    for (let i = 0; i < p.votes; i++) {
      const isWriteIn = writeInTotal > 0 && rand() < writeInTotal / (p.votes + writeInTotal);
      const country = pick(COUNTRIES);
      // Sesgos ficticios por país para que los desgloses sean interesantes.
      let weights = optionWeights;
      if (country === "AR" && p.title.includes("Messi")) weights = [[options[0].id, 85], [options[1].id, 15]];
      if (country === "MX" && p.title.includes("se come")) weights = [...optionWeights, [options[2].id, 60]];
      const verified = rand() < 0.72;
      const createdAt = new Date(publishedAt.getTime() + rand() ** 0.6 * (Date.now() - publishedAt.getTime()));
      rows.push({
        pollId: poll.id,
        optionId: isWriteIn ? null : pick(weights),
        writeInId: isWriteIn ? pick(writeInWeights) : null,
        voterKey: `demo:${poll.id.slice(0, 8)}:${i}`,
        verified,
        country,
        ageRange: verified ? pick(AGES) : null,
        gender: verified ? pick(GENDERS) : null,
        createdAt,
      });
    }
    for (let i = 0; i < rows.length; i += 500) await db.insert(schema.votes).values(rows.slice(i, i + 500));
    await db.update(schema.polls).set({ voteCount: rows.length }).where(eq(schema.polls.id, poll.id));
    totalVotes += rows.length;
    console.log(`✓ ${p.title} (${rows.length} votos ficticios)`);
  }
  console.log(`\nListo: ${POLLS.length} encuestas demo y ${totalVotes} votos ficticios.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
