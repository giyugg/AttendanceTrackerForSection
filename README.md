# Attendly

**Class attendance monitoring, from the student roster to the final report.**

Attendly is a web application for managing students, recording attendance by subject, and reviewing class participation in one workspace. It helps administrators and class officers keep attendance records organized and turn saved records into summaries and downloadable CSV reports.

The current application is built for **BSIS 2B-G2, Academic Year 2026–2027, 1st Semester**.

## What Attendly does

| Feature | What you can do |
| --- | --- |
| Class dashboard | See the active student count and the latest session's Present, Late, Absent, Excused, and Not Marked totals, along with attendance completion progress. |
| Student management | Maintain student numbers and names, add students, edit active students, activate or deactivate enrollments, and open individual attendance histories. |
| Subject management | Add subjects with codes and names, activate or deactivate them, and remove unused subjects. |
| Attendance sessions | Create a session for an active subject with a date and time, then record or update attendance for active students. |
| Attendance reports | Search recent session summaries by name and date, or filter a student's saved history by attendance status and date range. |
| CSV exports | Download filtered class session summaries and individual student attendance reports for use in a spreadsheet. |
| Account access | Request an administrator-created account, sign in with email and password, recover a forgotten password, and access features according to assigned permissions. |

The interface adapts to desktop and mobile screens, with shared navigation for the dashboard, students, attendance, and reports.

### Attendance statuses

Students can be marked **Present**, **Late**, **Absent**, or **Excused**. Students without a saved attendance record remain **Not Marked**; they are not automatically counted as absent. Changes are stored when you select **Save Attendance**.

Class reports cover the **50 most recent sessions**. Individual student reports show saved attendance history, including records retained after an enrollment is deactivated.

## Typical workflow

1. **Prepare the roster and subjects.** An administrator adds students, manages active enrollments, and registers subjects.
2. **Create a session.** An administrator, class president, or secretary selects the subject, date, and time.
3. **Record attendance.** Open the session, mark students, and select **Save Attendance**.
4. **Review participation.** Check the dashboard, browse session summaries, or open a student's attendance history.
5. **Export a report.** Apply the relevant filters and download the results as CSV.

## Roles and permissions

| Role | Management permissions |
| --- | --- |
| Application administrator | Create user accounts; manage students, enrollments, and subjects; create sessions; record attendance; and permanently delete students or sessions. |
| Class president or secretary | Create attendance sessions and record or update attendance for the assigned class. |

Other signed-in users can view records where permitted by the Supabase database policies. Creating an account does not automatically grant administrator or officer access; assignments are maintained in `app_admins` and `class_officers`.

Public account registration is disabled. Need an account? Email [2025009221@ms.bulsu.edu.ph](mailto:2025009221@ms.bulsu.edu.ph) from your educational email address. Personal email providers such as Gmail are not accepted.

Administrators listed in `app_admins` can open `/admin/accounts` to create an account with an educational email address and a temporary password of at least eight characters. Verify the requester's educational email ownership before creating the account: this operation marks the email as confirmed. It does not send a welcome or invitation email; share the temporary password privately. Administrator and class officer assignments must still be managed separately.

Permanent deletion requires typed confirmation. Subjects with existing attendance sessions must be deactivated rather than deleted to preserve their history.

## Future plans

The long-term goal is to expand Attendly from a single-class workspace into an attendance system for an entire college or university. The following improvements are planned for future development:

- **College and university support.** Support multiple departments, programs, year levels, sections, and subjects, with configurable academic years and terms instead of a fixed BSIS 2B-G2 workspace.
- **Reusable database functions.** Replace G2-specific functions such as `add_g2_student_parts` and `delete_g2_student`, along with hardcoded class lookups, with shared operations that use the relevant class and enrollment identifiers. This would allow the same attendance workflows to serve different sections.
- **Student view.** Give students a personal attendance overview where they can review their own records across subjects, see Present, Late, Absent, and Excused totals, and track their attendance over time. Access would be limited to their own records.
- **Teacher view.** Give teachers a workspace for their assigned subjects and sections, with tools to record attendance, review student participation, and access class reports. Teacher and student permissions would extend the current administrator, president, and secretary roles.

