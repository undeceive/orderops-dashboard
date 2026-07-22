# OrderOps Dashboard

OrderOps Dashboard is a full-stack marketplace operations dashboard for tracking products, orders, marketplace listings, CSV imports, and sync issues across e-commerce channels.

The project is inspired by real e-commerce workflow problems, such as keeping product listings, inventory, prices, and images consistent across platforms like Walmart, Shopify, Amazon, eBay, Zoro, TopDawg, and Temu.

## Purpose

The goal of OrderOps is to give a business a central place to review marketplace problems before they affect customers or daily operations.

The dashboard helps identify:

- Price mismatches
- Inventory mismatches
- Missing product images
- Active listings with no stock
- Marketplace orders ready to ship
- Listing records that need review

## Tech Stack

Frontend:

- React
- Vite
- JavaScript
- CSS

Backend:

- Node.js
- Express
- SQLite
- Multer
- csv-parser

Tools:

- Git
- GitHub
- Linux
- Bash
- npm

## Features

- Full-stack React and Express application
- SQLite database for local data storage
- Products API
- Orders API
- Marketplace listings API
- Sync issues API
- Dashboard stat cards
- Products table
- Orders panel
- Marketplace listings panel
- Sync issues panel
- Mark Resolved button for issues
- CSV import endpoint
- Frontend CSV upload panel
- Automatic issue detection during CSV import
- Duplicate prevention when importing the same CSV multiple times
- Project board roadmap

## CSV Import

OrderOps supports importing marketplace listing data from a CSV file.

The CSV importer can:

- Create or update products by SKU
- Create or update marketplace listings
- Detect price mismatches
- Detect inventory mismatches
- Detect missing images
- Detect active listings with no stock
- Prevent duplicate open issues from repeated imports

Required CSV headers:

sku, product_name, brand, category, base_price, inventory_count, marketplace, marketplace_sku, listing_url, listing_price, listing_inventory, listing_status, image_status

Example CSV row:

HYW-TEST-001, Test Welding Product, HYW, Welding Supplies, 29.99, 12, Walmart, HYW-TEST-001-WM, https://marketplace.example.com/walmart/HYW-TEST-001, 31.99, 10, Active, Valid

## API Endpoints

Health:

- GET /api/health

Products:

- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

Orders:

- GET /api/orders
- GET /api/orders/:id
- POST /api/orders

Marketplace Listings:

- GET /api/listings
- POST /api/listings

Sync Issues:

- GET /api/sync-issues
- POST /api/sync-issues
- PATCH /api/sync-issues/:id/resolve

CSV Import:

- POST /api/import/listings

## Running Locally

Clone the repo:

git clone git@github.com:undeceive/orderops-dashboard.git

Go into the project:

cd orderops-dashboard

Install and run the backend:

cd backend
npm install
npm run dev

In a second terminal, install and run the frontend:

cd frontend
npm install
npm run dev

The backend runs on:

http://localhost:5000

The frontend runs on the Vite URL shown in the terminal, usually:

http://localhost:5173

## Sample CSV

A sample CSV file is included at:

sample-data/walmart-listings.csv

You can upload it through the dashboard CSV import panel.

## Project Roadmap

See PROJECT_BOARD.md.

## Notes

This project currently uses sample data and local SQLite storage. It does not connect to real company marketplace accounts yet.

Future versions could add real integrations for Shopify, Amazon, eBay, Walmart Marketplace, Zoro, TopDawg, and Temu.
