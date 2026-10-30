const institutionRepository = require('../repositories/institutionRepository');
const complaintRepository = require('../repositories/complaintRepository');
const caseActionRepository = require('../repositories/caseActionRepository');
const config = require('../../config/env');
const { calculateExpectedDisposalDate } = require('../../services/workflowService');

const SYNTHETIC_INSTITUTIONS = [
  {
    id: 'inst-syn-001',
    aicte_permanent_id: '1-109283741',
    name: 'Apex Institute of Technology & Management',
    address: 'Knowledge Park III, Plot 42',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    region: 'NORTHERN',
    pin_code: '201306',
    approval_status: 'APPROVED',
    identity_flag: 'VERIFIED'
  },
  {
    id: 'inst-syn-002',
    aicte_permanent_id: '1-283910294',
    name: 'Metro College of Engineering & Research',
    address: 'Hinjawadi Phase 1, Survey No. 128',
    city: 'Pune',
    state: 'Maharashtra',
    region: 'WESTERN',
    pin_code: '411057',
    approval_status: 'APPROVED',
    identity_flag: 'VERIFIED'
  },
  {
    id: 'inst-syn-003',
    aicte_permanent_id: '1-384910295',
    name: 'National Academy of Applied Science & Technology',
    address: 'Electronic City Phase II, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    region: 'SOUTHERN',
    pin_code: '560100',
    approval_status: 'APPROVED',
    identity_flag: 'VERIFIED'
  },
  {
    id: 'inst-syn-004',
    aicte_permanent_id: '1-492019283',
    name: 'Kalinga Institute of Poly-Engineering',
    address: 'Chandrasekharpur Industrial Area',
    city: 'Bhubaneswar',
    state: 'Odisha',
    region: 'EASTERN',
    pin_code: '751024',
    approval_status: 'APPROVED',
    identity_flag: 'VERIFIED'
  },
  {
    id: 'inst-syn-005',
    aicte_permanent_id: null, // Test case: missing permanent ID flagged for review
    name: 'Vidya Jyoti Technical Campus (Unverified ID)',
    address: 'Bypass Road, Sector 8',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    region: 'CENTRAL',
    pin_code: '462001',
    approval_status: 'PROVISIONAL',
    identity_flag: 'MISSING_AICTE_ID'
  }
];

const SYNTHETIC_COMPLAINTS = [
  {
    id: 'cmp-syn-001',
    case_id: 'CMP-2026-PGRC-0010',
    institution_id: 'inst-syn-001',
    bureau: 'PGRC',
    category: 'CAPITATION_FEE',
    severity: 'HIGH',
    complainant_type: 'STUDENT',
    subject: 'Illegal capitation fee demanded for B.Tech CSE examination hall ticket',
    description: 'The administration of Apex Institute is unlawfully demanding Rs 25,000 extra fee under unapproved development charge before issuing examination hall ticket for 6th semester.',
    received_date: '2026-10-01',
    status: 'UNDER_PROCESS',
    assigned_officer_id: 'usr-pgrc-01',
    created_by: 'usr-pgrc-01',
    sla_days: 30
  },
  {
    id: 'cmp-syn-002',
    case_id: 'CMP-2026-RB-0021',
    institution_id: 'inst-syn-001',
    bureau: 'REGULATION_BUREAU',
    category: 'CAPITATION_FEE',
    severity: 'CRITICAL',
    complainant_type: 'PARENT',
    subject: 'Show-cause inquiry regarding unauthorized fee collection at Apex Institute',
    description: 'Complaint forwarded by Parent Association alleging mandatory donation collection of Rs 30,000 under penalty of withholding semester admit cards in Computer Science branch.',
    received_date: '2026-10-08',
    status: 'VALIDATION_ASSIGNMENT',
    assigned_officer_id: 'usr-rb-01',
    created_by: 'usr-rb-01',
    sla_days: 30
  },
  {
    id: 'cmp-syn-003',
    case_id: 'CMP-2026-PGRC-0012',
    institution_id: 'inst-syn-002',
    bureau: 'PGRC',
    category: 'FACULTY_GRIEVANCE',
    severity: 'HIGH',
    complainant_type: 'FACULTY',
    subject: 'Non-disbursement of 7th CPC salaries and 4 months delayed salary payment',
    description: 'Faculty members of Mechanical Department at Metro College have not received salary for June, July, August, and September 2026 despite multiple representations.',
    received_date: '2026-09-15',
    status: 'UNDER_PROCESS',
    assigned_officer_id: 'usr-pgrc-01',
    created_by: 'usr-pgrc-01',
    sla_days: 30
  },
  {
    id: 'cmp-syn-004',
    case_id: 'CMP-2026-RB-0025',
    institution_id: 'inst-syn-003',
    bureau: 'REGULATION_BUREAU',
    category: 'INFRASTRUCTURE_DEFICIT',
    severity: 'STANDARD',
    complainant_type: 'CITIZEN',
    subject: 'Deficit in artificial intelligence and robotics laboratory equipment',
    description: 'Public grievance petition regarding inadequate laboratory apparatus and non-functional high-performance computing facilities promised during approved intake expansion.',
    received_date: '2026-10-18',
    status: 'RECEIVED',
    assigned_officer_id: null,
    created_by: 'usr-rb-01',
    sla_days: 30
  }
];

async function seedInstitutionsAndComplaints() {
  if (config.env === 'production') {
    return false;
  }

  // 1. Seed Institutions
  for (const inst of SYNTHETIC_INSTITUTIONS) {
    const existing = await institutionRepository.findById(inst.id);
    if (!existing) {
      await institutionRepository.create(inst);
    }
  }

  // 2. Seed Complaints & Initial Timeline Actions
  for (const cmp of SYNTHETIC_COMPLAINTS) {
    const existing = await complaintRepository.findById(cmp.id);
    if (!existing) {
      const expected_disposal_date = calculateExpectedDisposalDate(cmp.received_date, cmp.sla_days || 30);
      const createdCmp = await complaintRepository.create({
        ...cmp,
        expected_disposal_date
      });

      // Seed Initial Case Action in Timeline
      await caseActionRepository.create({
        complaint_id: createdCmp.id,
        action_type: 'CASE_REGISTERED',
        previous_status: null,
        new_status: createdCmp.status,
        remarks: 'Case registered into samadhanX system and mapped to technical institution.',
        performed_by: cmp.created_by
      });

      if (createdCmp.status === 'UNDER_PROCESS') {
        await caseActionRepository.create({
          complaint_id: createdCmp.id,
          action_type: 'NOTICE_ISSUED',
          previous_status: 'RECEIVED',
          new_status: 'UNDER_PROCESS',
          remarks: 'Notice for clarification dispatched to college principal.',
          performed_by: cmp.created_by
        });
      }
    }
  }

  return true;
}

module.exports = {
  SYNTHETIC_INSTITUTIONS,
  SYNTHETIC_COMPLAINTS,
  seedInstitutionsAndComplaints
};
