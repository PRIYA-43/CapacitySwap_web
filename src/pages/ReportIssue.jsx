
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FileWarning } from "lucide-react";

import { submitReport } from "../services/reportService";
import { subscribeToSeekerBookings } from "../services/bookingService";

function ReportIssue() {
  const outlet = useOutletContext();

  const profile =
    outlet?.profile ||
    outlet?.userProfile ||
    {};

  // Use the active workspace instead of checking capabilities.
  // A user may have both provider and seeker capabilities.
  const activeWorkspace =
    outlet?.activeWorkspace ||
    outlet?.workspace ||
    profile.defaultWorkspace ||
    "seeker";

  const role =
    String(activeWorkspace).toLowerCase() === "provider"
      ? "Provider"
      : "Seeker";

  const initialForm = {
    category: "General platform issue",
    targetType: "General",
    subject: "",
    description: "",
    targetId: "",
    bookingId: "",
  };

  const [form, setForm] = useState(initialForm);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bookings, setBookings] = useState([]);

  // =====================================
  // LOAD SEEKER BOOKINGS
  // =====================================

  useEffect(() => {
    if (role !== "Seeker") {
      setBookings([]);
      return undefined;
    }

    try {
      return subscribeToSeekerBookings(
        setBookings,
        (loadError) => {
          console.error(
            "Unable to load seeker bookings:",
            loadError
          );

          setError(
            loadError.message ||
              "Unable to load your bookings."
          );
        }
      );
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError.message ||
          "Unable to load bookings."
      );

      return undefined;
    }
  }, [role]);

  // =====================================
  // FORM UPDATE
  // =====================================

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // =====================================
  // SUBMIT REPORT
  // =====================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    try {
      setSubmitting(true);

      const reportId = await submitReport({
        subject: form.subject,
        description: form.description,

        category: form.category,
        reportType: form.category,

        targetType: form.targetType,

        targetId:
          form.targetId.trim() || null,

        bookingId:
          form.bookingId || null,

        targetMachineId:
          form.targetType === "Machine"
            ? form.targetId.trim() || null
            : null,

        targetUid:
          form.targetType === "User"
            ? form.targetId.trim() || null
            : null,

        targetCompanyId:
          form.targetType === "Company"
            ? form.targetId.trim() || null
            : null,

        reporterRole: role,

        reporterName:
          profile.fullName ||
          profile.name ||
          "",
      });

      console.log(
        "Report successfully submitted:",
        reportId
      );

      setSuccess(
        `Your report has been submitted successfully. Reference ID: ${reportId}`
      );

      setForm(initialForm);

    } catch (submitError) {
      console.error(
        "Report submission error:",
        submitError
      );

      setError(
        submitError.message ||
          "Unable to submit your report. Please try again."
      );

    } finally {
      setSubmitting(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div className="seeker-page">

      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">
            TRUST & SAFETY
          </span>

          <h1>Report an issue</h1>

          <p>
            Send a complaint or marketplace feedback
            to the CapacitySwap admin team.
          </p>
        </div>
      </div>

      <section
        className="provider-panel"
        style={{ maxWidth: 760 }}
      >

        {success && (
          <p
            className="seeker-success-message"
            role="status"
          >
            <FileWarning size={16} />
            {success}
          </p>
        )}

        {error && (
          <p
            className="field-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="seeker-filter-grid"
          style={{
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
          }}
        >

          <label>
            <span>Category</span>

            <select
              value={form.category}
              onChange={(event) =>
                update("category", event.target.value)
              }
            >
              <option>General platform issue</option>
              <option>Machine issue</option>
              <option>Provider complaint</option>
              <option>Seeker complaint</option>
              <option>Company issue</option>
              <option>Booking problem</option>
              <option>Quotation issue</option>
              <option>Job/tracking issue</option>
              <option>Payment issue</option>
              <option>Inappropriate behavior</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            <span>Target type</span>

            <select
              value={form.targetType}
              onChange={(event) =>
                update("targetType", event.target.value)
              }
            >
              <option>General</option>
              <option>Machine</option>
              <option>Company</option>
              <option>User</option>
              <option>Booking</option>
              <option>Quotation</option>
            </select>
          </label>

          {form.targetType !== "General" && (
            <label>
              <span>Target ID</span>

              <input
                value={form.targetId}
                maxLength={100}
                onChange={(event) =>
                  update("targetId", event.target.value)
                }
                placeholder="Optional ID"
              />
            </label>
          )}

          {role === "Seeker" && (
            <label>
              <span>Related booking</span>

              <select
                value={form.bookingId}
                onChange={(event) =>
                  update("bookingId", event.target.value)
                }
              >
                <option value="">None</option>

                {bookings.map((booking) => (
                  <option
                    key={booking.id}
                    value={booking.bookingId || booking.id}
                  >
                    {booking.bookingId || booking.id}
                    {" — "}
                    {booking.machineName || "Machine"}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label
            style={{ gridColumn: "1 / -1" }}
          >
            <span>Subject</span>

            <input
              value={form.subject}
              maxLength={150}
              onChange={(event) =>
                update("subject", event.target.value)
              }
              placeholder="Brief summary"
              required
            />
          </label>

          <label
            style={{ gridColumn: "1 / -1" }}
          >
            <span>Detailed description</span>

            <textarea
              value={form.description}
              maxLength={3000}
              rows={7}
              onChange={(event) =>
                update("description", event.target.value)
              }
              placeholder="Describe what happened"
              required
            />

            <small>
              {form.description.length}/3000
            </small>
          </label>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{
              gridColumn: "1 / -1",
              justifySelf: "start",
            }}
          >
            {submitting
              ? "Submitting..."
              : "Submit report"}
          </button>

        </form>
      </section>
    </div>
  );
}

export default ReportIssue;
