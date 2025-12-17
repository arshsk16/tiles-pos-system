# TilesTrack - Inventory & Sales System

## Project Overview
TilesTrack is a specialized POS (Point of Sale) and inventory management system designed for a family-run tiles business. It allows for seamless management of products (Tiles, Sanitary, Taps, etc.), tracking of stock levels, processing of sales, and monitoring of low stock items across multiple devices.

The system is built to be simple, robust, and accessible from both laptops and mobile phones, ensuring the family can manage the shop from anywhere.

## Features
- **Product Management**: Add, edit, and delete products with specific categories and attributes (Size, Price, Stock).
- **Sales Entry**: Record sales quickly with automatic stock deduction.
- **Low Stock Alerts**: "Low Stock" badge in the navigation bar and a dedicated page to view items running low (customizable per product).
- **Multi-Device Access**: Cloud-deployed database allows real-time data synchronization between the shop laptop and family members' mobile phones.
- **Secure Access**: User authentication to protect business data.

## How the Family Uses It
1.  **Shop Laptop**: Used as the main terminal for entering daily sales and adding new inventory shipments.
2.  **Mobile Phones**: Family members log in to check stock availability while walking through the warehouse or when away from the shop.
3.  **Real-Time Data**: A sale made on the laptop immediately updates the stock level visible on the phone.

## Login Instructions
1.  Open the application URL (see below).
2.  Enter your username and password.
3.  Click "Login" to access the dashboard.
    *   *Note: Contact the administrator for account creation or password resets.*

## Deployment URLs
*   **Frontend (App)**: `https://[YOUR-FRONTEND-URL].vercel.app` (Placeholder)
*   **Backend (API)**: `https://[YOUR-BACKEND-URL].onrender.com` (Placeholder)

## Environment Variables
The application requires the following environment variables to be set in your deployment settings.

### Backend (Render/Railway)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `SECRET_KEY` | Flask session security key | `supersecretkey123` |
| `JWT_SECRET_KEY` | Key for signing login tokens | `anothersecretkey456` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@host/db` |
| `FRONTEND_URL` | URL of the deployed React App | `https://your-app.vercel.app` |

### Frontend (Vercel)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL of the deployed Backend API | `https://your-api.onrender.com` |

## Local Development (Technicals)
*   **Database**: Uses SQLite (`tiles.db`) automatically when running locally.
*   **Backend**: Flask (Python). Run with `python app.py`.
*   **Frontend**: React (Vite). Run with `npm run dev`.

## Future Features (Planned)
*   Advanced sales analytics and profit tracking.
*   PDF Invoice generation.
*   Role-based permissions (Admin vs Staff).
*   Desktop installable app (PWA).

---
*Built for the family business.*
