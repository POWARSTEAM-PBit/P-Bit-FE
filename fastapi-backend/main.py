from fastapi import FastAPI
from constants import *

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": DB_HOSTNAME}

