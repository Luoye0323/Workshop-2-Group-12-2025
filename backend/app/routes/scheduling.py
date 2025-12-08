from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime

scheduling_bp = Blueprint('scheduling', __name__)

# Mock data
inspections = [
    {
        'id': '1',
        'title': 'Quarterly Pressure Vessel Inspection',
        'start': '2024-12-01T09:00:00',
        'end': '2024-12-01T17:00:00',
        'equipmentId': 'PV-001',
        'equipmentName': 'Pressure Vessel A',
        'assignedEngineer': 'John Smith',
        'status': 'scheduled',
        'priority': 'high',
        'inspectionPlan': 'PV-001-Inspection-2024Q4.pptx'
    }
]

@scheduling_bp.route('/inspections', methods=['GET'])
@cross_origin()
def get_inspections():
    return jsonify(inspections), 200