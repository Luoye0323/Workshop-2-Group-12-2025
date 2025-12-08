from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename
import json
from uuid import uuid4
import pytz

app = Flask(__name__)
CORS(app)

# ====================
# CONFIGURATION
# ====================
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}
app.config['MAX_FILES'] = 10

# In-memory databases
inspections_db = []
uploaded_files_db = []

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ====================
# HELPER FUNCTIONS
# ====================
def seed_sample_inspections():
    """Seed the database with sample inspections"""
    today = datetime.now()
    
    sample_inspections = [
        {
            'id': '1',
            'title': 'Quarterly Pressure Vessel Inspection',
            'equipmentId': 'PV-001',
            'equipmentName': 'Pressure Vessel A',
            'assignedEngineer': 'John Smith',
            'start': (today + timedelta(days=1)).isoformat(),
            'end': (today + timedelta(days=1, hours=8)).isoformat(),
            'status': 'scheduled',
            'priority': 'high',
            'inspectionPlan': 'PV-001-Inspection-2024Q4.pptx',
            'notes': 'Check for corrosion and weld integrity',
            'createdAt': (today - timedelta(days=5)).isoformat(),
            'createdBy': 'Admin',
            'updatedAt': (today - timedelta(days=5)).isoformat()
        },
        {
            'id': '2',
            'title': 'Annual Heat Exchanger Review',
            'equipmentId': 'HE-002',
            'equipmentName': 'Heat Exchanger B',
            'assignedEngineer': 'Sarah Johnson',
            'start': (today + timedelta(days=3)).isoformat(),
            'end': (today + timedelta(days=3, hours=6)).isoformat(),
            'status': 'scheduled',
            'priority': 'medium',
            'inspectionPlan': 'HE-002-Annual-2024.pptx',
            'notes': 'Inspect tubes and baffles',
            'createdAt': (today - timedelta(days=3)).isoformat(),
            'createdBy': 'Admin',
            'updatedAt': (today - timedelta(days=3)).isoformat()
        },
        {
            'id': '3',
            'title': 'Emergency Valve Inspection',
            'equipmentId': 'VALVE-003',
            'equipmentName': 'Safety Valve C',
            'assignedEngineer': 'Mike Wilson',
            'start': (today + timedelta(hours=2)).isoformat(),
            'end': (today + timedelta(hours=4)).isoformat(),
            'status': 'in-progress',
            'priority': 'high',
            'inspectionPlan': 'VALVE-003-Emergency.pptx',
            'notes': 'Emergency maintenance required',
            'createdAt': (today - timedelta(days=1)).isoformat(),
            'createdBy': 'Admin',
            'updatedAt': (today - timedelta(days=1)).isoformat()
        }
    ]
    
    inspections_db.extend(sample_inspections)

def seed_sample_uploads():
    """Seed the uploaded files database with sample data"""
    today = datetime.now()
    
    sample_files = [
        {
            'id': str(uuid4()),
            'originalName': 'GA_Drawing_001.pdf',
            'savedName': '20240115_143000_GA_Drawing_001.pdf',
            'filepath': os.path.join(app.config['UPLOAD_FOLDER'], '20240115_143000_GA_Drawing_001.pdf'),
            'size': 2456789,
            'uploadedAt': (today - timedelta(days=2)).isoformat(),
            'status': 'processed',
            'processed': True
        },
        {
            'id': str(uuid4()),
            'originalName': 'GA_Drawing_002.pdf',
            'savedName': '20240116_093000_GA_Drawing_002.pdf',
            'filepath': os.path.join(app.config['UPLOAD_FOLDER'], '20240116_093000_GA_Drawing_002.pdf'),
            'size': 3456789,
            'uploadedAt': (today - timedelta(days=1)).isoformat(),
            'status': 'processing',
            'processed': False
        }
    ]
    
    uploaded_files_db.extend(sample_files)

