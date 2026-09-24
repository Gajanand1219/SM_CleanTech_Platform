from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Domain, Problem, Question

router = APIRouter(prefix="/public", tags=["Public"])

@router.get("/domains")
def domains(db: Session = Depends(get_db)):
    return [{"id":d.id,"name":d.name,"description":d.description} for d in db.query(Domain).all()]

@router.get("/domains/{domain_id}/problems")
def problems(domain_id: int, db: Session = Depends(get_db)):
    return [{"id":p.id,"name":p.name,"sub_domain":p.sub_domain,"description":p.description} for p in db.query(Problem).filter(Problem.domain_id==domain_id).all()]

@router.get("/problems/{problem_id}/questions")
def questions(problem_id: int, db: Session = Depends(get_db)):
    return [{"id":q.id,"question_text":q.question_text,"field_key":q.field_key,"required":q.required} for q in db.query(Question).filter(Question.problem_id==problem_id).all()]
