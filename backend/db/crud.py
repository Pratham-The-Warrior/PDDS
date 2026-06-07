from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import Package, DefectInstance, SystemMetric
import uuid
import datetime

async def create_package_record(db: AsyncSession, package_data: dict, defects_data: list):
    """
    Saves a package and its associated defects to the database.
    """
    pkg_id = package_data.get("id", str(uuid.uuid4()))
    
    db_package = Package(
        id=pkg_id,
        is_damaged=package_data.get("is_damaged", False),
        total_degradation=package_data.get("total_degradation", 0.0),
        reject_decision=package_data.get("reject_decision", "PASS"),
        inference_latency_ms=package_data.get("inference_latency_ms", 0.0),
        camera_id=package_data.get("camera_id", "CAM-01")
    )
    db.add(db_package)
    
    for defect in defects_data:
        db_defect = DefectInstance(
            package_id=pkg_id,
            defect_type=defect.get("type"),
            confidence=defect.get("confidence"),
            bbox=defect.get("bbox"),
            mask_polygon=defect.get("mask")
        )
        db.add(db_defect)
        
    await db.commit()
    await db.refresh(db_package)
    return db_package

async def get_recent_packages(db: AsyncSession, limit: int = 50):
    """
    Fetch recent packages for the dashboard history.
    """
    result = await db.execute(
        select(Package).order_by(Package.timestamp.desc()).limit(limit)
    )
    return result.scalars().all()
