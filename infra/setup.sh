#!/usr/bin/env bash
# ==============================================================================
# BrewSpace AI — Idempotent Google Cloud & Firebase Bootstrap Script
# ==============================================================================
# Usage:
#   PROJECT_ID=brewspace-ai-mvp-2026 REGION=asia-south1 bash infra/setup.sh
#
# Prerequisites:
#   - gcloud CLI authenticated (`gcloud auth login`)
#   - Billing account linked to PROJECT_ID (or pass BILLING_ACCOUNT_ID=XXXXXX-XXXXXX-XXXXXX)
#   - Node.js + npx available for Firebase CLI (`npx -y firebase-tools@latest login`)
# ==============================================================================

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-brewspace-ai-mvp-2026}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-brewspace-web}"
REPO_NAME="${REPO_NAME:-brewspace-repo}"
RUN_SA_NAME="brewspace-run-sa"
BUILD_SA_NAME="brewspace-build-sa"
RUN_SA_EMAIL="${RUN_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
BUILD_SA_EMAIL="${BUILD_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
BUDGET_AMOUNT_USD="5"

run_cmd() {
  local comment="$1"
  shift
  echo ""
  echo "# ${comment}"
  echo "+ $*"
  "$@"
}

echo "=============================================================================="
echo "BrewSpace AI Bootstrap | Project: ${PROJECT_ID} | Region: ${REGION}"
echo "Hard Monthly Budget Cap: \$${BUDGET_AMOUNT_USD} USD (alerts at 50%, 90%, 100%)"
echo "=============================================================================="

# 1. Create project if it does not already exist
if ! gcloud projects describe "${PROJECT_ID}" --quiet >/dev/null 2>&1; then
  run_cmd "Create GCP project ${PROJECT_ID}" \
    gcloud projects create "${PROJECT_ID}" --name="BrewSpace AI" --quiet
else
  echo "# Project ${PROJECT_ID} already exists — skipping creation."
fi

# 2. Set active gcloud project and default Cloud Run region
run_cmd "Set default gcloud project to ${PROJECT_ID}" \
  gcloud config set project "${PROJECT_ID}" --quiet

run_cmd "Set default Cloud Run region to ${REGION}" \
  gcloud config set run/region "${REGION}" --quiet

# 3. Verify or link billing account and discover BILLING_ACCOUNT_ID automatically
if [[ -n "${BILLING_ACCOUNT_ID:-}" ]]; then
  run_cmd "Link billing account ${BILLING_ACCOUNT_ID} to project ${PROJECT_ID}" \
    gcloud billing projects link "${PROJECT_ID}" \
      --billing-account="${BILLING_ACCOUNT_ID}" --quiet
fi

echo ""
echo "# Look up linked billing account for ${PROJECT_ID}"
DISCOVERED_BILLING_NAME="$(gcloud billing projects describe "${PROJECT_ID}" --format='value(billingAccountName)' --quiet || true)"
BILLING_ACCOUNT_ID="${DISCOVERED_BILLING_NAME#billingAccounts/}"

if [[ -z "${BILLING_ACCOUNT_ID}" ]]; then
  echo "ERROR: No billing account is linked to ${PROJECT_ID}."
  echo "Link a billing account in Google Cloud Console or re-run with BILLING_ACCOUNT_ID=XXXXXX-XXXXXX-XXXXXX."
  exit 1
fi
echo "# Discovered linked billing account: ${BILLING_ACCOUNT_ID}"

# 4. Enable required Google Cloud & Firebase APIs
run_cmd "Enable required APIs (Cloud Run, Cloud Build, Artifact Registry, Firestore, Gemini platform, Secret Manager, Budgets, Firebase, Auth, Observability)" \
  gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    firestore.googleapis.com \
    aiplatform.googleapis.com \
    secretmanager.googleapis.com \
    billingbudgets.googleapis.com \
    firebase.googleapis.com \
    identitytoolkit.googleapis.com \
    logging.googleapis.com \
    monitoring.googleapis.com \
    --project="${PROJECT_ID}" --quiet