# ====================
# DASHBOARD ENDPOINTS (ENHANCED)
# ====================
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        total_inspections = len(inspections_db)
        completed_inspections = len([i for i in inspections_db if i['status'] == 'completed'])
        pending_inspections = len([i for i in inspections_db if i['status'] in ['scheduled', 'in-progress']])
        
        return jsonify({
            'success': True,
            'data': {
                'totalEquipment': 156,
                'processedDrawings': len([f for f in uploaded_files_db if f.get('processed', False)]),
                'pendingInspections': pending_inspections,
                'completedInspections': completed_inspections,
                'totalInspections': total_inspections,
                'uploadedDrawings': len(uploaded_files_db),
                'extractionAccuracy': 98.5
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get dashboard stats: {str(e)}'
        }), 500

@app.route('/api/dashboard/recent-activities', methods=['GET'])
def get_recent_activities():
    """Get recent system activities"""
    try:
        # Combine inspection updates and file uploads
        activities = []
        
        # Add recent inspections (limit to 10)
        recent_inspections = sorted(
            inspections_db, 
            key=lambda x: x.get('createdAt', '2000-01-01'), 
            reverse=True
        )[:10]
        
        for insp in recent_inspections:
            activities.append({
                'id': insp['id'],
                'type': 'inspection',
                'description': f"{insp['title']} - {insp['equipmentName']}",
                'timestamp': insp.get('createdAt', datetime.now().isoformat()),
                'user': insp.get('createdBy', 'System'),
                'status': insp['status']
            })
        
        # Add recent file uploads (limit to 5)
        recent_uploads = sorted(
            uploaded_files_db,
            key=lambda x: x.get('uploadedAt', '2000-01-01'),
            reverse=True
        )[:5]
        
        for file in recent_uploads:
            activities.append({
                'id': file['id'],
                'type': 'upload',
                'description': f"Uploaded: {file['originalName']}",
                'timestamp': file.get('uploadedAt', datetime.now().isoformat()),
                'user': 'Technical Assistant',
                'status': file.get('status', 'uploaded')
            })
        
        # Add static sample activities if database is empty
        if not activities:
            activities = [
                {
                    'id': '1',
                    'type': 'upload',
                    'description': 'GA_Drawing_001.pdf processed successfully',
                    'timestamp': datetime.now().isoformat() + 'Z',
                    'user': 'Technical Assistant',
                    'status': 'completed'
                },
                {
                    'id': '2', 
                    'type': 'processing',
                    'description': 'GA_Drawing_002.pdf extraction in progress',
                    'timestamp': (datetime.now() - timedelta(hours=1)).isoformat() + 'Z',
                    'user': 'LLM Processor',
                    'status': 'pending'
                },
                {
                    'id': '3',
                    'type': 'inspection',
                    'description': 'Pressure Vessel A inspection scheduled',
                    'timestamp': (datetime.now() - timedelta(hours=2)).isoformat() + 'Z',
                    'user': 'RBI Engineer',
                    'status': 'completed'
                }
            ]
        
        # Sort all activities by timestamp (newest first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': activities[:10]  # Return only 10 most recent
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get recent activities: {str(e)}'
        }), 500

