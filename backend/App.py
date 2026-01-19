from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from services.firebase_service import update_overdue_tasks

load_dotenv()

app = FastAPI()

# CORS for your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your route files (replace Flask Blueprints)
from routes.auth import router as auth_router
from routes.task import router as task_router
from routes.users import router as users_router
from routes.template import router as template_router
from routes.extraction import router as extraction_router


app.include_router(auth_router)
app.include_router(task_router)
app.include_router(users_router)
app.include_router(template_router)
app.include_router(extraction_router)

scheduler = BackgroundScheduler()


@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(
        update_overdue_tasks,
        "cron",
        hour=0,          # 12 AM
        minute=0
    )
    scheduler.start()
    print("📅 Overdue task scheduler started")

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()

@app.get("/")
async def home():
    return "FastAPI server running!"

@app.get("/health")
async def health():
    return {"status": "healthy"}
