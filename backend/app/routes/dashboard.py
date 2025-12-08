from flask import Blueprint, jsonify
from flask_cors import cross_origin

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@cross_origin()
def get_dashboard_stats():
    return jsonify({
        'totalEquipment': 156,
        'processedDrawings': 89,
        'pendingInspections': 23,
        'completedInspections': 45
    }), 200

@dashboard_bp.route('/recent-activities', methods=['GET'])
@cross_origin()
def get_recent_activities():
    return jsonify([
        {
            'id': '1',
            'type': 'upload',
            'description': 'GA_Drawing_001.pdf processed successfully',
            'timestamp': '2024-11-28T10:30:00Z',
            'user': 'Technical Assistant',
            'status': 'completed'
        },
        {
            'id': '2',
            'type': 'processing',
            'description': 'GA_Drawing_002.pdf extraction in progress',
            'timestamp': '2024-11-28T11:15:00Z',
            'user': 'LLM Processor',
            'status': 'pending'
        }
    ]), 200