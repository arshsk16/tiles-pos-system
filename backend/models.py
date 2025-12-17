from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from passlib.hash import bcrypt

db = SQLAlchemy()


# =============================
# Product Model
# =============================
class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50), default="General")
    size = db.Column(db.String(50))
    price = db.Column(db.Float, nullable=False)
    stock_qty = db.Column(db.Integer, nullable=False, default=0)
    min_stock = db.Column(db.Integer, nullable=False, default=5)

    # Relationship with sales
    sales = db.relationship("Sale", back_populates="product", cascade="all, delete-orphan")


# =============================
# Sale Model
# =============================
class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    sale_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship back to product
    product = db.relationship("Product", back_populates="sales")


# =============================
# User Model
# =============================
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # ✅ unified name

    def set_password(self, password):
        """Hash and store password securely."""
        self.password = bcrypt.hash(password)

    def check_password(self, password):
        """Verify given password against stored hash."""
        return bcrypt.verify(password, self.password)
