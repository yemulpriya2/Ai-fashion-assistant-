# FASHIORA — AI Fashion Stylist Website
### Sarhad College of Arts, Commerce and Science | BBA(CA) 2025-26
**Team:** Priya Satish Yemul (233034) & Shrutika Venkatesh Yemul (233033)

---

## Project Structure

```
fashiora/
├── fashiora/                  # Django project config
│   ├── settings.py
│   └── urls.py
├── fashiora_app/              # Main app
│   ├── models.py              # DB models (StyleSession, UserProfile)
│   ├── views.py               # API logic + Claude integration
│   └── urls.py
├── templates/
│   └── index.html             # Main HTML page
├── static/
│   ├── css/style.css          # Luxury dark-gold styling
│   └── js/main.js             # Frontend logic + AI calls
├── requirements.txt
└── README.md
```

---

## Setup Instructions

### 1. Install Python & Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up MySQL Database
```sql
CREATE DATABASE fashiora_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Update `fashiora/settings.py` with your MySQL password.

### 3. Set Your Anthropic API Key
```bash
# Windows
set ANTHROPIC_API_KEY=your-api-key-here

# Mac/Linux
export ANTHROPIC_API_KEY=your-api-key-here
```

### 4. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Admin User (Optional)
```bash
python manage.py createsuperuser
```

### 6. Run Development Server
```bash
python manage.py runserver
```

### 7. Open in Browser
Visit: **http://127.0.0.1:8000**

---

## Features
- 📸 **Photo Upload** — Drag & drop or click to upload
- 🎨 **AI Skin Tone Analysis** — Detects undertone (warm/cool/neutral/olive)
- 👗 **Outfit Recommendations** — 3 complete outfits per session
- 🎨 **Color Palette** — 6 flattering colors + 2 to avoid
- ✨ **Style Tips** — 4 personalized tips
- 👤 **User Auth** — Register/Login to save history
- 💾 **MySQL Storage** — All sessions saved to database

## Occasions Covered
Casual, Office/Work, Party/Night Out, Wedding/Formal, Date Night, Festival, Sports, Beach

## Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Python 3.x, Django 4.2
- **Database:** MySQL
- **AI:** Anthropic Claude API (Vision + Language)
- **Typography:** Cormorant Garamond + Montserrat

---
*Academic Project — BBA(CA) Department*
