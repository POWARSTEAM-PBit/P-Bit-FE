from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from db.init_engine import get_db, engine
from db import db_models
from pydantic import BaseModel, EmailStr

router: APIRouter = APIRouter(prefix="/user")
db_models.Base.metadata.create_all(bind=engine)

class user_login(BaseModel):
    uesr_id: str ##either email or username
    password: str
    user_type: str

@router.post("/login")
async def login(user: user_login, request: Request, db: Session = Depends(get_db)):
    
    users = db.query(db_models.student).all()
    return {"message": users}