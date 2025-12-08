from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Register blueprints
    from app.routes.dashboard import dashboard_bp
    from app.routes.scheduling import scheduling_bp
    
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(scheduling_bp, url_prefix='/api/scheduling')
    
    return app