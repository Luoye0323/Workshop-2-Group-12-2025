from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

# create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Models
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    company = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # relationship
    extractions = relationship("Extraction", back_populates="user")
    equipment = relationship("Equipment", back_populates="user")


class Extraction(Base):
    __tablename__ = "extractions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    status = Column(
        String, default="pending"
    )  # "pending", "processing", "complete", "error"
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    equipment_data = Column(JSON, nullable=True)  # stored extracted data as json
    excel_file = Column(String, nullable=True)
    pptx_file = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # relationships
    user = relationship("User", back_populates="extractions")


class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    tag = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)  
    fluid = Column(String, nullable=True)

    # material information
    material_type = Column(String, nullable=True)
    material_spec = Column(String, nullable=True)
    material_grade = Column(String, nullable=True)

    # design conditions
    design_pressure = Column(Float, nullable=True)
    design_temp = Column(Float, nullable=True)

    # operating conditions
    operating_pressure = Column(Float, nullable=True)
    operating_temp = Column(Float, nullable=True)

    insulation = Column(Boolean, default=False)

    # additional data as JSON
    additional_data = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # relationships
    user = relationship("User", back_populates="equipment")


# creates all tables
def init_db():
    Base.metadata.create_all(bind=engine)


# dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
