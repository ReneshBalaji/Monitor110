from fastapi import FastAPI
from app.api.signals import router as signals_router

app = FastAPI(title="Modern Monitor 110 – Reddit Signal Engine")

app.include_router(signals_router)

@app.get("/")
def root():
    return {"status": "Monitor 110 Reddit Engine Running"}
