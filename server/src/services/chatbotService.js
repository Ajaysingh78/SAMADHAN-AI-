/**
 * AICTE samadhanXX Intelligent Chatbot & Copilot Service
 * Provides dual-mode intelligence:
 * 1. Citizen Grievance Guide (Public mode: FAQ, AICTE norms, privacy-safe case tracking)
 * 2. Officer Operations Copilot (Authenticated mode: SLA alerts, cross-bureau matches, case summaries)
 */

const complaintRepository = require('../db/repositories/complaintRepository');
const institutionRepository = require('../db/repositories/institutionRepository');
const matchAlertRepository = require('../db/repositories/matchAlertRepository');
const { calculateSlaStatus, STATUS_LABELS } = require('./workflowService');

class ChatbotService {
  /**
   * Process incoming user query with contextual intent routing
   */
  async processQuery({ message, user = null, history = [] }) {
    if (!message || typeof message !== 'string') {
      return {
        answer: 'Namaste! How may I assist you with AICTE complaints and grievance resolution today?',
        suggestions: this.getDefaultSuggestions(Boolean(user)),
        intent: 'GREETING'
      };
    }

    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check for Case ID pattern (e.g., CMP-2026-PGRC-0010, CMP-2026-RB-0021)
    const caseIdMatch = trimmed.match(/\b(CMP-\d{4}-[A-Za-z0-9]+-\d{2,6})\b/i);
    if (caseIdMatch) {
      return await this.handleCaseLookup(caseIdMatch[1].toUpperCase(), user);
    }

    // 2. Authenticated Officer Copilot Intents
    if (user) {
      if (this.matchesAny(lower, ['overdue', 'sla', 'deadline', 'late', 'breached'])) {
        return await this.handleOfficerOverdueSummary(user);
      }
      if (this.matchesAny(lower, ['match', 'overlap', 'duplicate', 'intelligence', 'cross-bureau', 'alert'])) {
        return await this.handleOfficerMatchAlertsSummary(user);
      }
      if (this.matchesAny(lower, ['workload', 'distribution', 'statistics', 'pending cases', 'summary'])) {
        return await this.handleOfficerWorkloadSummary(user);
      }
    }

    // 3. AICTE Grievance & Regulatory Knowledge Intents (Public & Officer)
    if (this.matchesAny(lower, ['fee', 'refund', 'cancellation', 'seat withdraw', 'capitation', 'caution money', 'donation'])) {
      return this.handleFeeRefundPolicy();
    }

    if (this.matchesAny(lower, ['ragging', 'harassment', 'bully', 'safety', 'mental torture', 'threat'])) {
      return this.handleAntiRaggingGuidance();
    }

    if (this.matchesAny(lower, ['salary', 'faculty', '7th cpc', 'remuneration', 'pay scale', 'pf', 'teacher'])) {
      return this.handleFacultySalaryPolicy();
    }

    if (this.matchesAny(lower, ['original', 'certificate', 'marksheet', 'document', 'leaving cert', 'withholding'])) {
      return this.handleCertificateRetentionPolicy();
    }

    if (this.matchesAny(lower, ['unapproved', 'fake college', 'approval', 'aicte recognized', 'valid course', 'fraudulent'])) {
      return this.handleApprovalVerificationGuidance();
    }

    if (this.matchesAny(lower, ['how to file', 'procedure', 'file complaint', 'lodge grievance', 'new complaint', 'register case'])) {
      return this.handleFilingProcedureGuidance(Boolean(user));
    }

    if (this.matchesAny(lower, ['who are you', 'what is samadhanX', 'samadhanXx', 'about', 'help', 'hi', 'hello', 'namaste'])) {
      return this.handleIntroduction(Boolean(user), user);
    }

    // 4. Fallback response with helpful prompt suggestions
    return {
      answer: user
        ? `I am your **samadhanXX Officer Copilot**. You can ask me to track specific cases by entering a Case ID (e.g. \`CMP-2026-PGRC-0010\`), query **overdue SLA cases**, review **cross-bureau match alerts**, or inspect **bureau workload**.`
        : `Namaste! I am the **AICTE samadhanX Sahayak** virtual assistant. I can help you track your complaint status, explain AICTE fee refund policies, anti-ragging protocols, certificate return norms, or guide you on filing a grievance.`,
      suggestions: this.getDefaultSuggestions(Boolean(user)),
      intent: 'GENERAL_GUIDANCE'
    };
  }

