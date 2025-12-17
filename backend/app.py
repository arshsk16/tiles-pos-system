import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Product, Sale, User
from config import Config
from datetime import datetime
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from passlib.hash import bcrypt
from sqlalchemy import func  # Added for aggregation  # ✅ passlib for password hashing

app = Flask(__name__)
app.config.from_object(Config)

# JWT setup
jwt = JWTManager(app)

# Database + Migrations
db.init_app(app)
migrate = Migrate(app, db)

# CORS Configuration
# Allow requests from the configured FRONTEND_URL and localhost (for dev)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [frontend_url, "http://localhost:5173"]
CORS(app, origins=origins)

# Create tables (dev/demo only)
with app.app_context():
    db.create_all()

# ---------------------------
# Home
# ---------------------------
@app.route("/")
def home():
    return {"message": "TilesTrack API is running 🚀"}

# ---------------------------
# User Authentication
# ---------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = bcrypt.hash(data["password"])
    new_user = User(username=data["username"], password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(username=data["username"]).first()

    if user and bcrypt.verify(data["password"], user.password):
        token = create_access_token(identity=user.username)
        return jsonify({"message": "Login successful", "token": token})
    return jsonify({"error": "Invalid username or password"}), 401


@app.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    data = request.json
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()

    if not user or not bcrypt.verify(data["old_password"], user.password):
        return jsonify({"error": "Invalid old password"}), 401

    user.password = bcrypt.hash(data["new_password"])
    db.session.commit()
    return jsonify({"message": "Password updated successfully"}), 200

def get_default_min_stock(category):
    """Return default min_stock based on category."""
    cat = category.lower() if category else ""
    if cat == "tiles":
        return 40
    if cat in ["sanitary", "taps", "fittings", "accessories"]:
        return 10
    return 5

# ---------------------------
# Products CRUD
# ---------------------------
@app.route("/products", methods=["POST"])
@jwt_required()
def add_product():
    data = request.json
    existing_product = Product.query.filter_by(name=data["name"]).first()
    if existing_product:
        return jsonify({"error": "Product with this name already exists"}), 400

    category = data.get("category", "General")
    min_stock = data.get("min_stock")
    
    if min_stock is None:
        min_stock = get_default_min_stock(category)

    new_product = Product(
        name=data["name"],
        category=category,
        size=data.get("size", ""),
        price=data["price"],
        stock_qty=data.get("stock_qty", 0),
        min_stock=min_stock
    )
    db.session.add(new_product)
    db.session.commit()

    return jsonify({"message": "Product added", "product": {
        "id": new_product.id,
        "name": new_product.name,
        "category": new_product.category,
        "size": new_product.size,
        "price": new_product.price,
        "stock_qty": new_product.stock_qty,
        "min_stock": new_product.min_stock
    }}), 201


@app.route("/products", methods=["GET"])
@jwt_required()
def get_products():
    products = Product.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "size": p.size,
        "price": p.price,
        "stock_qty": p.stock_qty,
        "min_stock": p.min_stock
    } for p in products])


@app.route("/products/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.json
    product.name = data.get("name", product.name)
    product.category = data.get("category", product.category)
    product.size = data.get("size", product.size)
    product.price = data.get("price", product.price)
    product.stock_qty = data.get("stock_qty", product.stock_qty)
    
    if "min_stock" in data:
        product.min_stock = data["min_stock"]

    db.session.commit()
    return jsonify({"message": "Product updated", "product": {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "size": product.size,
        "price": product.price,
        "stock_qty": product.stock_qty,
        "min_stock": product.min_stock
    }})


@app.route("/products/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"})

# ---------------------------
# Sales (GET + POST merged)
# ---------------------------
@app.route("/sales", methods=["GET", "POST"])
@jwt_required()
def handle_sales():
    if request.method == "POST":
        # --- record a new sale ---
        data = request.json
        product = Product.query.get(data["product_id"])

        if not product:
            return jsonify({"error": "Product not found"}), 404
        if product.stock_qty < data["quantity"]:
            return jsonify({"error": "Not enough stock", "available_stock": product.stock_qty}), 400

        sale = Sale(
            product_id=product.id,
            quantity=data["quantity"],
            total_price=product.price * data["quantity"]
        )
        product.stock_qty -= data["quantity"]
        db.session.add(sale)
        db.session.commit()

        return jsonify({"message": "Sale recorded", "sale_id": sale.id}), 201

    # --- GET sales with optional date filter ---
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    query = Sale.query

    if from_date and to_date:
        try:
            from_dt = datetime.strptime(from_date, "%Y-%m-%d")
            to_dt = datetime.strptime(to_date, "%Y-%m-%d")
            query = query.filter(Sale.sale_date >= from_dt, Sale.sale_date <= to_dt)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    else:
        # fallback to current month if no filter
        now = datetime.now()
        query = query.filter(
            db.extract("month", Sale.sale_date) == now.month,
            db.extract("year", Sale.sale_date) == now.year
        )

    sales = query.all()
    return jsonify([{
        "sale_id": s.id,
        "product_name": s.product.name,
        "quantity": s.quantity,
        "total_price": s.total_price,
        "sale_date": s.sale_date.strftime("%Y-%m-%d %H:%M:%S")
    } for s in sales])


