from fastapi import FastAPI
import routes.user as user

app = FastAPI()

app.include_router(user.router)

@app.get("/")
def read_root():
    return {"message": "hello"}

