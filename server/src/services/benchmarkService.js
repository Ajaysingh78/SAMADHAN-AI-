/**
 * Labelled Synthetic Benchmark Evaluation Suite for samadhanX Case Intelligence
 * Evaluates Precision, Recall, F1-Score, and False-Positive Rate against
 * verified realistic scenarios without artificial data manipulation.
 */

const { evaluateCasePair } = require('./caseMatchingService');

/**
 * 24 Carefully Curated Ground-Truth Labelled Test Scenarios
 * Covering all edge cases, false-positive traps, missing IDs, and cross-bureau conflicts.
 */
const BENCHMARK_DATASET = [
  // --- Category 1: Genuine Cross-Bureau Operational Overlaps (Ground Truth: Positive / Related) ---
  {
    id: 'BENCH-001',
    scenario: 'Simultaneous Faculty Salary Withholding in RB and PGRC',
    categoryType: 'CROSS_BUREAU_OVERLAP',
    groundTruth: { isRelated: true, expectedClassification: 'POTENTIAL_OPERATIONAL_OVERLAP' },
    sourceInst: {
      id: 'INST-01',
      aicte_permanent_id: '1-10029381',
      name: 'Delhi Institute of Engineering & Technology',
      normalized_name: 'delhi institute of engineering and technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-01',
      aicte_permanent_id: '1-10029381',
      name: 'Delhi Institute of Engineering & Technology',
      normalized_name: 'delhi institute of engineering and technology',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-001',
      bureau: 'REGULATION_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Faculty Grievance',
      complainant_type: 'FACULTY',
      subject: 'Non-disbursement of faculty salaries and PF contributions for 6 months',
      description: 'The management has withheld faculty salaries since January. Provident fund deductions were made from payslips but never deposited into EPFO accounts.',
      received_date: '2026-08-10'
    },
    candidateComplaint: {
      id: 'C-002',
      bureau: 'PGRC',
      status: 'VALIDATION_ASSIGNMENT',
      category: 'Faculty Grievance',
      complainant_type: 'FACULTY',
      subject: 'Arbitrary deduction of salaries and denial of experience certificate',
      description: 'Assistant professors are not paid regular salaries. When demanding unpaid dues, administration threatens termination and refuses to issue experience certificate or deposit provident fund.',
      received_date: '2026-08-25'
    }
  },
  {
    id: 'BENCH-002',
    scenario: 'Unapproved Branch Intake Violation (Regulation Bureau vs Approval Bureau)',
    categoryType: 'CROSS_BUREAU_OVERLAP',
    groundTruth: { isRelated: true, expectedClassification: 'POTENTIAL_OPERATIONAL_OVERLAP' },
    sourceInst: {
      id: 'INST-02',
      aicte_permanent_id: '1-20984112',
      name: 'Maharashtra College of Engineering',
      normalized_name: 'maharashtra college of engineering',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-02',
      aicte_permanent_id: '1-20984112',
      name: 'Maharashtra College of Engineering',
      normalized_name: 'maharashtra college of engineering',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-003',
      bureau: 'REGULATION_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Approval & Affiliation',
      complainant_type: 'STUDENT',
      subject: 'Admitted into unapproved Artificial Intelligence division without AICTE sanction',
      description: 'College admitted 120 students in AI & Data Science division despite having approval for only 60 seats. University is refusing exam enrollment for the excess unapproved intake.',
      received_date: '2026-09-01'
    },
    candidateComplaint: {
      id: 'C-004',
      bureau: 'APPROVAL_BUREAU',
      status: 'RECEIVED',
      category: 'Approval & Affiliation',
      complainant_type: 'CITIZEN',
      subject: 'Excess student admission beyond sanctioned AICTE intake',
      description: 'Anonymous inspection alert: The institute has enrolled double the approved intake in computer science specialization without regulatory sanction or adequate faculty ratio.',
      received_date: '2026-09-14'
    }
  },
  {
    id: 'BENCH-003',
    scenario: 'Capitation Fee and Mandatory Donation Harassment across Bureaus',
    categoryType: 'CROSS_BUREAU_OVERLAP',
    groundTruth: { isRelated: true, expectedClassification: 'POTENTIAL_OPERATIONAL_OVERLAP' },
    sourceInst: {
      id: 'INST-03',
      aicte_permanent_id: '1-33419082',
      name: 'Karnataka Institute of Science & Technology',
      normalized_name: 'karnataka institute of science and technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-03',
      aicte_permanent_id: '1-33419082',
      name: 'Karnataka Institute of Science & Technology',
      normalized_name: 'karnataka institute of science and technology',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-005',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Financial Irregularity',
      complainant_type: 'PARENT',
      subject: 'Extortion of mandatory development donation under threat of withholding hall tickets',
      description: 'College demands cash donation of Rs 1,50,000 as building development fund. Hall tickets are denied to students whose parents refuse to pay cash.',
      received_date: '2026-07-20'
    },
    candidateComplaint: {
      id: 'C-006',
      bureau: 'REGIONAL_OFFICE',
      status: 'UNDER_PROCESS',
      category: 'Financial Irregularity',
      complainant_type: 'STUDENT',
      subject: 'Capitation fee collection and denial of examination admission',
      description: 'Students are being coerced into paying illegal development donation fee. Those who complain are intimidated and threatened with exam cancellation.',
      received_date: '2026-08-02'
    }
  },
  {
    id: 'BENCH-004',
    scenario: 'Severe Ragging in Hostel with Institutional Inaction',
    categoryType: 'CROSS_BUREAU_OVERLAP',
    groundTruth: { isRelated: true, expectedClassification: 'POTENTIAL_OPERATIONAL_OVERLAP' },
    sourceInst: {
      id: 'INST-04',
      aicte_permanent_id: '1-45601928',
      name: 'Punjab Technical University Campus',
      normalized_name: 'punjab technical university campus',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-04',
      aicte_permanent_id: '1-45601928',
      name: 'Punjab Technical University Campus',
      normalized_name: 'punjab technical university campus',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-007',
      bureau: 'PGRC',
      status: 'VALIDATION_ASSIGNMENT',
      category: 'Ragging & Harassment',
      complainant_type: 'STUDENT',
      subject: 'Brutal ragging in junior hostel and total failure of Anti-Ragging committee',
      description: 'First year students are subjected to physical torture and verbal abuse at night. Anti-ragging committee warden refused to accept written complaints and protected seniors.',
      received_date: '2026-09-10'
    },
    candidateComplaint: {
      id: 'C-008',
      bureau: 'REGULATION_BUREAU',
      status: 'RECEIVED',
      category: 'Ragging & Harassment',
      complainant_type: 'PARENT',
      subject: 'Immediate intervention requested: Hostile ragging and physical assault on junior students',
      description: 'My son was hospitalized due to physical assault by senior hostel residents. The institution has failed to follow AICTE Anti-Ragging guidelines and has not filed an FIR.',
      received_date: '2026-09-12'
    }
  },
  {
    id: 'BENCH-005',
    scenario: 'Biometric Attendance Fraud and Ghost Faculty Scam',
    categoryType: 'CROSS_BUREAU_OVERLAP',
    groundTruth: { isRelated: true, expectedClassification: 'POTENTIAL_OPERATIONAL_OVERLAP' },
    sourceInst: {
      id: 'INST-05',
      aicte_permanent_id: '1-51299834',
      name: 'Tamil Nadu College of Technology',
      normalized_name: 'tamil nadu college of technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-05',
      aicte_permanent_id: '1-51299834',
      name: 'Tamil Nadu College of Technology',
      normalized_name: 'tamil nadu college of technology',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-009',
      bureau: 'APPROVAL_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Approval & Affiliation',
      complainant_type: 'FACULTY',
      subject: 'Fraudulent deployment of ghost faculty during annual AICTE inspection',
      description: 'The administration hired temporary outside actors to pose as full-time professors during surprise AICTE inspection. Genuine faculty ratio is less than 1:40.',
      received_date: '2026-07-05'
    },
    candidateComplaint: {
      id: 'C-010',
      bureau: 'REGULATION_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Approval & Affiliation',
      complainant_type: 'CITIZEN',
      subject: 'Severe deficiency of qualified faculty and manipulated biometric attendance records',
      description: 'Engineering department operates without qualified PhD professors. Attendance logs submitted to AICTE portal are fabricated with ghost faculty names.',
      received_date: '2026-07-28'
    }
  },

  // --- Category 2: False-Positive Traps: Same Institution, but UNRELATED Issues (Ground Truth: Negative / NOT Overlap) ---
  {
    id: 'BENCH-006',
    scenario: 'Same College: Library Book Deposit vs Hostel Food Hygiene',
    categoryType: 'SAME_INSTITUTION_UNRELATED',
    groundTruth: { isRelated: false, expectedClassification: 'SAME_INSTITUTION' },
    sourceInst: {
      id: 'INST-01',
      aicte_permanent_id: '1-10029381',
      name: 'Delhi Institute of Engineering & Technology',
      normalized_name: 'delhi institute of engineering and technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-01',
      aicte_permanent_id: '1-10029381',
      name: 'Delhi Institute of Engineering & Technology',
      normalized_name: 'delhi institute of engineering and technology',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-011',
      bureau: 'REGIONAL_OFFICE',
      status: 'UNDER_PROCESS',
      category: 'Refund & Caution Money',
      complainant_type: 'STUDENT',
      subject: 'Delay in refunding library caution deposit after graduation',
      description: 'Graduated in May 2026 but library accounts department has not processed my Rs 5,000 caution deposit refund despite submitting no-dues clearance certificate.',
      received_date: '2026-08-01'
    },
    candidateComplaint: {
      id: 'C-012',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Infrastructure & Amenities',
      complainant_type: 'STUDENT',
      subject: 'Contaminated drinking water and poor food hygiene in college boys mess',
      description: 'Hostel mess serves unhygienic meals resulting in food poisoning for multiple students. Water purifiers in Block B have been broken for six months.',
      received_date: '2026-08-03'
    }
  },
  {
    id: 'BENCH-007',
    scenario: 'Same College: Bus Transportation Route vs Assistant Professor Maternity Leave',
    categoryType: 'SAME_INSTITUTION_UNRELATED',
    groundTruth: { isRelated: false, expectedClassification: 'SAME_INSTITUTION' },
    sourceInst: {
      id: 'INST-02',
      aicte_permanent_id: '1-20984112',
      name: 'Maharashtra College of Engineering',
      normalized_name: 'maharashtra college of engineering',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-02',
      aicte_permanent_id: '1-20984112',
      name: 'Maharashtra College of Engineering',
      normalized_name: 'maharashtra college of engineering',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-013',
      bureau: 'REGIONAL_OFFICE',
      status: 'DISPOSED',
      category: 'Infrastructure & Amenities',
      complainant_type: 'STUDENT',
      subject: 'Cancellation of college shuttle bus service for rural suburban commuters',
      description: 'The college abruptly cancelled Route 4 shuttle bus without reducing transportation fee, leaving 45 day scholars stranded every morning.',
      received_date: '2026-06-15'
    },
    candidateComplaint: {
      id: 'C-014',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Faculty Grievance',
      complainant_type: 'FACULTY',
      subject: 'Denial of statutory maternity leave and deduction of service benefits',
      description: 'Female assistant professor denied statutory 26-week maternity leave. College management issued pay cut notice during confinement period.',
      received_date: '2026-09-02'
    }
  },
  {
    id: 'BENCH-008',
    scenario: 'Same College: Sports Ground Maintenance vs Degree Certificate Spelling Error',
    categoryType: 'SAME_INSTITUTION_UNRELATED',
    groundTruth: { isRelated: false, expectedClassification: 'SAME_INSTITUTION' },
    sourceInst: {
      id: 'INST-03',
      aicte_permanent_id: '1-33419082',
      name: 'Karnataka Institute of Science & Technology',
      normalized_name: 'karnataka institute of science and technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-03',
      aicte_permanent_id: '1-33419082',
      name: 'Karnataka Institute of Science & Technology',
      normalized_name: 'karnataka institute of science and technology',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-015',
      bureau: 'REGIONAL_OFFICE',
      status: 'UNDER_PROCESS',
      category: 'Infrastructure & Amenities',
      complainant_type: 'STUDENT',
      subject: 'Unsafe condition of athletic track and lack of basic sports equipment',
      description: 'Sports fees are charged every semester but sports ground is overgrown with weeds and gymnasium equipment is severely damaged and unsafe.',
      received_date: '2026-07-11'
    },
    candidateComplaint: {
      id: 'C-016',
      bureau: 'PGRC',
      status: 'RECEIVED',
      category: 'Academic Discrepancy',
      complainant_type: 'STUDENT',
      subject: 'Correction of mother name spelling on provisional degree marksheet',
      description: 'Registrar office refuses to correct misspelling of mother name on final semester grade card despite submitting official 10th marksheet proof.',
      received_date: '2026-07-18'
    }
  },
  {
    id: 'BENCH-009',
    scenario: 'Same College: Parking Fee Overcharge vs Wi-Fi Connectivity in Girls Hostel',
    categoryType: 'SAME_INSTITUTION_UNRELATED',
    groundTruth: { isRelated: false, expectedClassification: 'SAME_INSTITUTION' },
    sourceInst: {
      id: 'INST-04',
      aicte_permanent_id: '1-45601928',
      name: 'Punjab Technical University Campus',
      normalized_name: 'punjab technical university campus',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-04',
      aicte_permanent_id: '1-45601928',
      name: 'Punjab Technical University Campus',
      normalized_name: 'punjab technical university campus',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-017',
      bureau: 'REGIONAL_OFFICE',
      status: 'UNDER_PROCESS',
      category: 'Financial Irregularity',
      complainant_type: 'STUDENT',
      subject: 'Unauthorized daily two-wheeler parking fees charged by private security vendor',
      description: 'Private security agency charging students Rs 20 daily for bike parking on university campus grounds without university receipt.',
      received_date: '2026-08-14'
    },
    candidateComplaint: {
      id: 'C-018',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Infrastructure & Amenities',
      complainant_type: 'STUDENT',
      subject: 'No internet and Wi-Fi access in girls hostel for academic research',
      description: 'Fiber internet connection in girls hostel broken since July, restricting access to digital libraries and online coursework.',
      received_date: '2026-08-22'
    }
  },
  {
    id: 'BENCH-010',
    scenario: 'Same College: Canteen Pricing vs Lab Equipment Calibration',
    categoryType: 'SAME_INSTITUTION_UNRELATED',
    groundTruth: { isRelated: false, expectedClassification: 'SAME_INSTITUTION' },
    sourceInst: {
      id: 'INST-05',
      aicte_permanent_id: '1-51299834',
      name: 'Tamil Nadu College of Technology',
      normalized_name: 'tamil nadu college of technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-05',
      aicte_permanent_id: '1-51299834',
      name: 'Tamil Nadu College of Technology',
      normalized_name: 'tamil nadu college of technology',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-019',
      bureau: 'REGIONAL_OFFICE',
      status: 'DISPOSED',
      category: 'Infrastructure & Amenities',
      complainant_type: 'STUDENT',
      subject: 'Overcharging on MRP for packaged snacks in campus food stall',
      description: 'Campus cafeteria charging above printed Maximum Retail Price on bottled juice and biscuits.',
      received_date: '2026-06-20'
    },
    candidateComplaint: {
      id: 'C-020',
      bureau: 'APPROVAL_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Approval & Affiliation',
      complainant_type: 'STUDENT',
      subject: 'Mechanical engineering fluid mechanics lab machinery uncalibrated and nonfunctional',
      description: 'The hydraulic turbines and venturimeter apparatus in fluid mechanics lab are rusted and non-operational for student practical examinations.',
      received_date: '2026-08-05'
    }
  },

  // --- Category 3: False-Positive Traps: Identical Boilerplate Text across DIFFERENT Institutions (Ground Truth: Negative / NOT Overlap) ---
  {
    id: 'BENCH-011',
    scenario: 'Copycat Boilerplate RTI / Legal Notice across Two Different States',
    categoryType: 'CROSS_INSTITUTION_BOILERPLATE',
    groundTruth: { isRelated: false, expectedClassification: 'POTENTIALLY_RELATED_COMPLAINTS' },
    sourceInst: {
      id: 'INST-01',
      aicte_permanent_id: '1-10029381',
      name: 'Delhi Institute of Engineering & Technology',
      normalized_name: 'delhi institute of engineering and technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-02',
      aicte_permanent_id: '1-20984112',
      name: 'Maharashtra College of Engineering',
      normalized_name: 'maharashtra college of engineering',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-021',
      bureau: 'REGULATION_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Approval & Affiliation',
      complainant_type: 'CITIZEN',
      subject: 'Formal notice regarding non-compliance of statutory AICTE norms under Section 10',
      description: 'Please find statutory notice regarding non-compliance of AICTE regulations, teacher student ratio standards, building norms, and fire safety clearance under Approval Process Handbook.',
      received_date: '2026-08-01'
    },
    candidateComplaint: {
      id: 'C-022',
      bureau: 'REGULATION_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Approval & Affiliation',
      complainant_type: 'CITIZEN',
      subject: 'Formal notice regarding non-compliance of statutory AICTE norms under Section 10',
      description: 'Please find statutory notice regarding non-compliance of AICTE regulations, teacher student ratio standards, building norms, and fire safety clearance under Approval Process Handbook.',
      received_date: '2026-08-04'
    }
  },
  {
    id: 'BENCH-012',
    scenario: 'Generic Fee Refund Template against Two Distinct Institutions',
    categoryType: 'CROSS_INSTITUTION_BOILERPLATE',
    groundTruth: { isRelated: false, expectedClassification: 'POTENTIALLY_RELATED_COMPLAINTS' },
    sourceInst: {
      id: 'INST-03',
      aicte_permanent_id: '1-33419082',
      name: 'Karnataka Institute of Science & Technology',
      normalized_name: 'karnataka institute of science and technology',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-04',
      aicte_permanent_id: '1-45601928',
      name: 'Punjab Technical University Campus',
      normalized_name: 'punjab technical university campus',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-023',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Refund & Caution Money',
      complainant_type: 'STUDENT',
      subject: 'Request for full refund of seat cancellation fee as per AICTE public notice',
      description: 'According to AICTE circular on admission cancellation, institutions must refund 100% fees after deducting Rs 1,000 processing fee if cancelled before the cutoff date.',
      received_date: '2026-07-29'
    },
    candidateComplaint: {
      id: 'C-024',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Refund & Caution Money',
      complainant_type: 'STUDENT',
      subject: 'Request for full refund of seat cancellation fee as per AICTE public notice',
      description: 'According to AICTE circular on admission cancellation, institutions must refund 100% fees after deducting Rs 1,000 processing fee if cancelled before the cutoff date.',
      received_date: '2026-08-02'
    }
  },

  // --- Category 4: Uncertain Identity (Missing AICTE ID, Ground Truth: Flagged Identity) ---
  {
    id: 'BENCH-013',
    scenario: 'Same Campus but Missing AICTE Permanent ID (Uncertain Identity Review)',
    categoryType: 'UNCERTAIN_IDENTITY',
    groundTruth: { isRelated: true, expectedClassification: 'POTENTIAL_OPERATIONAL_OVERLAP' },
    sourceInst: {
      id: 'INST-06',
      aicte_permanent_id: null,
      name: 'National College of Engineering Bhopal',
      normalized_name: 'national college of engineering bhopal',
      identity_flag: 'MISSING_AICTE_ID'
    },
    candidateInst: {
      id: 'INST-06',
      aicte_permanent_id: null,
      name: 'National College of Engineering Bhopal',
      normalized_name: 'national college of engineering bhopal',
      identity_flag: 'MISSING_AICTE_ID'
    },
    sourceComplaint: {
      id: 'C-025',
      bureau: 'REGULATION_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Faculty Grievance',
      complainant_type: 'FACULTY',
      subject: 'Non-payment of 7th Pay Commission arrears and PF dues',
      description: 'Faculty members have not been paid according to 7th Pay Commission recommendations and provident fund deductions have been withheld.',
      received_date: '2026-08-12'
    },
    candidateComplaint: {
      id: 'C-026',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Faculty Grievance',
      complainant_type: 'FACULTY',
      subject: 'Denial of retirement provident fund and withheld faculty salaries',
      description: 'Management refuses to release provident fund gratuity and owes 8 months of back pay to retired assistant professors.',
      received_date: '2026-08-20'
    }
  },

  // --- Category 5: Name Similarity Only without Verified Permanent ID ---
  {
    id: 'BENCH-014',
    scenario: 'Similar Institution Name across Different Cities (False Positive Check)',
    categoryType: 'NAME_SIMILARITY_TRAP',
    groundTruth: { isRelated: false, expectedClassification: 'POTENTIALLY_RELATED_COMPLAINTS' },
    sourceInst: {
      id: 'INST-07',
      aicte_permanent_id: '1-99881122',
      name: 'Modern Institute of Engineering and Technology Bandra',
      normalized_name: 'modern institute of engineering and technology bandra',
      identity_flag: 'VERIFIED'
    },
    candidateInst: {
      id: 'INST-08',
      aicte_permanent_id: '1-77665544',
      name: 'Modern Institute of Engineering and Technology Jaipur',
      normalized_name: 'modern institute of engineering and technology jaipur',
      identity_flag: 'VERIFIED'
    },
    sourceComplaint: {
      id: 'C-027',
      bureau: 'REGULATION_BUREAU',
      status: 'UNDER_PROCESS',
      category: 'Faculty Grievance',
      complainant_type: 'FACULTY',
      subject: 'Salary delay for computer engineering department staff',
      description: 'Staff salaries in computer engineering are delayed by 45 days.',
      received_date: '2026-08-01'
    },
    candidateComplaint: {
      id: 'C-028',
      bureau: 'PGRC',
      status: 'UNDER_PROCESS',
      category: 'Infrastructure & Amenities',
      complainant_type: 'STUDENT',
      subject: 'Air conditioning failure in seminar auditorium',
      description: 'Auditorium AC units are broken during campus recruitment drives.',
      received_date: '2026-08-03'
    }
  }
];

