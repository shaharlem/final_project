# Citizen Request Management System

A system for managing citizen requests to the municipality. Citizens submit requests through a web form or a Telegram bot, requests are automatically categorized using AI, and the municipal team handles them through a dashboard and responds via Outlook.

---

## 👥 Work Split

| Area | Owner |
|------|-------|
| Citizen form (public platform) | **Shahar** |
| Telegram bot | **Shahar** |
| Automatic categorization (OpenAI) | **Shahar** |
| UX/UI of the public platform | **Shahar** |
| Team dashboard | **Haim** |
| Outlook API integration | **Haim** |
| UX/UI of the dashboard | **Haim** |

**Branches:**
- `platform` — Shahar
- `dashboard` — Haim
- `main` — merged code, what goes live in Production. **Never commit directly to it.**

**Golden rule:** before changing a shared file (`server.js`, the Supabase connection, this file) — talk to your partner first.

---

## 🔗 Shared Accounts & Services

| Service | Link | Role |
|---------|------|------|
| GitHub repo | `shaharlem/final_project` | Shared code |
| Supabase | (project URL in dashboard) | Database |
| Railway | (project URL in Railway) | Cloud hosting |

**Environment variables (`.env` — never committed to GitHub):**

| Variable | Shared / Private | Owner |
|----------|-------------------|-------|
| `SUPABASE_URL`, `SUPABASE_KEY` | Shared by both | Both |
| `OPENAI_API_KEY` | Private | Shahar |
| `TELEGRAM_BOT_TOKEN` | Private | Shahar |
| Outlook / Microsoft Graph credentials | Private | Haim |

> Share keys with each other via private message (WhatsApp/email) — **never** through Git or code.

---

## 🗄️ Database Schema (the binding contract)

This is the critical part: both sides **read and write** to the same tables. Any change to column names, allowed values, or tables must be agreed on by both of you and updated here.

### Table `requests`

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial / uuid | Primary key |
| `citizen_name` | text | Full name of the citizen |
| `citizen_email` | text | |
| `citizen_phone` | text | |
| `category` | text | See closed category list below |
| `message` | text | 20–20,000 characters |
| `file_path` | text \| null | Path to file in Supabase Storage (not the file itself) |
| `status` | text | See closed status list below |
| `ai_confidence` | float | 0.0–1.0, confidence score of the categorization |
| `assigned_to` | text | Name/email of the responsible team member |
| `source` | text | `'form'` or `'telegram'` |
| `created_at` | timestamptz | |
| `sent_at` | timestamptz \| null | |
| `response_received_at` | timestamptz \| null | |
| `closed_at` | timestamptz \| null | |

### Table `responses`

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial | |
| `request_id` | int | Foreign key to `requests.id` |
| `response_text` | text | |
| `from_email` | text | |
| `received_at` | timestamptz | |

### Table `reminders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial | |
| `request_id` | int | Foreign key to `requests.id` |
| `reminder_day` | int | 5 or 10 |
| `sent_at` | timestamptz | |

---

## 🏷️ Closed Category List (`category`)

Important: use these values **exactly**, since they are shared between the categorization step (OpenAI) and the dashboard filters.

```
parking_fines
property_tax
appointment_requests
city_cleaning
events
road_safety
other
```

| Category | Responsible person |
|----------|---------------------|
| Parking / bus fines | Natalie Zaken |
| Property tax | Moshe Touito |
| Appointment requests | Meir Nakash |
| City cleaning | Gil Gorni |
| Events | Yehuda Naftali |
| Road safety | Tzvi Dekel / Smadar Erlich |
| Other | *(to be decided — see note below)* |

---

## 🔄 Closed Status List (`status`)

Use these values **exactly**, lowercase:

```
new                 — request received, not yet sent
sent                — email sent to the responsible person
waiting_response    — waiting for a reply from the responsible person
responded           — reply received, pending review/sending to citizen
closed              — request closed, citizen received a final answer
```

**Valid status flow:**

```
new → sent → waiting_response → responded → closed
```

---

## ⚠️ Red Flags (manual review)

| Case | Condition | Action |
|------|-----------|--------|
| Low categorization confidence | `ai_confidence < 0.80` | Flagged in dashboard, team picks category manually |
| Unauthorized file type | not jpg/png/pdf/docx, or over 10MB | Blocked at form/bot level |
| Message out of range | under 20 or over 20,000 characters | Blocked at form/bot level |
| No response after 5 days | `status = waiting_response` for 5+ days | Automatic reminder to responsible person |
| No response after 10 days | `status = waiting_response` for 10+ days | Escalation to supervisor + flag in dashboard |

---

## 🌐 Project Languages

- **Platform UI (form + dashboard):** English
- **Emails and citizen correspondence:** Hebrew

---

## ✅ Definition of Done — before merging to `main`

- [ ] Code tested locally and working
- [ ] No secrets/keys committed (`.env` excluded)
- [ ] If column names / categories / statuses changed — this file was updated accordingly
- [ ] Partner was notified and reviewed the Pull Request

---

*This file is the project's shared "contract" — any change to the data model, categories, or statuses starts here, not in the code.*
