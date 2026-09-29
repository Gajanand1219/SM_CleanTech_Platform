
# 🌱 SM CleanTech Engineering Solutions

## Industrial B2B CleanTech Networking & Vendor Matching Platform

SM CleanTech Engineering Solutions is a B2B platform designed to connect industrial buyers with relevant CleanTech, engineering, EPC, environmental and compliance vendors.

The platform allows buyers to submit structured technical requirements and automatically matches them with verified vendors based on their registered CleanTech domains.
# SM CleanTech Platform

## 🚀 Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload


cd frontend
npm install
npm run dev
