# InventoryHub - Full-Stack Node.js, Express & MongoDB (NoSQL) Application

A production-ready, full-stack Web Application designed to interact with a NoSQL database (**MongoDB**) through a **Node.js** and **Express.js** backend. Features a complete RESTful CRUD API, robust input validation and error handling, an interactive browser UI, an automated Postman test collection, and multi-platform cloud deployment configurations.

---

## Table of Contents
1. [Architecture & Tech Stack](#architecture--tech-stack)
2. [Step 1: MongoDB Database & Collection Setup](#step-1-mongodb-database--collection-setup)
3. [Step 2: Project Setup & Installation](#step-2-project-setup--installation)
4. [Step 3: Connecting Node.js to MongoDB (Mongoose)](#step-3-connecting-nodejs-to-mongodb-mongoose)
5. [Step 4: CRUD REST API Specification](#step-4-crud-rest-api-specification)
6. [Step 5: Validation & Error Handling](#step-5-validation--error-handling)
7. [Step 6: Testing with Browser & Postman](#step-6-testing-with-browser--postman)
8. [Step 7: Cloud Deployment Guide (Render, Railway, Docker)](#step-7-cloud-deployment-guide)

---

## Architecture & Tech Stack

```
                        ┌──────────────────────────────────────────────────┐
                        │             Client / Consumer Layer              │
                        │   • Web Browser (HTML5 / Tailwind / Vanilla JS)  │
                        │   • Postman / cURL API Clients                   │
                        └─────────────────────────┬────────────────────────┘
                                                  │ HTTP Requests (JSON)
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │         Node.js & Express.js Backend             │
                        │   • Helmet & CORS Security Headers               │
                        │   • express-validator Input Sanitization         │
                        │   • Controllers & Route Handlers                 │
                        │   • Centralized Error Middleware (400, 404, 500) │
                        └─────────────────────────┬────────────────────────┘
                                                  │ Mongoose ODM
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │           MongoDB (NoSQL Database)               │
                        │   • Database: inventory_db                       │
                        │   • Collection: products                         │
                        │   • Schemas, Validations, Aggregation Pipelines  │
                        └──────────────────────────────────────────────────┘
```

- **Runtime Environment:** Node.js (v22+)
- **Backend Framework:** Express.js (v5)
- **Database & ODM:** MongoDB & Mongoose (v9)
- **Validation Engine:** `express-validator` & Mongoose Schema Validators
- **Frontend Client:** Responsive HTML5 Dashboard with Tailwind CSS & FontAwesome
- **API Testing:** Postman Collection v2.1 (`postman_collection.json`)
- **Containerization & Deployment:** Dockerfile, `render.yaml`

---

## Step 1: MongoDB Database & Collection Setup

You can use either a **Free Cloud MongoDB Atlas cluster** (recommended for production & deployment) or a **Local MongoDB instance**.

### Option A: MongoDB Atlas (Cloud - Recommended)
1. Navigate to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Click **Build a Database** and select the free **M0 Shared** cluster.
3. Under **Security Quickstart**:
   - Create a database user (e.g. username: `admin`, generate a secure password).
   - Add IP Access List: Click **Add Current IP Address** (or `0.0.0.0/0` to allow access from any cloud hosting provider like Render).
4. Click **Connect** -> **Drivers** -> **Node.js**.
5. Copy your connection string:
   ```env
   mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/inventory_db?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your database user password and `inventory_db` as your target database name).*

### Option B: Local MongoDB
1. Ensure the MongoDB Community service is running on your machine:
   ```bash
   mongod --dbpath <data-path>
   ```
2. Your connection string will be:
   ```env
   mongodb://127.0.0.1:27017/inventory_db
   ```
*Note: In MongoDB, both the database (`inventory_db`) and the collection (`products`) are automatically created the moment the first document is inserted!*

---

## Step 2: Project Setup & Installation

Clone or open the project directory:
```bash
cd product-inventory-app
```

Install npm dependencies:
```bash
npm install
```

Configure your environment variables:
Create a `.env` file in the project root (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
```

Seed initial sample products (optional):
```bash
npm run seed
```

Start the application:
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```

The web dashboard is now accessible at **http://localhost:5000**.

---

## Step 3: Connecting Node.js to MongoDB (Mongoose)

Connection configuration is isolated in [`config/db.js`](file:///C:/Users/SDS/.gemini/antigravity/scratch/product-inventory-app/config/db.js):

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory_db';
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    return null;
  }
};
```

Key features:
- **Connection pooling & resilience:** Built-in connection event handlers (`disconnected`, `reconnected`).
- **Graceful timeout:** Configured `serverSelectionTimeoutMS: 5000` prevents process hangs if the database is unreachable.
- **Health monitoring:** Exposes `isDbConnected()` to let the frontend and `/api/health` know real-time database state.

---

## Step 4: CRUD REST API Specification

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Health check & database connection status | `200`, `503` |
| `GET` | `/api/products/stats/summary` | Aggregate inventory statistics via MongoDB Aggregation Pipeline | `200`, `503` |
| `GET` | `/api/products` | Retrieve all products (Supports pagination, search, category, status, and price filters) | `200` |
| `GET` | `/api/products/:id` | Retrieve single product by MongoDB ObjectId | `200`, `400`, `404` |
| `POST` | `/api/products` | Create a new product with full schema validation | `201`, `400`, `409` |
| `PUT` | `/api/products/:id` | Update product details | `200`, `400`, `404`, `409` |
| `PATCH` | `/api/products/:id/stock`| Quick stock increment / decrement / set | `200`, `400`, `404` |
| `DELETE` | `/api/products/:id` | Delete product by ID | `200`, `400`, `404` |

---

## Step 5: Validation & Error Handling

Input validation is enforced at two distinct layers:

1. **HTTP Request Layer (`express-validator`):**
   - Sanitizes and validates types before hitting controllers.
   - Rejects invalid data with `400 Bad Request` and structured field errors:
     ```json
     {
       "success": false,
       "error": "Input Validation Failed",
       "details": [
         { "field": "price", "message": "Price must be a positive number or zero." }
       ]
     }
     ```
2. **Database Layer (Mongoose Schema):**
   - Validates min/max length, required fields, and category/status enums.
   - Unique index on `sku` prevents duplicates (returns `409 Conflict`).
   - Handles malformed MongoDB ObjectIDs (`CastError`) cleanly as `400 Bad Request`.

---

## Step 6: Testing with Browser & Postman

### A. Testing Using Web Browser
1. Open your browser and navigate to `http://localhost:5000`.
2. **Dashboard Overview:** Notice the live DB Status pill in the navigation bar and real-time statistics (Total Products, Units in Stock, Low Stock alerts, Total Inventory Valuation).
3. **Create (C):** Click **Add Product**, fill out the modal form, and submit. The list updates instantly with a toast alert.
4. **Read (R):** Use the search bar, category dropdown, and status filter to query products dynamically.
5. **Update (U):** Click the edit icon on any row to change price, description, or stock. Use the quick `+` and `-` buttons in the table to test stock updates.
6. **Delete (D):** Click the trash icon, confirm in the safety modal, and verify the record is removed.

### B. Testing Using Postman
A complete pre-configured Postman collection is included in the project:
`postman_collection.json`.

1. Open **Postman**.
2. Click **Import** (top left) and select `postman_collection.json`.
3. The collection provides pre-configured requests under folders:
   - `1. Health & Diagnostics`
   - `2. Read Operations (GET)`
   - `3. Create Operations (POST)`
   - `4. Update Operations (PUT & PATCH)`
   - `5. Delete Operations (DELETE)`
4. **Automated Chaining:**
   - Run the **Create Product (Valid)** request. A test script automatically extracts the newly generated `_id` and saves it into the `{{productId}}` collection variable.
   - Subsequent requests (**Get By ID**, **Update**, **Delete**) immediately work with the created item without manual copy-pasting!
5. **Testing Edge Cases:**
   - Execute **Create Product (Validation Error)**: Confirms `400 Bad Request`.
   - Execute **Create Product (Duplicate SKU Conflict)**: Confirms `409 Conflict`.
   - Execute **Verify Product Is Deleted**: Confirms `404 Not Found`.

---

## Step 7: Cloud Deployment Guide

### Option 1: Deploy on Render.com (Recommended Free Tier)
1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: InventoryHub fullstack app"
   git remote add origin https://github.com/<your-username>/inventoryhub.git
   git push -u origin main
   ```
2. Log into [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Render will auto-detect settings from `render.yaml` or you can manually configure:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/inventory_db?retryWrites=true&w=majority`
6. Click **Deploy Web Service**. Once deployed, Render provides a live HTTPS URL (e.g., `https://inventoryhub-app.onrender.com`).

### Option 2: Deploy on Railway
1. Go to [Railway.app](https://railway.app) and click **New Project** -> **Deploy from GitHub repo**.
2. Add a **MongoDB** plugin on Railway or supply your MongoDB Atlas `MONGO_URI` under **Variables**.
3. Railway will build and deploy the Node.js application automatically.

### Option 3: Deploy with Docker
Build and run the container locally or on any cloud server:
```bash
# Build the Docker image
docker build -t inventoryhub-app .

# Run container with MongoDB connection
docker run -p 5000:5000 -e MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/inventory_db" inventoryhub-app
```
