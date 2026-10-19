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
| Student | Access the Student dashboard, currently under construction. Class rosters, other students' records, attendance tools, and account management are unavailable. |

Administrators can open `/admin/users` (**Accounts & Permissions**) to see user accounts and their current roles, then assign **Administrator**, **President**, **Secretary**, or **Student**. Administrator access is global; officer roles apply to the current BSIS 2B-G2 class. Admins cannot change their own role; another administrator must do that. New accounts default to Student, represented by the absence of administrator or current-class officer membership. Assignments remain in `app_admins` and `class_officers`, not user-editable Auth metadata.

Use **Edit name** in the account list to set or correct a user's **First name**, optional **Middle initial**, and **Last name**, including your own. These are stored separately in `profiles.first_name`, `profiles.middle_initial`, and `profiles.last_name`; the displayed name is assembled as `First M. Last`. It appears in the account list and above the signed-in user's role in the desktop sidebar and mobile menu. Existing unsplit names remain visible until their parts are entered; accounts without a saved name show their email address. Name changes do not change role permissions, and editing your own name does not require another administrator.

After signing in, `/dashboard` sends users to the appropriate workspace. Administrators keep the class dashboard. Presidents and Secretaries land on `/officer`, which is under construction and links to their existing attendance, roster, and report tools. Students land on `/student`, which is under construction. Protected pages check permissions on the server before fetching class records, and navigation shows the links available to that role.

Public account registration is disabled. Need an account? Email [2025009221@ms.bulsu.edu.ph](mailto:2025009221@ms.bulsu.edu.ph) from your educational email address. Personal email providers such as Gmail are not accepted.

Administrators listed in `app_admins` can open `/admin/accounts` to create an account with separate first name, middle initial, and last name fields, an educational email address, and a temporary password of at least eight characters. Verify the requester's educational email ownership before creating the account: this operation marks the email as confirmed. It does not send a welcome or invitation email; share the temporary password privately. Change the new Student account's role in **Accounts & Permissions** when needed. If name saving fails after Auth creates the account, the form reports that the account exists and directs the administrator to **Edit name** without creating another account.

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

Use an existing Attendly backend or obtain its database setup from the project maintainer. **The base database schema, seed data, and attendance SQL function definitions are not included.** The role-permissions migration extends an existing Attendly database; environment variables and this migration do not provision the base schema.

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

`supabase/inspect-permissions.sql` is a read-only query of policies, grants, and function definitions, without account data or API keys. The existing backend was inspected during this change: its attendance RPCs run with caller permissions and check administrator access. Its tables already have the permissive administrator/officer policies that the migration narrows.

Apply `supabase/migrations/202610190001_manage_user_roles.sql` to the existing database using the Supabase SQL Editor before saving role changes. It adds the atomic `set_class_user_role` function, restricts direct role-table mutations, removes `TRUNCATE`/`REFERENCES`/`TRIGGER` grants from ordinary clients, and narrows roster/attendance access to administrators and assigned officers. Students stay limited to their placeholder until their personal attendance view is implemented. The migration preserves the existing permissive policies and narrows them with restrictive policies. This repository change does not apply itself to the hosted project; accounts and saved attendance are retained.

Apply `supabase/migrations/202610190002_profile_name_parts.sql` to enable separate profile name fields. First and last names accept 1–80 characters each; the optional middle initial is one letter, normalized to uppercase. The assembled name is limited to 120 characters. This migration retains existing names instead of guessing how to split them. `profiles.full_name` is maintained as a derived compatibility value for older Auth triggers; forms accept only the separate fields. Until the migration is applied, existing accounts continue displaying their legacy names and the directory explains that name editing needs the database update.

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

Use the project's public publishable key for the browser client. The server key is required for administrator account creation and the administrator-only account directory. A Supabase Secret key (`sb_secret_...`) can be used as the value of `SUPABASE_SERVICE_ROLE_KEY`, as can the legacy service role key. Never prefix it with `NEXT_PUBLIC_`, expose it to browser code, or commit it. Add it to your hosting environment when deploying. Keep `.env.local` out of version control; it is already ignored by Git. Role updates use the signed-in administrator's session so the database can verify the actor directly.

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
| `npm test` | Check account creation, role resolution, role changes, and permission guards without a live Supabase project. |
| `npm run build` | Create a production build. |
| `npm start` | Serve the production build after running `npm run build`. |

## Project structure

```text
app/
  admin/accounts/        Administrator-only account creation
  admin/users/           Account directory and role management
  auth/                  Sign-in, account requests, confirmation, and password recovery
  dashboard/             Class overview and latest attendance statistics
  officer/               President and Secretary dashboard placeholder
  student/               Student dashboard placeholder
  students/              Roster management and individual student reports
  attendance/            Session creation and attendance recording
    history/             Class reports and CSV exports
    subjects/            Subject management
components/              Shared navigation, authentication forms, and UI components
lib/supabase/            Browser, server, and session-refresh Supabase clients
lib/access.ts            Server-side authentication and role guards
lib/roles.ts             Shared role labels and dashboard destinations
supabase/                Role migration and read-only permission inspection
proxy.ts                 Request handling for authentication and session refresh
```

## Credits

Designed and developed by **Kyle A. Acuña** for BSIS 2B-G2.
