# CapacitySwap

CapacitySwap is a React and Vite application for sharing manufacturing capacity and managing RFQs and provider quotations.

## Run locally

```bash
npm install
npm run dev
```

Set the `VITE_FIREBASE_*` environment values for the Firebase project before running the application.

## Main workflows

- Seekers browse machines and create RFQs for a selected provider's machine.
- Providers accept or reject incoming RFQs; only accepted RFQs can receive a quotation.
- Seekers review, compare, accept, or reject quotations.
- Accepting one quotation records a single winner and marks other submitted offers `not_selected`.
- Providers can mark machines available or unavailable. Unavailable machines are hidden from browse and cannot receive new RFQs; older machine records without an availability status are treated as available.
- RFQ and quotation lists update from Firestore listeners.
- RFQ and quotation PDFs are generated in the browser.
- Administrators need the Firebase Authentication `admin` custom claim to open the administration workspace.

## Firestore deployment

Deploy the repository rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The rules restrict RFQ and quotation reads to their participants and allow admin read access only to accounts with the `admin` custom claim. Admin account, company-verification, and machine-review updates are restricted to their respective status fields.

New RFQs start with `pending`; provider decisions are stored in `providerDecision`, `providerDecisionAt`, `providerDecisionBy`, `providerRemarks`, and `rejectionReason`. Seeker quotation decisions are stored in `seekerDecision`, `seekerDecisionAt`, `seekerDecisionBy`, and `rejectionReason`; the selected quotation ID is recorded on the RFQ as `acceptedQuotationId`.

New machine listings include their provider display name and company name, which are copied to RFQs, and start with a `Pending Review` status and `availabilityStatus: available`. Availability changes record `availabilityUpdatedAt` and `availabilityUpdatedBy`. Existing machine listings without provider display fields should be edited by their owner to refresh them before seekers can submit an RFQ. Existing RFQs and quotations are not modified or deleted.

Booking, job-progress, and notification screens currently show empty states; those workflows do not have Firestore collections in this project.