  /**
   * Handle Case ID Lookup (Context-aware: Public safe vs Officer detailed)
   */
  async handleCaseLookup(caseId, user) {
    try {
      const complaint = await complaintRepository.findByCaseId(caseId);

      if (!complaint) {
        return {
          answer: `⚠️ **Case Not Found:** We could not find any active complaint with ID \`${caseId}\`.\n\nPlease ensure the format matches \`CMP-YYYY-BUREAU-XXXX\` (e.g., \`CMP-2026-PGRC-0010\` or \`CMP-2026-RB-0021\`).`,
          suggestions: user
            ? ['Track CMP-2026-PGRC-0010', 'Track CMP-2026-RB-0021', 'Show Overdue Cases']
            : ['Track CMP-2026-PGRC-0010', 'How to File a Complaint?', 'Fee Refund Rules'],
          intent: 'CASE_NOT_FOUND'
        };
      }

      // Check SLA status
      const sla = calculateSlaStatus(
        complaint.expected_disposal_date,
        complaint.status,
        complaint.disposed_date,
        complaint.severity === 'CRITICAL'
      );

      const statusName = STATUS_LABELS[complaint.status] || complaint.status;
      const bureauLabel = complaint.bureau === 'REGULATION_BUREAU' ? 'Regulation Bureau (RB)' :
        complaint.bureau === 'PGRC' ? 'Public Grievance Redressal Cell (PGRC)' :
          complaint.bureau === 'APPROVAL_BUREAU' ? 'Approval Bureau (APP)' : complaint.bureau;

      if (user) {
        // Authenticated Officer Mode: Complete Operational Detail
        let answer = `### 📋 Case Dossier: \`${complaint.case_id}\`\n\n`;
        answer += `* **Status:** \`${statusName}\`\n`;
        answer += `* **Bureau Jurisdiction:** ${bureauLabel}\n`;
        answer += `* **Severity:** \`${complaint.severity || 'STANDARD'}\`\n`;
        answer += `* **Category:** ${complaint.category?.replace(/_/g, ' ') || 'General'}\n`;
        answer += `* **Subject:** *${complaint.subject}*\n`;
        answer += `* **Registration Date:** ${complaint.received_date || 'N/A'}\n`;
        answer += `* **Target SLA Date:** ${complaint.expected_disposal_date || 'N/A'}\n`;

        if (sla.isOverdue) {
          answer += `* **SLA Health:** 🚨 **OVERDUE** by **${sla.daysOverdue} day(s)**!\n`;
        } else if (sla.daysRemaining <= 7 && !sla.isDisposed) {
          answer += `* **SLA Health:** ⚠️ **Critical** (${sla.daysRemaining} days remaining)\n`;
        } else if (sla.isDisposed) {
          answer += `* **SLA Health:** ✅ Disposed / Closed\n`;
        } else {
          answer += `* **SLA Health:** 🟢 On Schedule (${sla.daysRemaining} days remaining)\n`;
        }

        answer += `\n*Select a quick action below to open this case in the official workflow:*`;

        return {
          answer,
          suggestions: [
            `View Case ${complaint.case_id}`,
            'Check Cross-Bureau Matches',
            'Show Overdue Cases'
          ],
          intent: 'OFFICER_CASE_LOOKUP',
          metadata: {
            caseId: complaint.case_id,
            id: complaint.id,
            status: complaint.status
          }
        };
      } else {
        // Public Citizen Mode: Privacy-safe grievance tracking
        let answer = `### 🇮🇳 AICTE Grievance Status: \`${complaint.case_id}\`\n\n`;
        answer += `* **Current Progress:** **${statusName}**\n`;
        answer += `* **Assigned Bureau:** ${bureauLabel}\n`;
        answer += `* **Date of Registration:** ${complaint.received_date || 'N/A'}\n`;
        answer += `* **Expected Resolution Target:** ${complaint.expected_disposal_date || 'Within statutory 30 days'}\n\n`;

        if (complaint.status === 'DISPOSED') {
          answer += `✅ **Outcome:** This grievance has been officially reviewed and disposed by the competent AICTE Bureau.`;
        } else {
          answer += `ℹ️ **Note:** The case is actively being processed by the designated inquiry committee. You will receive an official update upon completion of procedural review.`;
        }

        answer += `\n\n*(Under AICTE Citizen Charter and Privacy Directives, personal contact details are masked).*`;

        return {
          answer,
          suggestions: ['How to submit additional evidence?', 'AICTE Fee Refund Policy', 'Track Another Case'],
          intent: 'CITIZEN_CASE_LOOKUP',
          metadata: {
            caseId: complaint.case_id,
            status: complaint.status
          }
        };
      }
    } catch (err) {
      console.error('[ChatbotService] Case lookup error:', err);
      return {
        answer: `An error occurred while retrieving case details. Please try again.`,
        suggestions: ['Track CMP-2026-PGRC-0010', 'Fee Refund Rules'],
        intent: 'ERROR'
      };
    }
  }