# ---------------------------
# Sales Report (Aggregated)
# ---------------------------
@app.route("/sales/report", methods=["GET"])
@jwt_required()
def sales_report():
    import io
    import csv
    from flask import Response

    from_date = request.args.get("from")
    to_date = request.args.get("to")
    product_id = request.args.get("product_id", type=int)
    group_by = request.args.get("group_by")  # 'date' or None
    export_fmt = request.args.get("export")  # 'csv' or None

    # Base Query construction
    if group_by == 'date':
        # Group by Date
        query = db.session.query(
            func.date(Sale.sale_date).label("sale_date"),
            func.sum(Sale.quantity).label("total_quantity"),
            func.sum(Sale.total_price).label("total_revenue")
        ).join(Product, Sale.product_id == Product.id)  # Join Product for filtering
    else:
        # Group by Product (Default)
        query = db.session.query(
            Product.id,
            Product.name,
            func.sum(Sale.quantity).label("total_quantity"),
            func.sum(Sale.total_price).label("total_revenue")
        ).join(Sale, Product.id == Sale.product_id)

    # --- Apply Filters (Same for both modes) ---
    # Date Filtering
    if not from_date and not to_date:
        # Default: Current Month
        now = datetime.now()
        query = query.filter(
            db.extract("month", Sale.sale_date) == now.month,
            db.extract("year", Sale.sale_date) == now.year
        )
    else:
        # Custom Date Filtering
        if from_date:
            try:
                from_dt = datetime.strptime(from_date, "%Y-%m-%d")
                query = query.filter(Sale.sale_date >= from_dt)
            except ValueError:
                return jsonify({"error": "Invalid from_date format. Use YYYY-MM-DD"}), 400

        if to_date:
            try:
                to_dt = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59,
                                                                      microsecond=999999)
                query = query.filter(Sale.sale_date <= to_dt)
            except ValueError:
                return jsonify({"error": "Invalid to_date format. Use YYYY-MM-DD"}), 400

    # Optional Product Filtering
    if product_id:
        query = query.filter(Product.id == product_id)

    # --- Grouping and Execution ---
    if group_by == 'date':
        results = query.group_by(func.date(Sale.sale_date)).order_by(func.date(Sale.sale_date)).all()
        return jsonify([{
            "sale_date": r.sale_date,
            "total_quantity": r.total_quantity or 0,
            "total_revenue": r.total_revenue or 0.0
        } for r in results])

    else:
        # Product grouping (Default)
        results = query.group_by(Product.id).all()

        # Check for Export
        if export_fmt == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            # Header
            writer.writerow(['Product Name', 'Total Quantity', 'Total Revenue', 'From Date', 'To Date'])

            f_str = from_date if from_date else "Start"
            t_str = to_date if to_date else "End"

            for r in results:
                writer.writerow([r.name, r.total_quantity or 0, r.total_revenue or 0.0, f_str, t_str])

            return Response(
                output.getvalue(),
                mimetype="text/csv",
                headers={"Content-Disposition": "attachment;filename=sales_report.csv"}
            )

        return jsonify([{
            "product_id": r.id,
            "product_name": r.name,
            "total_quantity_sold": r.total_quantity or 0,
            "total_revenue": r.total_revenue or 0.0
        } for r in results])

# ---------------------------
# Low stock products
# ---------------------------
@app.route("/products/low-stock", methods=["GET"])
@jwt_required()
def low_stock():
    # threshold = request.args.get("threshold", 10, type=int) # No longer used
    
    # Query products where stock_qty <= min_stock
    products = Product.query.filter(Product.stock_qty <= Product.min_stock).all()
    
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "stock_qty": p.stock_qty,
        "min_stock": p.min_stock
    } for p in products])

@app.route("/products/low-stock/count", methods=["GET"])
@jwt_required()
def low_stock_count():
    count = Product.query.filter(Product.stock_qty <= Product.min_stock).count()
    return jsonify({"count": count})

# ---------------------------
# Main
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True)
