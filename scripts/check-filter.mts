// Usage: npx tsx --env-file=.env.local scripts/check-filter.mts "Marcelo Mayer 2025 Topps Chrome Rookie PSA 10"
const cardName = process.argv[2];
const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const NOISE = /^(psa|10|rookie|rc|card|graded|gem|mint)$/i, SUFFIX = /^(jr\.?|sr\.?|ii|iii|iv)$/i;
const NOT_BASE_RE = /\b(auto|autos|autograph|autographed|signed|signature|signatures|patch|relic|jersey|memorabilia|refractor|refractors|prizm|xfractor|x fractor|mojo|wave|raywave|ray wave|atomic|sepia|negative|superfractor|printing plate|variation|var|ssp|sp|short print|parallel|insert|case hit|sapphire|heritage|bowman|national treasures|select|on demand|finest|stadium club|gold|orange|purple|green|pink|aqua|black|geometric|speckle|lava|shimmer|pulsar|helix|rainbow|foil|home field advantage|fortune 15|rookie debut|debut|celebration|celebracion|celebraci|radiating|power players|hidden gems|youthquake|future stars|all etch|ultra violet|lightboard|logofractor|kaiju|anime|fireworks|stars of mlb)\b/;
const NUMBERED_RE = /(\/\s*\d{1,4}\b|\b1\s*of\s*1\b)/;

const words = cardName.split(/\s+/);
const name = words.slice(0, 2).join(" ");
const setWords = words.slice(2).filter(w => !/^\d{4}$/.test(w) && !NOISE.test(w) && !SUFFIX.test(w)).map(norm);
const year = Number(cardName.match(/\b(19|20)\d{2}\b/)?.[0]);
const years = year ? [year - 1, year, year + 1].map(String) : [];
const cardNorm = norm(cardName);

const auth = Buffer.from(`${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`).toString("base64");
const tok = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
  method: "POST",
  headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
  body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
}).then(r => r.json());
if (!tok.access_token) { console.log("token failed:", tok); process.exit(1); }

const q = encodeURIComponent([name, ...setWords, "PSA 10"].join(" "));
const filter = encodeURIComponent("buyingOptions:{FIXED_PRICE},priceCurrency:USD");
const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${q}&category_ids=261328&filter=${filter}&limit=200&sort=newlyListed`,
  { headers: { Authorization: `Bearer ${tok.access_token}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" } });
console.log("query:", decodeURIComponent(q), "| status:", res.status);
const items: any[] = (await res.json()).itemSummaries ?? [];
console.log("eBay returned:", items.length, "\n");

const counts: Record<string, number> = {};
for (const it of items) {
  const raw = String(it.title), t = norm(raw);
  let why = "KEEP";
  if (!(t.includes("psa 10") || t.includes("psa10"))) why = "not psa 10";
  else if (!norm(name).split(" ").every(w => t.includes(w))) why = "name";
  else if (!setWords.every(w => t.includes(w))) why = "set words";
  else if (years.length && !years.some(y => t.includes(y))) why = "year";
  else if (/\b(rookie|rc)\b/i.test(cardName) && !/\b(rc|rookie)\b/.test(t)) why = "no RC";
  else { const m = t.match(NOT_BASE_RE); if (m && !cardNorm.includes(m[0])) why = `not base: ${m[0]}`;
         else if (NUMBERED_RE.test(raw)) why = "numbered"; }
  counts[why] = (counts[why] ?? 0) + 1;
  console.log(`${why.padEnd(22)} $${String(it.price?.value).padEnd(8)} ${String(it.itemCreationDate).slice(0, 10)}  ${raw.slice(0, 90)}`);
}
console.log("\nsummary:", counts);
