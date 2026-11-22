# BrewSpace AI — Deployment & Operations Runbook

## 1. Architecture & FinOps Summary (Serverless, Scale-to-Zero)

| Component | Google Cloud Service | Configuration | Cost Profile |
| :--- | :--- | :--- | :--- |
| Web App + API | Cloud Run (`asia-south1`) | 1 container, `--min-instances=0`, `--max-instances=2`, 512Mi RAM, 1 vCPU | Scales to zero (free-tier eligible) |
| Database & Realtime | Cloud Firestore (`asia-south1`) | Native mode, transactional writes, least-privilege `firestore.rules` | Free-tier eligible |
| AI Orchestration | Gemini API (`aiplatform.googleapis.com`) | `@google/genai`, `gemini-3.5-flash-lite`, `GOOGLE_CLOUD_LOCATION=global` | Pay-per-token (Flash-Lite tier) |
| Auth | Firebase Authentication | Anonymous guest sessions + Email/Password with custom claims (`staff` / `demo_admin`) | Free-tier eligible |
| Container Registry | Artifact Registry (`asia-south1`) | Cleanup policy keeps latest 3 images (<0.5 GB free tier) | Free-tier eligible |
| Secrets | Secret Manager | `brewspace-demo-admin-secret` (1 active version) | Free-tier eligible |
| Billing Guardrail | Cloud Billing Budgets | Configurable monthly cap (`BUDGET_AMOUNT_USD`) with alerts at **50%**, **90%**, **100%** | Included |

---

## 2. Bootstrap Infrastructure (One-Time, Idempotent)

Run from **Google Cloud Shell** or any terminal with `gcloud` and `npx` authenticated:

```bash
# Authenticate gcloud & Firebase CLI
gcloud auth login
npx -y firebase-tools@latest login

# Run idempotent bootstrap (auto-discovers linked billing account)
PROJECT_ID=brewspace-ai-mvp-2026 REGION=asia-south1 bash infra/setup.sh
```

---

## 3. Build & Deploy to Cloud Run via Cloud Build

```bash
gcloud builds submit \
  --project=brewspace-ai-mvp-2026 \
  --config=cloudbuild.yaml \
  --service-account=projects/brewspace-ai-mvp-2026/serviceAccounts/brewspace-build-sa@brewspace-ai-mvp-2026.iam.gserviceaccount.com \
  --substitutions=_REGION=asia-south1,_REPO=brewspace-repo,_SERVICE=brewspace-web,SHORT_SHA=$(git rev-parse --short HEAD || echo v1)
```

---

## 4. Seed Staff / Demo Admin Custom Claims (Optional Firebase Auth)

```bash
GOOGLE_CLOUD_PROJECT=brewspace-ai-mvp-2026 node scripts/seed-staff-claims.mjs staff@roastery.example staff
GOOGLE_CLOUD_PROJECT=brewspace-ai-mvp-2026 node scripts/seed-staff-claims.mjs demo@roastery.example demo_admin
```

---

## 5. Local Development & Demo Walkthrough

> Requires **Node.js >= 18.17** (Node 20 LTS or 22 LTS recommended; Cloud Run container uses `node:22-alpine`).

```bash
cp .env.example .env.local
npm install
npm test
npm run dev
```

1. **Guest Hero Journey:** Open `http://localhost:3000/c/roastery-co` → enter alias → type *"I want a quiet table with an outlet for 60 minutes, then meet people interested in AI startups"* → review & edit → independently opt into Connect & Circles → confirm seat `Q3` in **My Space** → verify Connect is suppressed while `FOCUSING` → tap **Finish focus** → join `AI Builders & Startup Ideas` in **Circles** (reaches quorum of 3 and holds `G1`).
2. **Staff & Demo Simulator (Journey D):** Open `http://localhost:3000/staff/login`, select `Demo Administrator`, enter `local-dev-only-change-me` (from `.env.example`), and trigger **Circle Table Conflict** or mark `G1` occupied in `/staff/roastery-co` to watch the circle relocate automatically to `G2`.
