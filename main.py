from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from backend.database import init_db
from backend.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up application...")
    init_db()
    print("Database initialized")
    yield
    print("Shutting down application...")

app = FastAPI(title="Multi-Agent Chat API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    if os.path.exists("dist/index.html"):
        return FileResponse("dist/index.html")
    return {"message": "Multi-Agent Chat API", "docs": "/docs"}

if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