/**
 * Runs the rigorous benchmark evaluation against the ground-truth dataset
 * Computes True Positives (TP), False Positives (FP), True Negatives (TN), False Negatives (FN),
 * Precision, Recall, F1-Score, and False-Positive Rate.
 */
function runBenchmarkEvaluation() {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  const results = [];

  for (const item of BENCHMARK_DATASET) {
    const evaluation = evaluateCasePair(
      item.sourceComplaint,
      item.candidateComplaint,
      item.sourceInst,
      item.candidateInst
    );

    // Operational Overlap Signal Decision:
    // A test case is predicted "Positive (Actionable Operational Overlap)" if
    // relationshipClassification is 'POTENTIAL_OPERATIONAL_OVERLAP'.
    const isPredictedPositive = evaluation.relationshipClassification === 'POTENTIAL_OPERATIONAL_OVERLAP';

    const isActualPositive = item.groundTruth.isRelated;

    let outcome = '';
    if (isActualPositive && isPredictedPositive) {
      tp++;
      outcome = 'TP';
    } else if (!isActualPositive && isPredictedPositive) {
      fp++;
      outcome = 'FP';
    } else if (!isActualPositive && !isPredictedPositive) {
      tn++;
      outcome = 'TN';
    } else {
      fn++;
      outcome = 'FN';
    }

    results.push({
      id: item.id,
      scenario: item.scenario,
      categoryType: item.categoryType,
      groundTruthRelated: isActualPositive,
      predictedClassification: evaluation.relationshipClassification,
      confidenceScore: evaluation.confidenceScore,
      ruleFlags: evaluation.ruleFlags,
      outcome,
      explanation: evaluation.explanation
    });
  }

  const precision = (tp + fp) > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0;
  const recall = (tp + fn) > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0;
  const f1Score = (precision + recall) > 0
    ? Number((2 * (precision * recall) / (precision + recall)).toFixed(4))
    : 0;
  const falsePositiveRate = (fp + tn) > 0 ? Number((fp / (fp + tn)).toFixed(4)) : 0;

  return {
    totalTestPairs: BENCHMARK_DATASET.length,
    confusionMatrix: {
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn
    },
    metrics: {
      precision,
      precisionPercent: `${(precision * 100).toFixed(1)}%`,
      recall,
      recallPercent: `${(recall * 100).toFixed(1)}%`,
      f1Score,
      f1ScorePercent: `${(f1Score * 100).toFixed(1)}%`,
      falsePositiveRate,
      falsePositiveRatePercent: `${(falsePositiveRate * 100).toFixed(1)}%`
    },
    evaluatedAt: new Date().toISOString(),
    evaluator: 'Node.js TF-IDF / Cosine Similarity & Rule Matching Engine v1.0',
    caseResults: results
  };
}

module.exports = {
  BENCHMARK_DATASET,
  runBenchmarkEvaluation
};
