/**
 * Explainable Cross-Bureau Case Matching Engine for SAMADHAN
 * Combines exact-identifier resolution, metadata heuristics, rule checks,
 * and pure Node.js TF-IDF / Cosine Similarity into evidence-based ranking signals.
 */

const {
  tokenizeAndNormalize,
  computeCosineSimilarity,
  extractDiscriminatingTerms,
  computeJaccardSimilarity
} = require('./nlpService');

const ACTIVE_STATUSES = new Set([
  'RECEIVED',
  'VALIDATION_ASSIGNMENT',
  'UNDER_PROCESS',
  'REVIEW_COORDINATION'
]);

/**
 * Normalizes an identifier string (trims, uppercase, strips hyphens/spaces)
 */
function normalizeIdentifier(val) {
  if (!val) return '';
  return String(val).trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Resolves institution identity match between two institution records
 */
function resolveInstitutionIdentity(instA, instB) {
  if (!instA || !instB) {
    return {
      matchType: 'UNKNOWN',
      institutionScore: 0.0,
      uncertainIdentity: true,
      reason: 'One or both institutions not found'
    };
  }

  const hasUncertainIdentity =
    instA.identity_flag === 'MISSING_AICTE_ID' ||
    instA.identity_flag === 'FLAGGED_FOR_REVIEW' ||
    instB.identity_flag === 'MISSING_AICTE_ID' ||
    instB.identity_flag === 'FLAGGED_FOR_REVIEW';

  const aicteA = normalizeIdentifier(instA.aicte_permanent_id);
  const aicteB = normalizeIdentifier(instB.aicte_permanent_id);

  // 1. Exact AICTE Permanent ID match
  if (aicteA && aicteB && aicteA === aicteB) {
    return {
      matchType: 'EXACT_PERMANENT_ID',
      institutionScore: 1.0,
      uncertainIdentity: false,
      reason: `Exact AICTE Permanent ID match: ${instA.aicte_permanent_id}`
    };
  }

  // 2. Same internal institution ID
  if (instA.id && instB.id && instA.id === instB.id) {
    return {
      matchType: aicteA ? 'EXACT_PERMANENT_ID' : 'NORMALIZED_NAME',
      institutionScore: 1.0,
      uncertainIdentity: hasUncertainIdentity,
      reason: 'Matched on internal institution record'
    };
  }

  // 3. Normalized Name similarity
  const nameSim = computeJaccardSimilarity(instA.normalized_name || instA.name, instB.normalized_name || instB.name);
  if (nameSim >= 0.70) {
    return {
      matchType: 'NORMALIZED_NAME',
      institutionScore: Number((nameSim * 0.85).toFixed(4)),
      uncertainIdentity: true, // name-only matches are flagged for human identity confirmation
      reason: `Normalized name similarity of ${(nameSim * 100).toFixed(1)}%`
    };
  }

  return {
    matchType: 'DIFFERENT_INSTITUTION',
    institutionScore: 0.0,
    uncertainIdentity: false,
    reason: 'Distinct institutions'
  };
}

/**
 * Targeted Candidate Retrieval: Selects candidate complaints worth comparing against source
 * Avoids quadratic N x N explosion across the database.
 */
function retrieveCandidates(sourceComplaint, allComplaints) {
  const sourceTokens = new Set(tokenizeAndNormalize(sourceComplaint.subject + ' ' + sourceComplaint.category));

  return allComplaints.filter(candidate => {
    // Never compare against itself
    if (candidate.id === sourceComplaint.id) return false;

    // Condition 1: Same institution record
    if (candidate.institution_id === sourceComplaint.institution_id) return true;

    // Condition 2: Identical category
    if (candidate.category && sourceComplaint.category && candidate.category.toLowerCase() === sourceComplaint.category.toLowerCase()) {
      return true;
    }

    // Condition 3: Shared key tokens in subject
    const candTokens = tokenizeAndNormalize(candidate.subject);
    const sharesKeyword = candTokens.some(t => sourceTokens.has(t));
    if (sharesKeyword) return true;

    return false;
  });
}

/**
 * Evaluates candidate case against source case using evidence-based matching pipeline
 */
function evaluateCasePair(sourceComplaint, candidateComplaint, sourceInst, candidateInst) {
  const ruleFlags = [];

  // 1. Institution Identity
  const identityResult = resolveInstitutionIdentity(sourceInst, candidateInst);
  if (identityResult.matchType === 'EXACT_PERMANENT_ID') {
    ruleFlags.push('EXACT_AICTE_ID_MATCH');
  } else if (identityResult.matchType === 'NORMALIZED_NAME') {
    ruleFlags.push('NAME_SIMILARITY_MATCH');
  }

  if (identityResult.uncertainIdentity) {
    ruleFlags.push('UNCERTAIN_INSTITUTION_IDENTITY');
  }

  // 2. Cross-Bureau Analysis
  const isCrossBureau = sourceComplaint.bureau !== candidateComplaint.bureau;
  if (isCrossBureau) {
    ruleFlags.push('CROSS_BUREAU_INVOLVEMENT');
  }

  // 3. Operational Active State
  const bothActive = ACTIVE_STATUSES.has(sourceComplaint.status) && ACTIVE_STATUSES.has(candidateComplaint.status);
  if (bothActive) {
    ruleFlags.push('CONCURRENT_ACTIVE_CASES');
  }

  // 4. Category & Metadata Overlap
  const sameCategory = sourceComplaint.category &&
    candidateComplaint.category &&
    sourceComplaint.category.trim().toLowerCase() === candidateComplaint.category.trim().toLowerCase();
  if (sameCategory) {
    ruleFlags.push('CATEGORY_CONGRUENCE');
  }

  const sameComplainantType = sourceComplaint.complainant_type &&
    candidateComplaint.complainant_type &&
    sourceComplaint.complainant_type === candidateComplaint.complainant_type;
  if (sameComplainantType) {
    ruleFlags.push('SIMILAR_STAKEHOLDER_PROFILE');
  }

  // Temporal proximity (received within 90 days)
  let daysDiff = 999;
  if (sourceComplaint.received_date && candidateComplaint.received_date) {
    const d1 = new Date(sourceComplaint.received_date).getTime();
    const d2 = new Date(candidateComplaint.received_date).getTime();
    daysDiff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 90) {
      ruleFlags.push('TEMPORAL_PROXIMITY');
    }
  }

  // 5. Text Semantic Similarity via TF-IDF & Cosine
  const sourceTokens = tokenizeAndNormalize(`${sourceComplaint.subject} ${sourceComplaint.description}`);
  const candTokens = tokenizeAndNormalize(`${candidateComplaint.subject} ${candidateComplaint.description}`);

  const textSimilarity = computeCosineSimilarity(sourceTokens, candTokens);
  const sharedTerms = extractDiscriminatingTerms(sourceTokens, candTokens, 5);

  if (textSimilarity >= 0.55) {
    ruleFlags.push('HIGH_TEXT_SIMILARITY');
  } else if (textSimilarity >= 0.35) {
    ruleFlags.push('MODERATE_TEXT_SIMILARITY');
  }

  // 6. Evidence Scoring Calculation
  // Weights: Institution (0.35), Text (0.35), Category (0.20), Metadata (0.10)
  const instWeight = identityResult.institutionScore * 0.35;
  const textWeight = textSimilarity * 0.35;
  const catWeight = (sameCategory ? 1.0 : 0.0) * 0.20;
  const metaWeight = ((sameComplainantType ? 0.5 : 0.0) + (daysDiff <= 90 ? 0.5 : 0.0)) * 0.10;

  const confidenceScore = Number(Math.min(1.0, Math.max(0.0, instWeight + textWeight + catWeight + metaWeight)).toFixed(4));

  // 7. Relationship Classification
  // Distinguish:
  // - POTENTIAL_OPERATIONAL_OVERLAP: Same institution + Cross-bureau + (Category match OR Semantic text overlap >= 0.30)
  // - SAME_INSTITUTION: Same college, but disjoint causes of action (e.g. fees vs ragging, sports vs marksheet)
  // - POTENTIALLY_RELATED_COMPLAINTS: Pattern of allegations across different colleges or within same bureau
  let relationshipClassification = 'POTENTIALLY_RELATED_COMPLAINTS';

  const isSameInst = identityResult.matchType === 'EXACT_PERMANENT_ID' || identityResult.matchType === 'NORMALIZED_NAME';

  if (isSameInst) {
    if (isCrossBureau && (sameCategory || textSimilarity >= 0.30)) {
      relationshipClassification = 'POTENTIAL_OPERATIONAL_OVERLAP';
    } else if (!sameCategory && textSimilarity < 0.30) {
      relationshipClassification = 'SAME_INSTITUTION';
    } else {
      relationshipClassification = 'POTENTIALLY_RELATED_COMPLAINTS';
    }
  } else {
    relationshipClassification = 'POTENTIALLY_RELATED_COMPLAINTS';
  }

  // 8. Generate Clear Explainable Summary
  let explanation = '';
  const collegeName = sourceInst?.name || 'Institution';

  if (relationshipClassification === 'POTENTIAL_OPERATIONAL_OVERLAP') {
    explanation = `Cross-bureau operational overlap flagged between ${sourceComplaint.bureau.replace(/_/g, ' ')} and ${candidateComplaint.bureau.replace(/_/g, ' ')} for ${collegeName}. `;
    if (sameCategory) explanation += `Cases share category '${sourceComplaint.category}'. `;
    if (bothActive) explanation += 'Both cases are currently active and under investigation. ';
    if (sharedTerms.length > 0) explanation += `Allegation text shows ${(textSimilarity * 100).toFixed(1)}% semantic overlap citing terms: [${sharedTerms.join(', ')}].`;
  } else if (relationshipClassification === 'SAME_INSTITUTION') {
    explanation = `Complaints pertain to the same institution (${collegeName}), but address separate, disjoint issues (Text similarity: ${(textSimilarity * 100).toFixed(1)}%). No immediate operational duplication detected.`;
  } else {
    explanation = `Potentially related complaint pattern detected (Ranking score: ${(confidenceScore * 100).toFixed(1)}%). Text similarity is ${(textSimilarity * 100).toFixed(1)}% with matching terms: [${sharedTerms.join(', ')}].`;
    if (identityResult.matchType === 'DIFFERENT_INSTITUTION') {
      explanation += ' Originates from a different institution.';
    }
  }

  return {
    sourceComplaintId: sourceComplaint.id,
    candidateComplaintId: candidateComplaint.id,
    confidenceScore,
    relationshipClassification,
    institutionMatchType: identityResult.matchType,
    ruleFlags,
    evidenceBreakdown: {
      institutionEvidence: {
        matchType: identityResult.matchType,
        sourceAicteId: sourceInst?.aicte_permanent_id || null,
        candidateAicteId: candidateInst?.aicte_permanent_id || null,
        uncertainIdentity: identityResult.uncertainIdentity,
        reason: identityResult.reason
      },
      bureauEvidence: {
        sourceBureau: sourceComplaint.bureau,
        candidateBureau: candidateComplaint.bureau,
        isCrossBureau,
        bothActive
      },
      categoryEvidence: {
        sourceCategory: sourceComplaint.category,
        candidateCategory: candidateComplaint.category,
        sameCategory
      },
      textEvidence: {
        cosineSimilarity: textSimilarity,
        sharedTerms
      },
      temporalEvidence: {
        daysDifference: Math.round(daysDiff),
        within90Days: daysDiff <= 90
      }
    },
    explanation
  };
}

