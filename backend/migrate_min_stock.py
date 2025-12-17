from app import app, db
from sqlalchemy import text

def run_migration():
    with app.app_context():
        print("Starting migration...")
        
        # 1. Add column min_stock
        # We use a try-except block in case the column already exists (idempotency)
        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5;"))
                conn.commit()
            print("Added min_stock column.")
        except Exception as e:
            print(f"Column might already exist or error: {e}")

        # 2. Update default values based on category
        # Logic:
        # - Tiles -> 40
        # - Sanitary, Taps, Fittings, Accessories -> 10
        # - Others -> 5 (already set by DEFAULT 5, but we can enforce if needed)
        
        updates = [
            ("Tiles", 40),
            ("Sanitary", 10),
            ("Taps", 10),
            ("Fittings", 10),
            ("Accessories", 10)
        ]

        with db.engine.connect() as conn:
            # We use ILIKE for case-insensitivity just in case
            for cat, val in updates:
                # Note: This is a simple update. 
                # If a product has category "Sanitary Ware", it won't match "Sanitary".
                # The prompt said "Sanitary / Taps / Fittings", implying these are distinct or part of a group.
                # We will assume exact match or contains. Let's use exact match first as per common POS categories.
                # If the user meant these as keywords, we might need LIKE '%...%'.
                # Given "Tiles" is usually a main category, exact match is safer to avoid accidents.
                
                query = text(f"UPDATE products SET min_stock = :val WHERE category = :cat")
                result = conn.execute(query, {"val": val, "cat": cat})
                # print(f"Updated {cat} to {val}")
            
            conn.commit()
        
        print("Migration complete.")

if __name__ == "__main__":
    run_migration()
