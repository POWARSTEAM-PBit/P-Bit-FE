from fastapi import APIRouter

router: APIRouter = APIRouter(prefix="/user")

@router.get("/login")
def login():
    return {"message": "Logging in"}