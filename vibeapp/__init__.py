from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


from vibeapp.extensions import db
from vibeapp.config import Config

#Blueprint import
from vibeapp.admin import admin_bp
from vibeapp.public import public_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)

    # Blueprint 등록
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(public_bp)
    
    with app.app_context():
        db.create_all() # DB 테이블 생성
        
        
    def kst_format(dt):
        if dt is None:
            return "없음"
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        kst_time = dt.astimezone(ZoneInfo("Asia/Seoul"))
        return kst_time.strftime("%Y-%m-%d %H:%M:%S")
    
    app.jinja_env.filters['kst'] = kst_format

    return app