  /**
   * Officer: Overdue SLA Summary
   */
  async handleOfficerOverdueSummary(user) {
    try {
      const allComplaints = await complaintRepository.findAll();

      // Filter by Bureau if scoped
      let scoped = allComplaints;
      if (user.role === 'BUREAU_OFFICER' && user.primaryBureau) {
        scoped = allComplaints.filter(c => c.bureau === user.primaryBureau);
      }

      const overdueList = [];
      const warningList = [];

      for (const c of scoped) {
        const sla = calculateSlaStatus(c.expected_disposal_date, c.status, c.disposed_date, c.severity === 'CRITICAL');
        if (sla.isOverdue) {
          overdueList.push({ ...c, daysOverdue: sla.daysOverdue });
        } else if (sla.daysRemaining <= 7 && !sla.isDisposed) {
          warningList.push({ ...c, daysRemaining: sla.daysRemaining });
        }
      }

      let answer = `### 🚨 SLA Operational Alert Summary\n\n`;
      answer += `Jurisdiction: **${user.primaryBureau || 'All AICTE Bureaus (Consolidated)'}**\n\n`;
      answer += `* **Total Overdue Cases:** 🔴 **${overdueList.length}**\n`;
      answer += `* **Approaching Deadline (<= 7 days):** ⚠️ **${warningList.length}**\n\n`;

      if (overdueList.length > 0) {
        answer += `**High Priority Overdue Attention List:**\n`;
        overdueList.slice(0, 4).forEach(c => {
          answer += `* \`${c.case_id}\` (${c.category?.replace(/_/g, ' ') || 'General'}) — **${c.daysOverdue} days overdue**\n`;
        });
      } else {
        answer += `✅ *Excellent! There are no overdue cases pending in your active jurisdiction.*`;
      }

      return {
        answer,
        suggestions: overdueList.length > 0
          ? [`Track ${overdueList[0].case_id}`, 'Check Match Intelligence', 'Show Bureau Workload']
          : ['Check Match Intelligence', 'Show Bureau Workload'],
        intent: 'OFFICER_OVERDUE_SUMMARY'
      };
    } catch (err) {
      console.error('[ChatbotService] Overdue summary error:', err);
      return {
        answer: 'Failed to retrieve SLA summary. Please check your network connection.',
        suggestions: ['Show Bureau Workload'],
        intent: 'ERROR'
      };
    }
  }