## Technology stack

| Layer | Technology |
| --- | --- |
| Application | Next.js App Router, React, and TypeScript |
| Data and authentication | Supabase PostgreSQL, Supabase Auth, and cookie-based sessions through `@supabase/ssr` |
| Styling | Tailwind CSS |
| UI components | shadcn/ui and Radix UI |
| Server operations | Next.js Server Components and Server Actions |

## Run locally

### Prerequisites

- Node.js **22 or later** and npm.
- Git.
- Access to a Supabase project configured with Attendly's database schema, functions, access policies, and class data.

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/giyugg/AttendanceTrackerForSection.git attendly
cd attendly
npm ci
```

### 2. Configure the Supabase backend

Use an existing Attendly backend or obtain its database setup from the project maintainer. **This repository currently does not include database migrations, seed scripts, or SQL function definitions.** Environment variables alone do not provision the backend.

The application expects these tables:

- `classes`, `students`, and `class_enrollments` for the class roster.
- `subjects`, `attendance_sessions`, and `attendance_records` for attendance tracking.
- `app_admins` and `class_officers` for permission assignments.

It also calls these database functions:

- `add_g2_student_parts`
- `delete_g2_student`
- `delete_g2_subject`
- `delete_g2_attendance_session`

The class data must match `BSIS 2B-G2`, academic year `2026-2027`, and term `1st Semester`. These values are currently specified in the application code.

In the hosted project's Supabase Auth general configuration, turn **Allow new users to sign up** **off**. This setting is required to prevent public account creation through Supabase's API as well as the application. Keep the **Email** provider enabled so existing and administrator-created accounts can sign in with email and password. See [Supabase's general configuration documentation](https://supabase.com/docs/guides/auth/general-configuration) and [password authentication documentation](https://supabase.com/docs/guides/auth/passwords).

The repository's `supabase/config.toml` sets `auth.enable_signup = false` for a local Supabase CLI instance. It does **not** change a hosted project's settings or provide the missing database schema. Restart an already running local instance after changing its configuration. See [Supabase's CLI configuration reference](https://supabase.com/docs/guides/local-development/cli/config).

Configure Supabase Auth's Site URL and allowed redirect URLs for your local or hosted address. Password recovery requests `/auth/update-password`. The retained `/auth/confirm` route handles email verification links containing `token_hash` and `type`, with an optional `next` destination. Email template configuration is managed in Supabase.

### 3. Add environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Use the project's public publishable key for the browser client. The service role key is required only by the server's administrator account creation operation; never prefix it with `NEXT_PUBLIC_`, expose it to browser code, or commit it. Add it to your hosting environment when deploying. Keep `.env.local` out of version control; it is already ignored by Git.

### 4. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and visit `/dashboard`. Management features become available according to the account's database role assignments.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Check the code with ESLint. |
| `npm test` | Check account creation authorization and validation without a live Supabase project. |
| `npm run build` | Create a production build. |
| `npm start` | Serve the production build after running `npm run build`. |

## Project structure

```text
app/
  admin/accounts/        Administrator-only account creation
  auth/                  Sign-in, account requests, confirmation, and password recovery
  dashboard/             Class overview and latest attendance statistics
  students/              Roster management and individual student reports
  attendance/            Session creation and attendance recording
    history/             Class reports and CSV exports
    subjects/            Subject management
components/              Shared navigation, authentication forms, and UI components
lib/supabase/            Browser, server, and session-refresh Supabase clients
proxy.ts                 Request handling for authentication and session refresh
```

## Credits

Designed and developed by **Kyle A. Acuña** for BSIS 2B-G2.
