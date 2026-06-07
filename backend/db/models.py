import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Package(Base):
    __tablename__ = "packages"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_damaged = Column(Boolean, default=False)
    total_degradation = Column(Float, default=0.0)
    reject_decision = Column(String)  # PASS, REJECT, EDGE_CASE
    inference_latency_ms = Column(Float)
    camera_id = Column(String)

    defects = relationship("DefectInstance", back_populates="package")


class DefectInstance(Base):
    __tablename__ = "defect_instances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    package_id = Column(String, ForeignKey("packages.id"))
    defect_type = Column(String)  # crushed_corner, punctured_surface, etc.
    confidence = Column(Float)
    bbox = Column(JSON)  # [x1, y1, x2, y2]
    mask_polygon = Column(JSON)  # [[x,y], [x,y]...]
    
    package = relationship("Package", back_populates="defects")


class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    throughput_per_min = Column(Integer)
    defect_rate_pct = Column(Float)
    avg_latency_ms = Column(Float)
    reject_count = Column(Integer)


# Database setup
DATABASE_URL = "sqlite+aiosqlite:///./pdds.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
