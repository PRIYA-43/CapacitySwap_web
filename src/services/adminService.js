
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Firestore collections used by the admin dashboard
const COLLECTIONS = [
  'users',
  'companies',
  'machines',
  'rfqs',
  'quotations',
  'bookings',
  'jobTracking',
  'notifications',
  'reports',
];

export const EMPTY_ADMIN_DATA = {
  users: [],
  companies: [],
  machines: [],
  rfqs: [],
  quotations: [],
  bookings: [],
  jobs: [],
  reports: [],
  notifications: [],
  activity: [],
};

// ----------------------------------------
// Helpers
// ----------------------------------------

function documentRows(snapshot) {
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

function toDate(value) {
  if (!value) return null;

  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function displayDate(value) {
  const date = toDate(value);

  if (!date) return '';

  return date.toLocaleDateString('en-IN');
}

function getTimestamp(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

function normalizeStatus(value) {
  if (!value) return '';

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMilestoneRows(milestones) {
  if (!milestones) return [];

  if (Array.isArray(milestones)) {
    return milestones.map((milestone, index) => ({
      id: milestone.id || milestone.key || `milestone-${index}`,
      name:
        milestone.name ||
        milestone.milestone ||
        milestone.id ||
        milestone.key ||
        `Milestone ${index + 1}`,
      status: milestone.status || 'pending',
      note: milestone.note || '',
      timestamp: milestone.timestamp || null,
      date: displayDate(milestone.timestamp),
    }));
  }

  if (typeof milestones === 'object') {
    return Object.entries(milestones).map(([key, milestone]) => ({
      id: key,
      name: normalizeStatus(key),
      status: milestone?.status || 'pending',
      note: milestone?.note || '',
      timestamp: milestone?.timestamp || null,
      date: displayDate(milestone?.timestamp),
    }));
  }

  return [];
}

// ----------------------------------------
// Build admin dashboard data
// ----------------------------------------

function buildAdminData(raw) {
  const companiesById = new Map(
    raw.companies.map((company) => [company.id, company])
  );

  const machinesById = new Map(
    raw.machines.map((machine) => [machine.id, machine])
  );

  // USERS
  const users = raw.users.map((user) => {
    const workspace = user.defaultWorkspace || '';

    return {
      ...user,
      name: user.fullName || user.name || '',
      company:
        companiesById.get(user.companyId)?.companyName || '',
      role: workspace
        ? workspace.charAt(0).toUpperCase() + workspace.slice(1)
        : 'Account',
      status:
        ({
          active: 'Active',
          suspended: 'Suspended',
          'under review': 'Under Review',
          under_review: 'Under Review',
        })[String(user.status || '').toLowerCase()] ||
        user.status ||
        'Active',
      registered: displayDate(user.createdAt),
      activity: [],
    };
  });

  // COMPANIES
  const companies = raw.companies.map((company) => {
    const owner = raw.users.find(
      (user) => user.uid === company.ownerUid
    );

    return {
      ...company,
      name: company.companyName || '',
      email: company.businessEmail || owner?.email || '',
      registered: displayDate(company.createdAt),
      status:
        ({
          pending: 'Pending Verification',
          verified: 'Verified',
          rejected: 'Rejected',
          information_requested: 'Information Requested',
        })[
          String(company.verificationStatus || '').toLowerCase()
        ] ||
        company.verificationStatus ||
        'Pending Verification',
      city: company.address || '',
      role: owner?.defaultWorkspace || '',
      gstin: company.gstin || company.GSTIN || 'Not provided',
      phone: company.phone || 'Not provided',
      businessType: company.businessType || 'Not provided',
      description: company.description || 'Not provided',
      documents: company.documents || [],
    };
  });

  // MACHINES
  const machines = raw.machines.map((machine) => ({
    ...machine,
    provider: machine.providerCompanyName || machine.providerName || '',
    submitted: displayDate(machine.createdAt),
    status: machine.reviewStatus || 'Pending Review',
    category: machine.category || '',
  }));

  // RFQS
  const rfqs = raw.rfqs.map((rfq) => ({
    ...rfq,
    buyer: rfq.seekerCompanyName || rfq.seekerName || '',
    category: rfq.machineCategory || '',
    submitted: displayDate(rfq.createdAt),
    deadline: rfq.completionDate || rfq.deliveryDate || '',
    requirement: rfq.description || '',
    quotes: Array.isArray(rfq.quotationIds)
      ? rfq.quotationIds.length
      : 0,
    flagged: false,
    activity: [],
  }));

  // QUOTATIONS
  const quotations = raw.quotations.map((quotation) => ({
    ...quotation,
    provider:
      quotation.providerCompanyName ||
      quotation.providerName ||
      '',
    machine:
      quotation.machineName ||
      machinesById.get(quotation.machineId)?.name ||
      '',
    category: quotation.machineCategory || '',
    price: quotation.offeredPrice ?? quotation.price ?? null,
    date: displayDate(quotation.createdAt),
    validUntil: displayDate(quotation.validityDate),
  }));

  // BOOKINGS
  const bookings = raw.bookings.map((booking) => ({
    ...booking,
    bookingId: booking.bookingId || booking.id,
    rfqId: booking.rfqId || '',
    quotationId: booking.quotationId || '',
    rfqTitle: booking.rfqTitle || '',
    seeker: booking.seekerName || booking.seekerCompanyName || '',
    seekerName: booking.seekerName || '',
    seekerCompany: booking.seekerCompanyName || '',
    seekerUid: booking.seekerUid || '',
    seekerCompanyId: booking.seekerCompanyId || '',
    provider: booking.providerName || booking.providerCompanyName || '',
    providerName: booking.providerName || '',
    providerCompany: booking.providerCompanyName || '',
    providerCompanyId: booking.providerCompanyId || '',
    providerUid: booking.providerUid || '',
    machine: booking.machineName || '',
    machineName: booking.machineName || '',
    machineId: booking.machineId || '',
    category: booking.machineCategory || '',
    machineCategory: booking.machineCategory || '',
    capacity: booking.capacity ?? '',
    price: booking.offeredPrice ?? booking.price ?? null,
    offeredPrice: booking.offeredPrice ?? booking.price ?? null,
    priceUnit: booking.priceUnit || '',
    materialDetails: booking.materialDetails || '',
    deliveryDate: booking.deliveryDate || '',
    deliveryDays: booking.deliveryDays ?? '',
    estimatedDelivery: booking.estimatedDelivery || '',
    terms: booking.terms || '',
    remarks: booking.providerRemarks || '',
    status: normalizeStatus(booking.status || 'unknown'),
    created: displayDate(booking.createdAt),
    updated: displayDate(booking.updatedAt),
  }));

  // JOB TRACKING
  const jobs = raw.jobTracking.map((tracking) => {
    const milestones = getMilestoneRows(tracking.milestones);

    const completedMilestones = milestones.filter(
      (milestone) =>
        String(milestone.status).toLowerCase() === 'completed'
    ).length;

    return {
      ...tracking,
      trackingId: tracking.trackingId || tracking.id,
      bookingId: tracking.bookingId || '',
      quotationId: tracking.quotationId || '',
      rfqId: tracking.rfqId || '',
      machineId: tracking.machineId || '',
      machineName:
        tracking.machineName ||
        machinesById.get(tracking.machineId)?.name ||
        '',
      status: normalizeStatus(tracking.currentStatus || 'unknown'),
      currentStatus: tracking.currentStatus || '',
      completed: Boolean(tracking.completed),
      milestones,
      milestoneCount: milestones.length,
      completedMilestones,
      progress:
        milestones.length > 0
          ? Math.round(
              (completedMilestones / milestones.length) * 100
            )
          : 0,
      created: displayDate(tracking.createdAt),
      updated: displayDate(tracking.updatedAt),
    };
  });

  // REPORTS / COMPLAINTS
  const reports = raw.reports.map((report) => ({
    ...report,
    reportId: report.reportId || report.id,
    reporterUid: report.reporterUid || '',
    reporterName: report.reporterName || 'Unknown reporter',
    reporterEmail: report.reporterEmail || '',
    reporterRole: report.reporterRole || '',
    reportType: report.reportType || 'General complaint',
    subject: report.subject || '',
    description: report.description || '',
    targetUid: report.targetUid || '',
    targetCompanyId: report.targetCompanyId || '',
    bookingId: report.bookingId || '',
    rfqId: report.rfqId || '',
    status: normalizeStatus(report.status || 'pending'),
    adminNotes: report.adminNotes || '',
    created: displayDate(report.createdAt),
    updated: displayDate(report.updatedAt),
    timestamp: getTimestamp(report.createdAt),
  }));

  // NOTIFICATIONS
  const notifications = raw.notifications.map((notification) => ({
    ...notification,
    notificationId: notification.id,
    recipientUid: notification.recipientUid || '',
    bookingId: notification.bookingId || '',
    trackingId: notification.trackingId || '',
    rfqId: notification.rfqId || '',
    quotationId: notification.quotationId || '',
    title: notification.title || '',
    message: notification.message || '',
    type: notification.type || '',
    read: Boolean(notification.read),
    status: notification.read ? 'Read' : 'Unread',
    date: displayDate(notification.createdAt),
    timestamp: getTimestamp(notification.createdAt),
  }));

  // ADMIN ACTIVITY FEED
  const activity = [
    ...rfqs.map((rfq) => ({
      id: `rfq-${rfq.id}`,
      activity: 'RFQ submitted',
      actor: rfq.buyer || rfq.seekerName || '',
      type: 'RFQ',
      date: rfq.submitted,
      status: rfq.status || '',
      timestamp: getTimestamp(rfq.createdAt),
    })),

    ...quotations.map((quotation) => ({
      id: `quotation-${quotation.id}`,
      activity: 'Quotation submitted',
      actor: quotation.provider,
      type: 'Quotation',
      date: quotation.date,
      status: quotation.status || '',
      timestamp: getTimestamp(quotation.createdAt),
    })),

    ...machines.map((machine) => ({
      id: `machine-${machine.id}`,
      activity: 'Machine listed',
      actor: machine.provider,
      type: 'Machine listing',
      date: machine.submitted,
      status: machine.status,
      timestamp: getTimestamp(machine.createdAt),
    })),

    ...bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      activity: 'Booking created',
      actor: booking.seeker || booking.provider || '',
      type: 'Booking',
      date: booking.created,
      status: booking.status,
      timestamp: getTimestamp(booking.createdAt),
    })),

    ...jobs.map((job) => ({
      id: `job-${job.id}`,
      activity: 'Job tracking updated',
      actor: job.machineName || '',
      type: 'Job Tracking',
      date: job.updated || job.created,
      status: job.status,
      timestamp: getTimestamp(job.updatedAt || job.createdAt),
    })),

    ...notifications.map((notification) => ({
      id: `notification-${notification.id}`,
      activity: notification.title || 'Notification created',
      actor: notification.recipientUid || '',
      type: 'Notification',
      date: notification.date,
      status: notification.status,
      timestamp: notification.timestamp,
    })),

    ...reports.map((report) => ({
      id: `report-${report.id}`,
      activity: 'Report submitted',
      actor: report.reporterName,
      type: 'Report / Complaint',
      date: report.created,
      status: report.status,
      timestamp: report.timestamp,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return {
    users,
    companies,
    machines,
    rfqs,
    quotations,
    bookings,
    jobs,
    reports,
    notifications,
    activity,
  };
}

// ----------------------------------------
// Admin status update functions
// ----------------------------------------

export function updateUserStatus(userId, status) {
  const value = status.toLowerCase().replace(/ /g, '_');

  return updateDoc(doc(db, 'users', userId), {
    status: value,
    updatedAt: serverTimestamp(),
  });
}

export function updateCompanyVerificationStatus(companyId, status) {
  const value = status.toLowerCase().replace(/ /g, '_');

  return updateDoc(doc(db, 'companies', companyId), {
    verificationStatus: value,
    updatedAt: serverTimestamp(),
  });
}

export function updateMachineReviewStatus(machineId, status) {
  return updateDoc(doc(db, 'machines', machineId), {
    reviewStatus: status,
    updatedAt: serverTimestamp(),
  });
}

// Update report status and admin notes
export function updateReportStatus(reportId, status, adminNotes = '') {
  const value = status.toLowerCase().replace(/ /g, '_');

  return updateDoc(doc(db, 'reports', reportId), {
    status: value,
    adminNotes,
    updatedAt: serverTimestamp(),
  });
}

// ----------------------------------------
// Subscribe to all admin data
// ----------------------------------------

export function subscribeToAdminData(onData, onError) {
  const raw = Object.fromEntries(
    COLLECTIONS.map((collectionName) => [
      collectionName,
      [],
    ])
  );

  const ready = new Set();
  const unsubscribers = [];
  let stopped = false;

  const stop = () => {
    if (stopped) return;

    stopped = true;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };

  try {
    COLLECTIONS.forEach((collectionName) => {
      const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          if (stopped) return;

          raw[collectionName] = documentRows(snapshot);
          ready.add(collectionName);

          if (ready.size === COLLECTIONS.length) {
            onData(buildAdminData(raw));
          }
        },
        (error) => {
          if (stopped) return;

          stop();
          onError(error);
        }
      );

      unsubscribers.push(unsubscribe);
    });
  } catch (error) {
    stop();
    throw error;
  }

  return stop;
}