# 5. Create dedicated least-privilege service accounts (never use default Compute SA or Owner)
if ! gcloud iam service-accounts describe "${RUN_SA_EMAIL}" --project="${PROJECT_ID}" --quiet >/dev/null 2>&1; then
  run_cmd "Create dedicated Cloud Run runtime service account" \
    gcloud iam service-accounts create "${RUN_SA_NAME}" \
      --display-name="BrewSpace Cloud Run Runtime SA" \
      --project="${PROJECT_ID}" --quiet
else
  echo "# Service account ${RUN_SA_EMAIL} already exists — skipping."
fi

if ! gcloud iam service-accounts describe "${BUILD_SA_EMAIL}" --project="${PROJECT_ID}" --quiet >/dev/null 2>&1; then
  run_cmd "Create dedicated Cloud Build CI/CD service account" \
    gcloud iam service-accounts create "${BUILD_SA_NAME}" \
      --display-name="BrewSpace Cloud Build SA" \
      --project="${PROJECT_ID}" --quiet
else
  echo "# Service account ${BUILD_SA_EMAIL} already exists — skipping."
fi

# 6. Bind least-privilege IAM roles to Cloud Run runtime SA
for ROLE in \
  "roles/datastore.user" \
  "roles/aiplatform.user" \
  "roles/secretmanager.secretAccessor" \
  "roles/logging.logWriter" \
  "roles/firebaseauth.admin"; do
  run_cmd "Grant ${ROLE} to ${RUN_SA_EMAIL}" \
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="serviceAccount:${RUN_SA_EMAIL}" \
      --role="${ROLE}" \
      --condition=None \
      --quiet
done

# 7. Bind least-privilege IAM roles to Cloud Build SA
for ROLE in \
  "roles/run.admin" \
  "roles/run.builder" \
  "roles/artifactregistry.writer" \
  "roles/storage.objectViewer" \
  "roles/logging.logWriter"; do
  run_cmd "Grant ${ROLE} to ${BUILD_SA_EMAIL}" \
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="serviceAccount:${BUILD_SA_EMAIL}" \
      --role="${ROLE}" \
      --condition=None \
      --quiet
done

run_cmd "Allow Cloud Build SA to act as Cloud Run runtime SA only" \
  gcloud iam service-accounts add-iam-policy-binding "${RUN_SA_EMAIL}" \
    --member="serviceAccount:${BUILD_SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser" \
    --project="${PROJECT_ID}" --quiet

# 8. Create Artifact Registry Docker repository with image cleanup policy (free tier: 0.5 GB)
if ! gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" --project="${PROJECT_ID}" --quiet >/dev/null 2>&1; then
  run_cmd "Create Artifact Registry Docker repository ${REPO_NAME} in ${REGION}" \
    gcloud artifacts repositories create "${REPO_NAME}" \
      --repository-format=docker \
      --location="${REGION}" \
      --description="BrewSpace AI container images" \
      --project="${PROJECT_ID}" --quiet
else
  echo "# Artifact Registry repository ${REPO_NAME} already exists — skipping."
fi

CLEANUP_POLICY_FILE="$(mktemp)"
cat > "${CLEANUP_POLICY_FILE}" <<'EOF'
[
  {
    "name": "keep-recent-3",
    "action": { "type": "Keep" },
    "mostRecentVersions": { "keepCount": 3 }
  },
  {
    "name": "delete-old-untagged",
    "action": { "type": "Delete" },
    "condition": { "tagState": "ANY", "olderThan": "604800s" }
  }
]
EOF

run_cmd "Apply Artifact Registry cleanup policy to stay within 0.5 GB free tier" \
  gcloud artifacts repositories set-cleanup-policies "${REPO_NAME}" \
    --location="${REGION}" \
    --policy="${CLEANUP_POLICY_FILE}" \
    --project="${PROJECT_ID}" --quiet
