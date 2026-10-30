/**
 * NLP & Vector Similarity Service for samadhanX
 * Pure Node.js implementation of text normalization, stemmer, TF-IDF,
 * Cosine Similarity, and key term extraction without external heavy native libraries.
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'aicte', 'all', 'am', 'an', 'and', 'any', 'application',
  'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'bureau', 'but',
  'by', 'can', 'cannot', 'case', 'cell', 'college', 'complaint', 'could', 'dated', 'dear', 'did', 'do',
  'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'grievance', 'had', 'has',
  'have', 'having', 'he', 'her', 'here', 'hereby', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'institute', 'institution', 'into', 'is', 'it', 'its', 'itself', 'kindly', 'madam',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'please', 'regard', 'regarding',
  'request', 'same', 'she', 'should', 'sir', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Lightweight English stemmer based on suffix normalization
 */
function stemToken(token) {
  if (token.length <= 3) return token;

  let word = token;
  if (word.endsWith('sses')) word = word.slice(0, -2);
  else if (word.endsWith('ies')) word = word.slice(0, -3) + 'y';
  else if (word.endsWith('ss')) return word;
  else if (word.endsWith('s')) word = word.slice(0, -1);

  if (word.endsWith('eed')) {
    if (word.length > 5) word = word.slice(0, -1);
  } else if (word.endsWith('ed') && word.length > 4) {
    word = word.slice(0, -2);
    if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) word += 'e';
  } else if (word.endsWith('ing') && word.length > 5) {
    word = word.slice(0, -3);
    if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) word += 'e';
  }

  if (word.endsWith('tional')) word = word.slice(0, -4) + 'tion';
  else if (word.endsWith('fulness')) word = word.slice(0, -4);
  else if (word.endsWith('ments')) word = word.slice(0, -1);
  else if (word.endsWith('ment') && word.length > 6) word = word.slice(0, -4);
  else if (word.endsWith('tions')) word = word.slice(0, -1);
  else if (word.endsWith('ation')) word = word.slice(0, -3) + 'e';
  else if (word.endsWith('ities')) word = word.slice(0, -3) + 'y';
  else if (word.endsWith('ity') && word.length > 5) word = word.slice(0, -3);

  return word;
}

/**
 * Normalizes input text into cleaned, stemmed, non-stopword tokens
 */
function tokenizeAndNormalize(text) {
  if (!text || typeof text !== 'string') return [];

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token))
    .map(stemToken);
}

/**
 * Calculates Term Frequency (TF) for a token list
 */
function computeTF(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  const total = tokens.length || 1;
  const tf = new Map();
  for (const [token, count] of counts.entries()) {
    tf.set(token, count / total);
  }
  return tf;
}

/**
 * Pre-calibrated domain IDF priors for technical education complaint vocabulary
 * Ensures accurate discriminant weighting even when candidate corpus is small.
 */
const DOMAIN_IDF_PRIORS = {
  harass: 2.8,
  rag: 3.2,
  salari: 2.5,
  withheld: 2.9,
  refund: 2.3,
  fee: 2.1,
  faculti: 2.0,
  infrastructur: 2.4,
  laboratori: 2.6,
  approv: 2.2,
  affili: 2.5,
  fraud: 3.0,
  certif: 2.4,
  expuls: 3.1,
  threat: 2.9,
  capit: 3.2,
  bribe: 3.4,
  victim: 2.8,
  intimid: 3.0,
  depreci: 2.9,
  servic: 1.8,
  deposit: 2.5,
  provident: 3.1,
  fund: 2.4,
  experi: 2.2,
  curriculum: 2.6,
  biometr: 3.0,
  attend: 2.2,
  violat: 2.5,
  defici: 2.7,
  norm: 2.1
};

/**
 * Computes Cosine Similarity between two token lists using TF-IDF weighting
 */
function computeCosineSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;

  const tfA = computeTF(tokensA);
  const tfB = computeTF(tokensB);

  const allTokens = new Set([...tfA.keys(), ...tfB.keys()]);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const token of allTokens) {
    const idf = DOMAIN_IDF_PRIORS[token] || 2.0; // standard default IDF for non-listed terms
    const weightA = (tfA.get(token) || 0) * idf;
    const weightB = (tfB.get(token) || 0) * idf;

    dotProduct += weightA * weightB;
    normA += weightA * weightA;
    normB += weightB * weightB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const similarity = dotProduct / denominator;
  // Bound to [0, 1]
  return Math.min(1.0, Math.max(0.0, Number(similarity.toFixed(4))));
}

/**
 * Extracts top overlapping discriminating keywords between two texts
 */
function extractDiscriminatingTerms(tokensA, tokensB, topN = 5) {
  const setB = new Set(tokensB);
  const shared = tokensA.filter(t => setB.has(t));
  if (!shared.length) return [];

  const counts = new Map();
  for (const t of shared) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([token, count]) => ({
      term: token,
      weight: (DOMAIN_IDF_PRIORS[token] || 2.0) * count
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, topN)
    .map(item => item.term);
}

/**
 * Token Jaccard similarity for short strings (names, subjects)
 */
function computeJaccardSimilarity(strA, strB) {
  const tokensA = new Set(tokenizeAndNormalize(strA));
  const tokensB = new Set(tokenizeAndNormalize(strB));

  if (!tokensA.size && !tokensB.size) return 1.0;
  if (!tokensA.size || !tokensB.size) return 0.0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return Number((intersection / union).toFixed(4));
}

module.exports = {
  tokenizeAndNormalize,
  computeTF,
  computeCosineSimilarity,
  extractDiscriminatingTerms,
  computeJaccardSimilarity
};