/**
 * Runs matching pipeline for a source complaint against all stored complaints
 */
async function matchComplaint(sourceComplaint, { complaintRepo, institutionRepo, matchAlertRepo }) {
  const allComplaints = await complaintRepo.findAll();
  const candidates = retrieveCandidates(sourceComplaint, allComplaints);

  if (!candidates.length) {
    return [];
  }

  const sourceInst = await institutionRepo.findById(sourceComplaint.institution_id);
  const alertsCreated = [];

  for (const candidate of candidates) {
    const candidateInst = await institutionRepo.findById(candidate.institution_id);
    const evaluation = evaluateCasePair(sourceComplaint, candidate, sourceInst, candidateInst);

    // Save alert if it represents actionable intelligence:
    // 1. Any operational overlap
    // 2. High/moderate confidence related complaints (confidence >= 0.35)
    // 3. Same institution records where score >= 0.20
    const isActionable =
      evaluation.relationshipClassification === 'POTENTIAL_OPERATIONAL_OVERLAP' ||
      evaluation.confidenceScore >= 0.35 ||
      evaluation.relationshipClassification === 'SAME_INSTITUTION';

    if (isActionable) {
      const alertRecord = {
        source_complaint_id: sourceComplaint.id,
        candidate_complaint_id: candidate.id,
        source_case_id: sourceComplaint.case_id,
        source_subject: sourceComplaint.subject,
        source_bureau: sourceComplaint.bureau,
        source_status: sourceComplaint.status,
        candidate_case_id: candidate.case_id,
        candidate_subject: candidate.subject,
        candidate_bureau: candidate.bureau,
        candidate_status: candidate.status,
        confidence_score: evaluation.confidenceScore,
        relationship_classification: evaluation.relationshipClassification,
        institution_match_type: evaluation.institutionMatchType,
        rule_flags: evaluation.ruleFlags,
        evidence_breakdown: evaluation.evidenceBreakdown,
        explanation: evaluation.explanation,
        status: 'PENDING_REVIEW'
      };

      const saved = await matchAlertRepo.createOrUpdate(alertRecord);
      alertsCreated.push(saved);
    }
  }

  return alertsCreated;
}

module.exports = {
  normalizeIdentifier,
  resolveInstitutionIdentity,
  retrieveCandidates,
  evaluateCasePair,
  matchComplaint
};