rm -f "${CLEANUP_POLICY_FILE}"

# 9. Provision Cloud Firestore (default database in Native mode, free tier eligible)
if ! gcloud firestore databases describe --database="(default)" --project="${PROJECT_ID}" --quiet >/dev/null 2>&1; then
  run_cmd "Create Cloud Firestore default database in ${REGION} (Native mode)" \
    gcloud firestore databases create \
      --database="(default)" \
      --location="${REGION}" \
      --type=firestore-native \
      --project="${PROJECT_ID}" --quiet
else
  echo "# Firestore (default) database already exists — skipping."
fi

# 10. Create Secret Manager secret for staff/demo bootstrap key (no secrets in code)
SECRET_NAME="brewspace-demo-admin-secret"
if ! gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" --quiet >/dev/null 2>&1; then
  run_cmd "Create Secret Manager secret ${SECRET_NAME}" \
    gcloud secrets create "${SECRET_NAME}" \
      --replication-policy="automatic" \
      --project="${PROJECT_ID}" --quiet

  GENERATED_SECRET="$(openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  echo "# Add initial secret version to ${SECRET_NAME}"
  printf '%s' "${GENERATED_SECRET}" | gcloud secrets versions add "${SECRET_NAME}" \
    --data-file=- --project="${PROJECT_ID}" --quiet
else
  echo "# Secret ${SECRET_NAME} already exists — skipping."
fi

# 11. Create $5/month Billing Budget Alert at 50%, 90%, and 100%
EXISTING_BUDGET="$(gcloud billing budgets list --billing-account="${BILLING_ACCOUNT_ID}" --filter="displayName:BrewSpace Monthly Cap" --format="value(name)" --limit=1 --quiet || true)"
if [[ -z "${EXISTING_BUDGET}" ]]; then
  run_cmd "Create \$${BUDGET_AMOUNT_USD} USD monthly budget alert at 50%, 90%, and 100%" \
    gcloud billing budgets create \
      --billing-account="${BILLING_ACCOUNT_ID}" \
      --display-name="BrewSpace Monthly Cap (\$${BUDGET_AMOUNT_USD})" \
      --budget-amount="${BUDGET_AMOUNT_USD}USD" \
      --filter-projects="projects/${PROJECT_ID}" \
      --threshold-rule=percent=0.5 \
      --threshold-rule=percent=0.9 \
      --threshold-rule=percent=1.0 \
      --quiet
else
  echo "# Budget alert already exists (${EXISTING_BUDGET}) — skipping."
fi

# 12. Add Firebase to the GCP project and deploy Firestore rules & indexes
if command -v npx >/dev/null 2>&1; then
  run_cmd "Attach Firebase to GCP project ${PROJECT_ID} (idempotent)" \
    bash -c "npx -y firebase-tools@latest projects:addfirebase '${PROJECT_ID}' || true"

  run_cmd "Deploy Firestore security rules and composite indexes" \
    npx -y firebase-tools@latest deploy --only firestore --project "${PROJECT_ID}"
else
  echo "# npx not found — skipping Firebase CLI step. Run manually:"
  echo "#   npx -y firebase-tools@latest projects:addfirebase ${PROJECT_ID}"
  echo "#   npx -y firebase-tools@latest deploy --only firestore --project ${PROJECT_ID}"
fi

echo ""
echo "=============================================================================="
echo "Bootstrap complete for ${PROJECT_ID} (${REGION})."
echo "Next steps:"
echo "  1. Enable Anonymous & Email/Password providers in Firebase Authentication."
echo "  2. Create a Firebase Web App: npx -y firebase-tools@latest apps:create WEB brewspace-web --project ${PROJECT_ID}"
echo "  3. Fetch web SDK config: npx -y firebase-tools@latest apps:sdkconfig WEB --project ${PROJECT_ID}"
echo "=============================================================================="