  /**
   * Officer: Match Alerts & Cross-Bureau Overlap Summary
   */
  async handleOfficerMatchAlertsSummary(user) {
    try {
      const alerts = await matchAlertRepository.findAll({ status: 'PENDING_REVIEW' });

      let answer = `### ⚡ Cross-Bureau Case Intelligence & Match Alerts\n\n`;
      answer += `* **Pending Human Review Queue:** **${alerts.length} potential overlaps**\n\n`;

      if (alerts.length > 0) {
        answer += `**Latest Cross-Bureau Findings:**\n`;
        alerts.slice(0, 3).forEach(a => {
          const confPercent = Math.round((a.confidence_score || 0) * 100);
          answer += `* **${confPercent}% Match:** Source \`${a.source_case_id || 'Case A'}\` (${a.source_bureau || 'Bureau 1'}) ⟷ Candidate \`${a.candidate_case_id || 'Case B'}\` (${a.candidate_bureau || 'Bureau 2'})\n`;
          answer += `  *Classification:* \`${a.relationship_classification || 'POSSIBLE_RELATED'}\`\n`;
        });
        answer += `\n*Note: samadhanXX guarantees zero auto-closure. Each match requires authorized officer review before non-destructive linking.*`;
      } else {
        answer += `✅ *No unreviewed cross-bureau conflicts detected in the current queue.*`;
      }

      return {
        answer,
        suggestions: ['Show Overdue Cases', 'Show Bureau Workload', 'Track CMP-2026-PGRC-0010'],
        intent: 'OFFICER_MATCH_ALERTS'
      };
    } catch (err) {
      console.error('[ChatbotService] Match alerts error:', err);
      return {
        answer: 'Failed to retrieve match intelligence.',
        suggestions: ['Show Overdue Cases'],
        intent: 'ERROR'
      };
    }
  }

  /**
   * Officer: Bureau Workload Distribution
   */
  async handleOfficerWorkloadSummary(user) {
    try {
      const complaints = await complaintRepository.findAll();

      const counts = {
        REGULATION_BUREAU: 0,
        PGRC: 0,
        APPROVAL_BUREAU: 0,
        OTHER: 0
      };

      let activeCount = 0;
      complaints.forEach(c => {
        if (c.status !== 'DISPOSED') {
          activeCount++;
          if (counts[c.bureau] !== undefined) counts[c.bureau]++;
          else counts.OTHER++;
        }
      });

      let answer = `### 📊 AICTE Active Workload Distribution\n\n`;
      answer += `* **Total Active Cases Across Bureaus:** **${activeCount}**\n\n`;
      answer += `* **Regulation Bureau (RB):** ${counts.REGULATION_BUREAU} active cases\n`;
      answer += `* **Public Grievance Redressal (PGRC):** ${counts.PGRC} active cases\n`;
      answer += `* **Approval Bureau (APP):** ${counts.APPROVAL_BUREAU} active cases\n\n`;
      answer += `*All statistics are synchronized in real-time with the core operations database.*`;

      return {
        answer,
        suggestions: ['Show Overdue Cases', 'Check Match Intelligence'],
        intent: 'OFFICER_WORKLOAD'
      };
    } catch (err) {
      console.error('[ChatbotService] Workload summary error:', err);
      return {
        answer: 'Failed to retrieve workload statistics.',
        suggestions: ['Show Overdue Cases'],
        intent: 'ERROR'
      };
    }
  }

