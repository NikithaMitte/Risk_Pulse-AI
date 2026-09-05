# RISKPULSE AI — Real-Time Payment Risk Intelligence Platform

RISKPULSE AI is a company-level fintech payment risk intelligence and fraud prevention platform built with React, Vite, TypeScript, Tailwind CSS, FastAPI, and SQLite.

---

## 🔐 Production Authentication & Transactional Email Delivery

RISKPULSE AI implements a complete, production-grade authentication flow:
- **Registration** (`/register`) -> **Email Verification Link** -> **Account Activation** -> **Login** -> **Dashboard**
- **Forgot Password** (`/forgot-password`) -> **Cryptographic Reset Link** -> **Reset Password** -> **Login**

### Security Controls
- **Cryptographic Single-Use Tokens**: 15-minute expiration window.
- **SHA-256 Hashing**: Tokens and passwords are never stored in raw plaintext in the database.
- **Email Verification Enforcement**: Unverified accounts are strictly blocked from logging into the platform until email verification is completed.
- **Email Enumeration Protection**: Forgot password and resend requests return generic security notices.

---

## 📧 Email Provider Setup (Resend API)

RISKPULSE AI supports real email delivery via **Resend API** or a local **Development Mode** console fallback.

### Option A: Real Production Delivery via Resend
1. Create a free account at [https://resend.com](https://resend.com).
2. Generate an API Key (e.g., `re_123456789...`).
3. Set environment variables in `backend/.env`:
   ```ini
   EMAIL_MODE=production
   RESEND_API_KEY=re_123456789...
   EMAIL_FROM=onboarding@resend.dev
   FRONTEND_URL=http://localhost:3000
   ```
4. Restart the FastAPI backend. Real emails will now be sent directly to user inboxes.

### Option B: Development Email Mode (Default)
When `EMAIL_MODE=development` is set in `.env`:
- No external transactional mail service is required.
- Verification and password reset URLs are logged directly to the FastAPI terminal console.
- Interactive **"DEV MODE — Click to Complete Verification"** simulation links appear on the frontend for immediate testing during live demos.

---

## 🚀 Environment Variables (`backend/.env`)

```ini
DATABASE_URL=sqlite:///./riskpulse.db
JWT_SECRET=RISKPULSE_SECRET_KEY_SUPER_SECURE_HACKATHON_DEMO_2026
JWT_EXPIRATION_MINUTES=1440
EMAIL_MODE=development
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
```

---

## 🧪 Step-by-Step Hackathon Demo Test

1. **Start Backend**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --port 8000
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Register New Analyst**:
   - Navigate to `http://localhost:3000/register`.
   - Fill in Full Name, Work Email, Organization, Role, and Password.
   - Click **Create Account**.
4. **Email Verification**:
   - You will be redirected to `/verify-email`.
   - In Development Mode, click the yellow **"Click to Complete Verification"** button or check the backend terminal log.
   - In Production Mode, check your email inbox and click **Verify Email**.
5. **Sign In**:
   - Enter your email and password.
   - Access the **Risk Operations Center** dashboard and launch the **Live Transaction Streaming Engine**!

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React icons
- **Backend**: FastAPI, Python 3.13, PyJWT, Bcrypt, WebSockets, SQLAlchemy, SQLite
- **Email Engine**: Resend REST API client + Development Mode console fallback
