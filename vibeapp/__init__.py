from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


from vibeapp.extensions import db, migrate, login_manager
from vibeapp.config import Config

#errorhandler import
from vibeapp.exceptions import PlaylistFetchError, TokenRefreshError, UnsupportedPlatformError


#Blueprint import
from vibeapp.routes import register_routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    migrate.init_app(app, db)
    
    login_manager.init_app(app)
    login_manager.login_view = "public.login"

    # Blueprint 등록
    register_routes(app)
    
    with app.app_context():
        db.create_all() # DB 테이블 생성
        
        
    @app.errorhandler(TokenRefreshError)
    def handle_token_refresh_error(e):
        return jsonify({"error": "토큰 갱신 실패", "detail": str(e)}), 401
    
    @app.errorhandler(PlaylistFetchError)
    def handle_playlist_error(e):
        return jsonify({"error": "플레이리스트 가져오기 실패", "detail": str(e)}), 500
    
    @app.errorhandler(UnsupportedPlatformError)
    def handle_platform_error(e):
        return jsonify({"error": "지원되지 않는 플랫폼입니다", "detail": str(e)}), 400
        
    def kst_format(dt):
        if dt is None:
            return "없음"
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        kst_time = dt.astimezone(ZoneInfo("Asia/Seoul"))
        return kst_time.strftime("%Y-%m-%d %H:%M:%S")
    
    app.jinja_env.filters['kst'] = kst_format

    return app