# ====================
# FILE UPLOAD ENDPOINTS (ENHANCED)
# ====================
@app.route('/api/upload/pdf', methods=['POST'])
def upload_pdf():
    """Upload a PDF file for processing"""
    try:
        # Check if file exists in request
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file part in request'
            }), 400
        
        file = request.files['file']
        
        # Check if file was selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type. Only PDF files are allowed.'
            }), 400
        
        # Secure the filename and save
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        file.save(filepath)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        
        # Record file upload
        file_record = {
            'id': str(uuid4()),
            'original_name': filename,
            'saved_name': unique_filename,
            'filepath': filepath,
            'size': file_size,
            'uploadedAt': datetime.now().isoformat(),
            'status': 'uploaded',
            'processed': False
        }
        
        uploaded_files_db.append(file_record)
        
        # Simulate LLM processing (you'll replace this with actual LLM call)
        processing_result = {
            'equipment_found': ['Pressure Vessel', 'Heat Exchanger', 'Valves'],
            'pages_processed': 24,
            'extraction_confidence': 0.92,
            'estimated_processing_time': '45 seconds'
        }
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'data': {
                **file_record,
                'upload_time': datetime.now().isoformat(),
                'processing': processing_result
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500

@app.route('/api/upload/multiple', methods=['POST'])
def upload_multiple_pdfs():
    """Upload multiple PDF files"""
    try:
        files = request.files.getlist('files')
        
        if not files:
            return jsonify({
                'success': False,
                'error': 'No files provided'
            }), 400
        
        if len(files) > app.config['MAX_FILES']:
            return jsonify({
                'success': False,
                'error': f'Maximum {app.config["MAX_FILES"]} files allowed'
            }), 400
        
        results = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_filename = f"{timestamp}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                
                file.save(filepath)
                
                file_record = {
                    'id': str(uuid4()),
                    'original_name': filename,
                    'saved_name': unique_filename,
                    'filepath': filepath,
                    'size': os.path.getsize(filepath),
                    'uploadedAt': datetime.now().isoformat(),
                    'status': 'uploaded',
                    'processed': False
                }
                
                uploaded_files_db.append(file_record)
                results.append(file_record)
        
        return jsonify({
            'success': True,
            'message': f'{len(results)} files uploaded successfully',
            'data': results
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500

@app.route('/api/upload/status', methods=['GET'])
def get_upload_status():
    """Get statistics about uploaded files"""
    try:
        # Get physical files from upload folder
        upload_folder = app.config['UPLOAD_FOLDER']
        physical_files = []
        total_physical_size = 0
        
        if os.path.exists(upload_folder):
            for filename in os.listdir(upload_folder):
                filepath = os.path.join(upload_folder, filename)
                if os.path.isfile(filepath):
                    file_stat = os.stat(filepath)
                    physical_files.append({
                        'name': filename,
                        'size': file_stat.st_size,
                        'modified': datetime.fromtimestamp(file_stat.st_mtime).isoformat()
                    })
                    total_physical_size += file_stat.st_size
        
        # Get database statistics
        total_db_files = len(uploaded_files_db)
        total_db_size = sum(f.get('size', 0) for f in uploaded_files_db)
        processed_files = len([f for f in uploaded_files_db if f.get('processed', False)])
        pending_files = len([f for f in uploaded_files_db if not f.get('processed', False)])
        
        # Sort by modification time (newest first)
        physical_files.sort(key=lambda x: x['modified'], reverse=True)
        recent_uploads = physical_files[:5]  # Get 5 most recent
        
        return jsonify({
            'success': True,
            'data': {
                'total_files': total_db_files,
                'total_size': total_db_size,
                'recent_uploads': recent_uploads,
                'folder_path': upload_folder,
                'processed_files': processed_files,
                'pending_files': pending_files,
                'physical_files_count': len(physical_files),
                'physical_files_size': total_physical_size
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get upload status: {str(e)}'
        }), 500

# ====================
# SCHEDULING ENDPOINTS (ENHANCED)
# ====================
@app.route('/api/scheduling/inspections', methods=['GET'])
def get_inspections():
    """Get all inspections"""
    try:
        # If database is empty, seed with sample data
        if not inspections_db:
            seed_sample_inspections()
        
        return jsonify({
            'success': True,
            'data': inspections_db,
            'count': len(inspections_db)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get inspections: {str(e)}'
        }), 500
        

@app.route('/api/scheduling/inspections', methods=['POST'])
def create_inspection():
    """Create a new inspection"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'equipmentId', 'equipmentName', 'start', 'end']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Validate date format and logic
        try:
            # Parse dates - handle both with and without timezone
            start_str = data['start']
            end_str = data['end']
            
            # Convert Z to +00:00 for fromisoformat
            if start_str.endswith('Z'):
                start_str = start_str[:-1] + '+00:00'
            if end_str.endswith('Z'):
                end_str = end_str[:-1] + '+00:00'
            
            start_date = datetime.fromisoformat(start_str)
            end_date = datetime.fromisoformat(end_str)
            
            # Make dates timezone-aware if they aren't already
            utc = pytz.UTC
            if start_date.tzinfo is None:
                start_date = utc.localize(start_date)
            if end_date.tzinfo is None:
                end_date = utc.localize(end_date)
                
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid date format. Use ISO 8601 format (e.g., 2024-01-15T10:30:00Z).'
            }), 400
        
        # Check if end date is after start date
        if end_date <= start_date:
            return jsonify({
                'success': False,
                'error': 'End date must be after start date'
            }), 400
        
        # Check if start date is in the past - use UTC for comparison
        current_time_utc = datetime.now(pytz.UTC)
        if start_date < current_time_utc:
            return jsonify({
                'success': False,
                'error': 'Start time cannot be in the past'
            }), 400
        
        # Create new inspection
        new_inspection = {
            'id': str(uuid4()),
            'title': data['title'],
            'equipmentId': data['equipmentId'],
            'equipmentName': data['equipmentName'],
            'assignedEngineer': data.get('assignedEngineer', 'Unassigned'),
            'start': data['start'],  # Store original string
            'end': data['end'],      # Store original string
            'status': data.get('status', 'scheduled'),
            'priority': data.get('priority', 'medium'),
            'inspectionPlan': data.get('inspectionPlan', ''),
            'notes': data.get('notes', ''),
            'createdAt': datetime.now(pytz.UTC).isoformat(),
            'createdBy': data.get('createdBy', 'System'),
            'updatedAt': datetime.now(pytz.UTC).isoformat()
        }
        
        inspections_db.append(new_inspection)
        
        return jsonify({
            'success': True,
            'message': 'Inspection created successfully',
            'data': new_inspection
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to create inspection: {str(e)}'
        }), 500

@app.route('/api/scheduling/inspections/<inspection_id>', methods=['PUT'])
def update_inspection(inspection_id):
    """Update an existing inspection"""
    try:
        data = request.get_json()
        
        # Find inspection
        inspection_index = next(
            (i for i, insp in enumerate(inspections_db) if insp['id'] == inspection_id),
            None
        )
        
        if inspection_index is None:
            return jsonify({
                'success': False,
                'error': 'Inspection not found'
            }), 404
        
        current_inspection = inspections_db[inspection_index]
        utc = pytz.UTC
        
        # Validate dates if they're being updated
        if 'start' in data or 'end' in data:
            # Parse start date
            start_str = data.get('start', current_inspection['start'])
            if start_str.endswith('Z'):
                start_str = start_str[:-1] + '+00:00'
            start_date = datetime.fromisoformat(start_str)
            if start_date.tzinfo is None:
                start_date = utc.localize(start_date)
            
            # Parse end date
            end_str = data.get('end', current_inspection['end'])
            if end_str.endswith('Z'):
                end_str = end_str[:-1] + '+00:00'
            end_date = datetime.fromisoformat(end_str)
            if end_date.tzinfo is None:
                end_date = utc.localize(end_date)
            
            if end_date <= start_date:
                return jsonify({
                    'success': False,
                    'error': 'End date must be after start date'
                }), 400
            
            # Check if start date is in the past
            current_time_utc = datetime.now(utc)
            if start_date < current_time_utc:
                return jsonify({
                    'success': False,
                    'error': 'Start time cannot be in the past'
                }), 400
        
        # Update inspection
        updated_inspection = {**current_inspection, **data}
        updated_inspection['updatedAt'] = datetime.now(utc).isoformat()
        
        # Update date strings if dates were provided
        if 'start' in data:
            updated_inspection['start'] = data['start']
        if 'end' in data:
            updated_inspection['end'] = data['end']
        
        inspections_db[inspection_index] = updated_inspection
        
        return jsonify({
            'success': True,
            'message': 'Inspection updated successfully',
            'data': updated_inspection
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to update inspection: {str(e)}'
        }), 500

@app.route('/api/scheduling/inspections/<inspection_id>', methods=['DELETE'])
def delete_inspection(inspection_id):
    """Delete an inspection"""
    try:
        global inspections_db
        initial_length = len(inspections_db)
        
        inspections_db = [insp for insp in inspections_db if insp['id'] != inspection_id]
        
        if len(inspections_db) == initial_length:
            return jsonify({
                'success': False,
                'error': 'Inspection not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Inspection deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to delete inspection: {str(e)}'
        }), 500

@app.route('/api/scheduling/calendar-events', methods=['GET'])
def get_calendar_events():
    """Get events in calendar format"""
    today = datetime.now()
    
    # Use data from inspections_db if available, otherwise create sample data
    if inspections_db:
        events = []
        for insp in inspections_db:
            events.append({
                'id': insp['id'],
                'title': insp['title'],
                'start': insp['start'],
                'end': insp['end'],
                'resource': {
                    'equipmentId': insp['equipmentId'],
                    'status': insp['status'],
                    'priority': insp['priority'],
                    'equipmentName': insp.get('equipmentName', ''),
                    'assignedEngineer': insp.get('assignedEngineer', '')
                }
            })
        return jsonify(events)
    else:
        return jsonify([
            {
                'id': '1',
                'title': 'PV Inspection',
                'start': (today + timedelta(days=1)).isoformat(),
                'end': (today + timedelta(days=1, hours=8)).isoformat(),
                'resource': {
                    'equipmentId': 'PV-001',
                    'status': 'scheduled'
                }
            }
        ])

# ====================
# HEALTH CHECK (ENHANCED)
# ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'RBI Automation System',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'statistics': {
            'inspections_count': len(inspections_db),
            'uploaded_files_count': len(uploaded_files_db),
            'processed_files_count': len([f for f in uploaded_files_db if f.get('processed', False)])
        },
        'endpoints': {
            'inspections': '/api/scheduling/inspections',
            'dashboard_stats': '/api/dashboard/stats',
            'recent_activities': '/api/dashboard/recent-activities',
            'upload_pdf': '/api/upload/pdf',
            'upload_multiple': '/api/upload/multiple',
            'upload_status': '/api/upload/status',
            'calendar_events': '/api/scheduling/calendar-events',
            'health_check': '/api/health'
        }
    })

# ====================
# ERROR HANDLERS
# ====================
@app.errorhandler(413)
def too_large(e):
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum size is 50MB.'
    }), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# ====================
# MAIN ENTRY POINT
# ====================
if __name__ == '__main__':
    # Seed databases with sample data
    if not inspections_db:
        seed_sample_inspections()
    
    if not uploaded_files_db:
        seed_sample_uploads()
    
    print("=" * 60)
    print("🚀 RBI Automation System Backend")
    print("=" * 60)
    print(f"📁 Upload folder: {os.path.abspath(app.config['UPLOAD_FOLDER'])}")
    print(f"🌐 API Base URL: http://localhost:5000")
    print(f"📊 Dashboard: http://localhost:5000/api/dashboard/stats")
    print(f"📅 Inspections: http://localhost:5000/api/scheduling/inspections")
    print(f"📄 Upload: POST http://localhost:5000/api/upload/pdf")
    print(f"📋 Recent Activities: http://localhost:5000/api/dashboard/recent-activities")
    print(f"📈 Upload Status: http://localhost:5000/api/upload/status")
    print(f"📅 Calendar Events: http://localhost:5000/api/scheduling/calendar-events")
    print(f"🩺 Health Check: http://localhost:5000/api/health")
    print("=" * 60)
    print(f"📊 Initial Stats: {len(inspections_db)} inspections, {len(uploaded_files_db)} uploaded files")
    print("=" * 60)
    print("Starting server...")
    app.run(debug=True, port=5000)