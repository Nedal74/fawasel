/**
 * Keyword matcher for the knowledge base: Arabic + English, synonym aware,
 * no external services. Pure functions only, so it can be unit-tested and
 * swapped for another provider without touching the API route.
 */

const ARABIC_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;

/** Folds the spellings people actually type into one form. */
export function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/ـ/g, "") // tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Filler words in English, MSA and Gulf/Egyptian dialects (already normalized). */
const STOPWORDS = new Set(
  [
    // English
    "a an the is are am was were be been do does did i me my we our you your he she it they them",
    "to of in on at for from with about by and or but if so as this that these those there here",
    "what which who whom whose how why when where can could would should will shall may might",
    "please pls tell know want need like get got have has had any some just also very much more",
    "ok okay",
    // Arabic (normalized: ا for أإآ, ه for ة, ي for ى)
    "في من الي على علي عن مع هل ما ماذا لماذا ليش ليه ايش ايه شو وش كيف كيفيه ازاي متي امتي",
    "وين فين اين انا انت انتي انتم نحن احنا هو هي هم هذا هذه ذلك تلك اللي الذي التي الذين",
    "لو سمحت سمحتي ممكن ابغي ابغا ابي ابى اريد عايز عاوز حابب ودي اعرف عندي عندك عندكم لديك لديكم",
    "يا و او ثم بس لكن كذا كده طيب تمام معك معكم لك لكم منك منكم عنك عنكم",
    "تشتغل تشتغلون بتشتغل تعمل تعملون تقدر تقدرون كم",
  ]
    .join(" ")
    .split(" ")
    .filter(Boolean),
);

const ARABIC_PREFIXES = ["وبال", "وال", "بال", "كال", "فال", "لل", "ال"];
const ARABIC_SUFFIXES = ["ات", "ين", "ون", "ها", "هم", "كم", "نا", "ه", "ي", "ك"];

/** Light stemming: enough to make "الخدمات" ≈ "خدمة" without a dictionary. */
export function stem(token: string): string {
  if (/^[a-z0-9]+$/.test(token)) {
    if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
    if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
    if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
    if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
    return token;
  }
  let word = token;
  for (const prefix of ARABIC_PREFIXES) {
    if (word.startsWith(prefix) && word.length - prefix.length >= 3) {
      word = word.slice(prefix.length);
      break;
    }
  }
  for (const suffix of ARABIC_SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      word = word.slice(0, -suffix.length);
      break;
    }
  }
  return word;
}

export function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((token) => token && !STOPWORDS.has(token))
    .map(stem)
    .filter((token) => token.length > 1 || /\d/.test(token));
}

/** Maps every synonym (word or phrase) to one shared concept key. */
export type SynonymIndex = { words: Map<string, string>; phrases: [string, string][] };

export function buildSynonymIndex(groups: string[]): SynonymIndex {
  const words = new Map<string, string>();
  const phrases: [string, string][] = [];
  groups.forEach((group, i) => {
    const concept = `~${i}`;
    for (const raw of group.split(/[,،\n]/)) {
      const term = normalize(raw);
      if (!term) continue;
      if (term.includes(" ")) phrases.push([term, concept]);
      else {
        words.set(stem(term), concept);
        words.set(term, concept);
      }
    }
  });
  return { words, phrases };
}

/** Tokens plus the concept keys they (or phrases in the text) belong to. */
export function terms(text: string, synonyms: SynonymIndex): Set<string> {
  const result = new Set<string>();
  for (const token of tokens(text)) {
    result.add(token);
    const concept = synonyms.words.get(token);
    if (concept) result.add(concept);
  }
  const normalized = ` ${normalize(text)} `;
  for (const [phrase, concept] of synonyms.phrases) {
    if (normalized.includes(` ${phrase} `)) result.add(concept);
  }
  // Raw (unstemmed) words can also be synonyms, e.g. "كم".
  for (const word of normalize(text).split(" ")) {
    const concept = synonyms.words.get(word);
    if (concept) result.add(concept);
  }
  return result;
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Exact, shared-stem prefix, or a one-letter typo on longer words. */
function similar(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.startsWith("~") || b.startsWith("~")) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 4 && long.startsWith(short)) return true;
  return short.length >= 5 && editDistanceAtMostOne(a, b);
}

/** `texts` are the questions; `keywords` may be words or multi-word phrases. */
export type KnowledgeEntry = { id: string; texts: string[]; keywords: string[] };

export type Match = { id: string; score: number; coverage: number; matched: number };

/**
 * Scores every entry against the question and returns the best one, or null
 * when nothing clears the confidence bar.
 */
export function bestMatch(
  question: string,
  entries: KnowledgeEntry[],
  synonymGroups: string[],
): Match | null {
  const synonyms = buildSynonymIndex(synonymGroups);
  const query = [...terms(question, synonyms)];
  if (query.length === 0 || entries.length === 0) return null;

  const entryTerms = entries.map((entry) => ({
    id: entry.id,
    terms: [...terms([...entry.texts, ...entry.keywords].join(" \n "), synonyms)],
    phrases: entry.keywords.map(normalize).filter((phrase) => phrase.includes(" ")),
  }));

  // Rarer terms say more about which answer is meant.
  const df = new Map<string, number>();
  for (const entry of entryTerms) {
    for (const term of new Set(entry.terms)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  // Words no entry knows about count, but less than a rare known word, so a
  // polite long question does not drown out its one meaningful term.
  const weight = (term: string) => {
    const count = df.get(term) ?? 0;
    return count === 0 ? 1 : Math.log(1 + entries.length / (1 + count)) + 0.5;
  };

  // A concept and the word that produced it count once, not twice.
  const queryUnits = collapseConcepts(query, synonyms);
  const totalWeight = queryUnits.reduce((sum, unit) => sum + Math.max(...unit.map(weight)), 0);
  const normalizedQuestion = ` ${normalize(question)} `;

  let best: Match | null = null;
  for (const entry of entryTerms) {
    let matchedWeight = 0;
    let matched = 0;
    for (const unit of queryUnits) {
      const hit = unit.some((term) => entry.terms.some((candidate) => similar(term, candidate)));
      if (hit) {
        matched++;
        matchedWeight += Math.max(...unit.map(weight));
      }
    }
    if (matched === 0) continue;
    const coverage = matchedWeight / totalWeight;
    const phraseBonus = entry.phrases.some((phrase) => normalizedQuestion.includes(` ${phrase} `)) ? 0.25 : 0;
    const score = coverage + phraseBonus + Math.min(matched, 4) * 0.05;
    if (!best || score > best.score) best = { id: entry.id, score, coverage, matched };
  }

  if (!best) return null;
  const confident = best.coverage >= 0.5 || (best.matched >= 2 && best.coverage >= 0.3) || best.score >= 0.6;
  return confident ? best : null;
}

/** Groups each word with the concept it belongs to so they score as one unit. */
function collapseConcepts(query: string[], synonyms: SynonymIndex): string[][] {
  const units = new Map<string, string[]>();
  for (const term of query) {
    const concept = term.startsWith("~") ? term : synonyms.words.get(term);
    const key = concept ?? term;
    units.set(key, [...(units.get(key) ?? []), term]);
    if (concept && !units.get(key)!.includes(concept)) units.get(key)!.push(concept);
  }
  return [...units.values()];
}
