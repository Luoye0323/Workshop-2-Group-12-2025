from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Inspection(db.Model):
    __tablename__ = 'inspections'
    
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    equipment_id = db.Column(db.String(50), nullable=False)
    equipment_name = db.Column(db.String(100), nullable=False)
    assigned_engineer = db.Column(db.String(100), nullable=False)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')
    priority = db.Column(db.String(20), default='medium')
    inspection_plan = db.Column(db.String(200))
    notes = db.Column(db.Text)
    created_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'equipmentId': self.equipment_id,
            'equipmentName': self.equipment_name,
            'assignedEngineer': self.assigned_engineer,
            'start': self.start.isoformat(),
            'end': self.end.isoformat(),
            'status': self.status,
            'priority': self.priority,
            'inspectionPlan': self.inspection_plan,
            'notes': self.notes,
            'createdBy': self.created_by,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class UploadedFile(db.Model):
    __tablename__ = 'uploaded_files'
    
    id = db.Column(db.String(36), primary_key=True)
    original_name = db.Column(db.String(200), nullable=False)
    saved_name = db.Column(db.String(200), nullable=False)
    filepath = db.Column(db.String(500), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='uploaded')
    processed = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'originalName': self.original_name,
            'savedName': self.saved_name,
            'filepath': self.filepath,
            'size': self.size,
            'uploadedAt': self.uploaded_at.isoformat(),
            'status': self.status,
            'processed': self.processed
        }