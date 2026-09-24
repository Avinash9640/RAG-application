from app.database import engine


try:
    with engine.connect() as connection:
        print("Database connection successful.")
        print("PostgreSQL connection is working.")

except Exception as error:
    print("Database connection failed.")
    print(error)