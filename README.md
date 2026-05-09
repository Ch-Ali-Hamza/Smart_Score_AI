<div align="center">

<img src="https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/89670d98-a6d1-4d98-8a57-78691837d640" alt="SmartScore AI Banner" width="100%" />

<br/>
<br/>

# 🎓 SmartScore AI

**AI-powered academic performance tracking & grade prediction platform**

*Built for students, teachers, and administrators at COMSATS University*

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-SmartScore%20AI-4F46E5?style=for-the-badge&logoColor=white)](https://smart-score-ai.ch5859555.workers.dev/)
&nbsp;
[![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
&nbsp;
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
&nbsp;
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

</div>

---

## 📸 Overview

SmartScore AI is a full-stack web application that helps educational institutions monitor student progress, predict final grades, identify at-risk students, and make data-driven academic decisions — all in one place.

> **Try it live →** [smart-score-ai.ch5859555.workers.dev](https://smart-score-ai.ch5859555.workers.dev/)

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### 👨‍🎓 Student Portal
- Personal dashboard with marks & attendance
- AI-predicted final grade with confidence score
- Subject-wise Pass / Borderline / Fail status
- Visual progress tracking over time
- Real-time notifications for alerts

</td>
<td width="33%" valign="top">

### 👩‍🏫 Teacher Portal
- Enter and manage marks by subject & exam
- Mark daily attendance per student
- Class-wide performance analytics
- Automatic weak student detection
- Generate & export class reports

</td>
<td width="33%" valign="top">

### 🛠️ Admin Portal
- System-wide user management
- Full audit log of all actions
- Data backup & export tools
- System configuration settings
- Role-based access control

</td>
</tr>
</table>

---

## 🧠 How Predictions Work

SmartScore AI predicts a student's final grade using three signals:

| Signal | Role |
|---|---|
| 📊 **Average marks** across all subjects | Primary factor |
| 🗓️ **Attendance rate** — penalty applied below 75% | Modifier |
| 🔮 **Confidence score** — scales with available data | Reliability indicator |

Per-subject predictions include **Pass / Borderline / Fail** status badges and a confidence percentage that improves automatically as more data is entered.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TanStack Router v1, TanStack Query v5 |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix UI primitives |
| **Backend / DB** | Supabase (PostgreSQL + Row-Level Security + Auth) |
| **Deployment** | Cloudflare Workers via `@cloudflare/vite-plugin` |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Build** | Vite 7 + TypeScript 5 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
git clone https://github.com/your-username/Smart_Score_AI.git
cd Smart_Score_AI
npm install
```

### Environment Setup

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
src/
├── routes/               # File-based routing (student, teacher, admin pages)
│   ├── student.*         # Student portal pages
│   ├── teacher.*         # Teacher portal pages
│   └── admin.*           # Admin portal pages
├── components/           # Shared UI components & app shell
│   └── ui/               # shadcn/ui primitives
├── integrations/
│   └── supabase/         # Supabase client, auth middleware & DB types
├── lib/                  # Auth helpers, DB queries, utilities
└── styles.css            # Global styles
```

---

## 🔐 Role-Based Access

| Role | Description |
|---|---|
| `student` | View own marks, attendance, predictions & progress |
| `teacher` | Enter marks & attendance, view class data, flag at-risk students |
| `admin` | Full access — manage users, view logs, backup, configure system |

Role-based routing is enforced on both the client and server via Supabase Auth middleware.

---

## 🌐 Live Demo

<div align="center">

### 👉 [Open SmartScore AI](https://smart-score-ai.ch5859555.workers.dev/)

*Deployed on Cloudflare Workers · Backed by Supabase*

</div>

---

## 📄 License

This project was built for academic purposes at COMSATS University. Feel free to fork and adapt it for your institution.

---

<div align="center">
<sub>Built with ❤️ using React, Supabase & Cloudflare · SmartScore AI v1.0</sub>
</div>