  /**
   * AICTE Knowledge: Fee Refund Policy
   */
  handleFeeRefundPolicy() {
    const answer = `### 💰 AICTE Fee Refund Directives (Approval Process Handbook Norms)

According to AICTE statutory guidelines, technical institutions are bound by strict fee refund regulations:

1. **Withdrawal Before Specified Cut-Off Date:**
   * The entire fee collected from the student, after a deduction of the processing fee of not more than **₹1,000/- (Rupees One Thousand only)**, shall be refunded by the Institution.
2. **Withdrawal After Cut-Off Date (Seat Vacated is Filled):**
   * If the vacated seat is subsequently filled by another candidate by the last date of admission, the institution must refund the collected fee minus proportionate tuition fee and hostel fee.
3. **Strict Bar on Document Withholding:**
   * Institutions are **strictly forbidden** from retaining original school/college leaving certificates, mark sheets, or demanding fees for future semesters as a condition of release.

**Competent Redressal Cell:** AICTE **Public Grievance Redressal Cell (PGRC)**.`;

    return {
      answer,
      suggestions: ['How to file a refund complaint?', 'Track CMP-2026-PGRC-0010', 'Anti-Ragging Rules'],
      intent: 'POLICY_FEE_REFUND'
    };
  }

  /**
   * AICTE Knowledge: Anti-Ragging Protocols
   */
  handleAntiRaggingGuidance() {
    const answer = `### 🛡️ AICTE Zero Tolerance Anti-Ragging Policy

AICTE maintains a strict **Zero-Tolerance Policy** against any form of ragging or harassment in approved institutions:

* **24x7 National Anti-Ragging Helpline (Toll-Free):** \`1800-180-5522\`
* **Helpline Email:** \`helpline@antiragging.in\`
* **Institutional Mandate:** Every approved institution MUST constitute an active **Anti-Ragging Committee (ARC)** and **Anti-Ragging Squad (ARS)**.
* **Statutory Action:** Violations result in immediate FIR lodgement, suspension of institutional approval, and debarment of perpetrators.`;

    return {
      answer,
      suggestions: ['How to file a complaint?', 'Fee Refund Rules', 'Certificate Retention Norms'],
      intent: 'POLICY_ANTI_RAGGING'
    };
  }

  /**
   * AICTE Knowledge: Faculty Salary Norms
   */
  handleFacultySalaryPolicy() {
    const answer = `### 👨‍🏫 AICTE Faculty Remuneration & 7th CPC Guidelines

* **Mandatory Pay Scales:** Technical colleges are statutorily required to disburse faculty salaries in accordance with the **7th Central Pay Commission (CPC)** recommendations.
* **Timely Disbursement:** Salaries must be credited electronically into faculty bank accounts without unauthorized deductions or delays.
* **Regulatory Consequences:** Non-compliance, non-disbursement of provident fund, or irregular compensation invites show-cause notices from the **AICTE Regulation Bureau**, potential reduction of student intake, or withdrawal of approval.`;

    return {
      answer,
      suggestions: ['Track CMP-2026-PGRC-0012', 'How to file a complaint?', 'Show Bureau Workload'],
      intent: 'POLICY_FACULTY_SALARY'
    };
  }

  /**
   * AICTE Knowledge: Original Certificate Retention
   */
  handleCertificateRetentionPolicy() {
    const answer = `### 📜 Prohibition on Retention of Original Educational Certificates

* **AICTE Regulation:** Technical institutions are **strictly prohibited** from retaining original personal or educational certificates (e.g., 10th/12th mark sheets, migration certificates, degrees) during or upon termination of admission.
* Institutions may only conduct physical verification of originals and return them immediately, keeping self-attested photocopies.
* Refusal to return documents upon student withdrawal is treated as serious misconduct punishable under AICTE penal provisions.`;

    return {
      answer,
      suggestions: ['How to file a complaint?', 'Fee Refund Rules', 'Track CMP-2026-RB-0021'],
      intent: 'POLICY_CERTIFICATE_RETENTION'
    };
  }

  /**
   * AICTE Knowledge: Approval Verification
   */
  handleApprovalVerificationGuidance() {
    const answer = `### 🏫 AICTE Institutional Approval & Legitimacy Check

* Before taking admission, students and parents must verify that the technical institution holds valid AICTE approval for the current academic year.
* Each approved campus possesses a unique **AICTE Permanent ID** (e.g., \`1-109283741\`).
* You can verify approval status through the official AICTE portal at \`aicte-india.org\` under the **Approved Institutes** directory.`;

    return {
      answer,
      suggestions: ['Fee Refund Rules', 'How to file a complaint?', 'Anti-Ragging Rules'],
      intent: 'POLICY_APPROVAL_VERIFICATION'
    };
  }

