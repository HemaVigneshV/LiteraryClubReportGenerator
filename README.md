# Literary Club Report Generator 📚

A comprehensive, full-stack web application designed for the Siddhartha Academy of Higher Education (SAHE) Literary Club. It empowers administrators and coordinators to seamlessly create, manage, collaborate on, and export beautifully formatted event reports.

## ✨ Features
- **Interactive Report Builder:** Dynamically build event reports with custom sections, photo galleries (circular & poster images), and dynamically generated winner tables.
- **DOCX / PDF Exporting:** Reports are natively exportable to perfectly formatted Microsoft Word (`.docx`) and PDF documents matching the standard SAHE collegiate format (Times New Roman, 1.5 line spacing).
- **Vercel & Supabase Ready:** Highly scalable infrastructure natively configured for Vercel deployment with a Supabase PostgreSQL and Storage backend. No local data bloat!
- **Shareable Links:** Collaborators can edit and finalize draft reports securely via uniquely generated 8-character invite codes without needing formal log-in credentials.
- **Document Uploads:** Skip the dynamic editor and attach raw `.docx` files natively.
- **Account Tiers:** Strict role-based access control (RBAC) separating features securely between `Admin` and standard `Coordinator` accounts.

## 🛠 Tech Stack
- **Frontend:** React, Vite, React Router DOM, Custom CSS (Aesthetic Glassmorphism & Modern Layouts)
- **Backend:** Node.js, Express.js
- **Database & Storage:** Supabase (PostgreSQL), Supabase Storage SDK
- **Document Generation:** `docx` (Node DOCX generation), `puppeteer` (Headless PDF rendering)
- **Authentication:** JWT (JSON Web Tokens), `bcryptjs`

## 🚀 Getting Started

### Prerequisites
1. Node.js (v18+)
2. NPM or Yarn
3. A Free [Supabase](https://supabase.com) Account.

### Environment Setup
Create a `.env` file in the `server` directory and add your Supabase credentials:
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret>
```

### Supabase Initialization
1. In your Supabase Dashboard SQL Editor, run the `supabase_schema.sql` found at the root of the repo to instantly structure your database tables.
2. In Supabase Storage, create a single **Public** bucket named `uploads`.

### Installation & Run
Because this repository operates using `concurrently`, running the application is heavily streamlined:

```bash
# Install dependencies in root, client, and server
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Run both the React Frontend and Express Backend concurrently
npm run dev
```

The React frontend will be available at `http://localhost:5173` and the Express API will run on `http://localhost:5000`.

## 🤝 Contribution
Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a pull request.
