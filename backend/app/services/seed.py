from app.models import Domain, Problem, Question, User, Role, AccountStatus
from app.core.security import hash_password
from app.core.config import settings

DOMAIN_DATA = {
    "Water & Wastewater Treatment": [
        ("ETP", "High-toxicity industrial effluent", ["What is the current wastewater flow in KLD?", "What are the latest COD and BOD values?", "What is the current ETP capacity?", "What treatment technology is currently installed?"]),
        ("ZLD", "Zero-liquid-discharge requirement", ["What is the target recovery percentage?", "What is the current TDS range?", "Is MEE/crystallizer infrastructure already available?"]),
        ("RO / Membranes", "High-salinity RO feed", ["What is feed TDS?", "What is required permeate capacity?", "What membrane technology is currently used?"]),
        ("Biological Treatment", "High BOD suspended organic loading", ["What is average flow?", "What is inlet BOD?", "What biological process is currently used?"]),
    ],
    "Solid & Hazardous Waste": [
        ("Recovery", "Material recovery and segregation", ["What waste types are generated?", "What is daily waste volume?", "Is source segregation available?"]),
        ("Thermal Recovery", "Thermal treatment / waste-to-energy", ["What is the calorific value range?", "What is daily feed quantity?", "What emission-control system is available?"]),
        ("Recycling & Compliance", "E-waste / battery / polymer recycling", ["What material categories are handled?", "What is monthly volume?", "What compliance approvals are already available?"]),
    ],
    "Solar & Renewables": [
        ("Industrial Solar", "Underutilized rooftop / open-access opportunity", ["What is connected electrical load?", "What is monthly electricity consumption?", "What roof or land area is available?"]),
        ("Energy Efficiency", "Thermal utility de-optimization", ["What is current steam/thermal demand?", "What fuel is currently used?", "What are annual fuel costs?"]),
        ("Fleet Decarbonization", "Alternative fuel / fleet transition", ["How many vehicles are in the fleet?", "What is monthly fuel consumption?", "What is the typical daily route distance?"]),
    ],
    "Carbon & ESG": [
        ("Scope 1", "Direct operational carbon footprint", ["What fuels are consumed on site?", "What is annual fuel consumption?", "Are process emissions measured?"]),
        ("Scope 2", "Indirect energy emissions", ["What is annual grid electricity consumption?", "What renewable electricity is already contracted?"]),
        ("Scope 3", "Supply-chain emissions", ["Which upstream categories are material?", "What supplier activity data is available?", "What logistics data is available?"]),
        ("ESG Reporting", "Disclosure and framework readiness", ["Which reporting framework is required?", "What ESG data is currently collected?", "What reporting deadline applies?"]),
    ],
    "SPCB Consents & Air Pollution": [
        ("Air Pollution Control", "Industrial stack / process emission control", ["What are the stack sources?", "What pollutants are monitored?", "What control equipment is currently installed?"]),
        ("SPCB Consents", "Consent / authorization documentation", ["Which consent or approval is required?", "What is the current consent status?", "Are any renewal milestones pending?"]),
        ("Environmental Legal", "Compliance / litigation support", ["What notice or order was received?", "What compliance evidence is available?", "What is the response deadline?"]),
        ("Factory Safety & Audit", "Site compliance and safety audit", ["What audit scope is required?", "What previous audit findings remain open?"]),
    ],
}

def seed_database(db):
    if not db.query(Domain).count():
        for domain_name, problems in DOMAIN_DATA.items():
            domain = Domain(name=domain_name, description=f"Industrial solutions under {domain_name}.")
            db.add(domain)
            db.flush()
            for sub_domain, problem_name, questions in problems:
                p = Problem(domain_id=domain.id, sub_domain=sub_domain, name=problem_name, description=f"Diagnostic workflow for {problem_name}.")
                db.add(p)
                db.flush()
                for idx, q in enumerate(questions, 1):
                    db.add(Question(problem_id=p.id, question_text=q, field_key=f"q{idx}", required=True))
        db.commit()
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        admin = User(full_name="Platform Admin", email=settings.ADMIN_EMAIL, phone="0000000000", password_hash=hash_password(settings.ADMIN_PASSWORD), role=Role.ADMIN.value, status=AccountStatus.ACTIVE.value, email_verified=True, is_active=True)
        db.add(admin)
        db.commit()
