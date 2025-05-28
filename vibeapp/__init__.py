from flask import Flask
from vibeapp.config import Config

#Blueprint import
from .admin import admin_bp
from .public import public_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Blueprint 등록
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(public_bp)

    return app