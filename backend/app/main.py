"""
Mini LMS FastAPI Application

Main entry point for the Learning Management System API.
Handles CORS, routing, and application lifecycle.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI): # pyright: ignore[reportUnusedParameter]
    """
    Application lifespan handler.
    
    Handles startup and shutdown events.
    Creates database tables if they don't exist.
    """
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Clean up resources if needed


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A Learning Management System API for managing students, classes, and subscriptions",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/", tags=["Health"])
async def root():
    """
    Root endpoint for health check.
    
    Returns API status and version information.
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns the application health status.
    """
    return {"status": "healthy"}


# TODO: Include routers
# from app.routers import auth, parents, students, classes, registrations, subscriptions
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
# app.include_router(parents.router, prefix="/api/v1/parents", tags=["Parents"])
# app.include_router(students.router, prefix="/api/v1/students", tags=["Students"])
# app.include_router(classes.router, prefix="/api/v1/classes", tags=["Classes"])
# app.include_router(registrations.router, prefix="/api/v1/registrations", tags=["Registrations"])
# app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