  /**
   * AICTE Knowledge: How to File a Grievance
   */
  handleFilingProcedureGuidance(isOfficer) {
    const answer = `### 📝 How to File a Grievance on AICTE samadhanX

1. **Step 1 — Identify the Issue:** Ensure your grievance relates to an AICTE-approved technical institution (e.g., Capitation Fee, Refund, Ragging, Inadequate Labs, Faculty Grievance).
2. **Step 2 — Gather Evidence:** Keep receipts, fee receipts, registration letters, or emails ready in PDF format.
3. **Step 3 — Submit Details:** Provide the Institution Name or **AICTE Permanent ID**, accurate subject, and brief factual description.
4. **Step 4 — Track Progress:** You will receive a unique Case Reference (e.g., \`CMP-2026-PGRC-0010\`) to monitor resolution timeline directly in this portal!`;

    return {
      answer,
      suggestions: isOfficer
        ? ['Show Overdue Cases', 'Check Match Intelligence']
        : ['Track CMP-2026-PGRC-0010', 'Fee Refund Rules', 'Anti-Ragging Rules'],
      intent: 'PROCEDURE_FILING'
    };
  }

  /**
   * About & Introduction
   */
  handleIntroduction(isOfficer, user) {
    if (isOfficer) {
      return {
        answer: `Namaste, **${user?.full_name || 'Officer'}**! 🛡️\n\nI am your **samadhanXX Copilot**. I am connected to the live case database and can assist you with:\n* 🔍 **Instant Case Dossier Lookup:** Enter any Case ID (e.g. \`CMP-2026-RB-0021\`).\n* 🚨 **Overdue SLA Scans:** Ask *"Show overdue cases"* to prioritize pending investigations.\n* ⚡ **Cross-Bureau Intelligence:** Ask *"Check match alerts"* to view detected institutional overlaps.\n* 📊 **Workload Analytics:** Ask *"Show workload statistics"* across AICTE cells.`,
        suggestions: ['Show Overdue Cases', 'Check Match Intelligence', 'Track CMP-2026-PGRC-0010', 'Show Bureau Workload'],
        intent: 'OFFICER_GREETING'
      };
    }

    return {
      answer: `Namaste! 🙏 Welcome to **AICTE samadhanX Sahayak**.\n\nI am here to help students, parents, faculty, and citizens navigate AICTE grievance resolution. You can ask me:\n* 🔍 **Track a Case:** Type your Case ID (e.g. \`CMP-2026-PGRC-0010\`).\n* 💰 **Fee Refund Norms:** Understand cut-off dates and deduction limits.\n* 🛡️ **Anti-Ragging Support:** Helplines and disciplinary protocols.\n* 📜 **Certificate Withholding:** AICTE rules preventing document retention.\n* 📝 **Filing Guidance:** Step-by-step assistance in lodging a grievance.`,
      suggestions: ['Track CMP-2026-PGRC-0010', 'Fee Refund Rules', 'Anti-Ragging Rules', 'How to File a Complaint?'],
      intent: 'CITIZEN_GREETING'
    };
  }

  /**
   * Helper: Match any keyword in query
   */
  matchesAny(text, keywords) {
    return keywords.some(k => text.includes(k));
  }

  /**
   * Default suggestions based on user context
   */
  getDefaultSuggestions(isOfficer) {
    if (isOfficer) {
      return [
        'Show Overdue Cases',
        'Check Match Intelligence',
        'Track CMP-2026-PGRC-0010',
        'Show Bureau Workload'
      ];
    }
    return [
      'Track CMP-2026-PGRC-0010',
      'AICTE Fee Refund Rules',
      'Anti-Ragging Guidelines',
      'How to File a Complaint?'
    ];
  }
}

module.exports = new ChatbotService();
