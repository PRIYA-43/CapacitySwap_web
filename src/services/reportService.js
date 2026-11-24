
import { auth, db } from "../firebase/firebase";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const REPORT_STATUSES = {
  pending: "Pending",
  "under review": "Under Review",
  under_review: "Under Review",
  resolved: "Resolved",
  rejected: "Rejected",
};

// ----------------------------------------
// NORMALIZE REPORT STATUS
// ----------------------------------------

function normalizeReportStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  return REPORT_STATUSES[normalized] || null;
}

// ----------------------------------------
// SUBMIT REPORT
// ----------------------------------------

export async function submitReport(reportData) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to submit a report.");
  }

  if (!reportData) {
    throw new Error("Report information is missing.");
  }

  const subject = String(reportData.subject || "").trim();
  const description = String(reportData.description || "").trim();

  if (!subject || !description) {
    throw new Error("Subject and description are required.");
  }

  if (!reportData.reporterRole) {
    throw new Error("Reporter role is required.");
  }

  if (subject.length > 150 || description.length > 3000) {
    throw new Error(
      "Subject must be 150 characters or fewer and description 3000 or fewer."
    );
  }

  const reportRef = doc(collection(db, "reports"));

  const report = {
    reportId: reportRef.id,
    reporterUid: currentUser.uid,

    reporterName:
      reportData.reporterName ||
      currentUser.displayName ||
      "",

    reporterEmail: currentUser.email || "",

    reporterRole: reportData.reporterRole,

    reportType:
      reportData.reportType || "General complaint",

    category:
      reportData.category ||
      reportData.reportType ||
      "General issue",

    targetType: reportData.targetType || "General",

    targetId: reportData.targetId || null,

    targetMachineId: reportData.targetMachineId || null,

    subject,
    description,

    targetUid: reportData.targetUid || null,

    targetCompanyId: reportData.targetCompanyId || null,

    bookingId: reportData.bookingId || null,

    rfqId: reportData.rfqId || null,

    status: "Pending",

    adminNotes: "",

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),
  };

  await setDoc(reportRef, report);

  return reportRef.id;
}

// ----------------------------------------
// SUBSCRIBE TO USER REPORTS
// ----------------------------------------

export function subscribeToReports(onData, onError) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to view reports.");
  }

  const reportsQuery = query(
    collection(db, "reports"),
    where("reporterUid", "==", currentUser.uid)
  );

  return onSnapshot(
    reportsQuery,
    (snapshot) => {
      const reports = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      onData(reports);
    },
    (error) => {
      console.error("Error subscribing to user reports:", error);

      if (onError) {
        onError(error);
      }
    }
  );
}

// ----------------------------------------
// SUBSCRIBE TO ALL REPORTS (ADMIN)
// ----------------------------------------

export function subscribeToAllReports(onData, onError) {
  return onSnapshot(
    collection(db, "reports"),
    (snapshot) => {
      const reports = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      onData(reports);
    },
    (error) => {
      console.error("Error subscribing to all reports:", error);

      if (onError) {
        onError(error);
      }
    }
  );
}

// ----------------------------------------
// GET ALL REPORTS
// ----------------------------------------

export async function getAllReports() {
  const snapshot = await getDocs(
    collection(db, "reports")
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// ----------------------------------------
// UPDATE REPORT STATUS (ADMIN)
// ----------------------------------------

export async function updateReportStatus(
  reportId,
  status,
  adminNotes = ""
) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in.");
  }

  if (!reportId) {
    throw new Error("Report ID is missing.");
  }

  const validStatus = normalizeReportStatus(status);

  if (!validStatus) {
    throw new Error(
      "Select a valid report status: Pending, Under Review, Resolved, or Rejected."
    );
  }

  const notes = String(adminNotes || "").trim().slice(0, 3000);

  const reportRef = doc(db, "reports", reportId);

  // ----------------------------------------
  // STEP 1: VERIFY REPORT
  // ----------------------------------------

  const reportSnapshot = await getDoc(reportRef);

  if (!reportSnapshot.exists()) {
    throw new Error("The selected report does not exist.");
  }

  const existingReport = reportSnapshot.data();

  if (!existingReport.reporterUid) {
    throw new Error(
      "The report does not contain the original reporter UID."
    );
  }

  // ----------------------------------------
  // STEP 2: UPDATE REPORT
  // ----------------------------------------

  await updateDoc(reportRef, {
    status: validStatus,
    adminNotes: notes,
    updatedAt: serverTimestamp(),
  });

  console.log("Report status successfully updated:", validStatus);

  // ----------------------------------------
  // STEP 3: CREATE NOTIFICATION
  // ----------------------------------------

  let notificationCreated = false;
  let notificationErrorMessage = null;
  let notificationId = null;

  try {
    const reporterRole = String(
      existingReport.reporterRole || ""
    ).trim().toLowerCase();

    const reportLink =
      reporterRole === "provider"
        ? "/provider/reports"
        : "/seeker/reports";

    const notificationData = {
      recipientUid: existingReport.reporterUid,

      type: "report_status_updated",

      title: "Report status updated",

      message: notes
        ? `Your report "${existingReport.subject || reportId}" is now ${validStatus}. Admin response: ${notes}`
        : `Your report "${existingReport.subject || reportId}" is now ${validStatus}.`,

      reportId: reportId,

      status: validStatus,

      link: reportLink,

      read: false,

      createdAt: serverTimestamp(),
    };

    // IMPORTANT:
    // addDoc generates a NEW notification document ID.
    // This avoids attempting to update an existing notification
    // when the same report status is saved more than once.

    const notificationRef = await addDoc(
      collection(db, "notifications"),
      notificationData
    );

    notificationId = notificationRef.id;

    notificationCreated = true;

    console.log(
      "Report notification successfully created:",
      notificationId
    );

  } catch (error) {
    notificationErrorMessage = error.message;

    console.error(
      "Report status saved, but notification could not be created:",
      error.code,
      error.message
    );
  }

  // ----------------------------------------
  // STEP 4: RETURN RESULT
  // ----------------------------------------

  return {
    success: true,

    reportId,

    status: validStatus,

    adminNotes: notes,

    notificationCreated,

    notificationId,

    notificationError: notificationErrorMessage,
  };
}
