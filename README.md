## Project title: AGROCHAIN
Digital Agriculture Supply Chain Platform

## Group ID: 08

## SPOC
* **Name:** B. Srimanreddy Bommireddy
* **Roll No:** S20230010049
* **Email:** srimanreddy.b23@iiits.in

## Team members & roles

Based on the project files, the work distribution is as follows:

* **B. Sriman** (S20230010049, srimanreddy.b23@iiits.in)
    * **Modules:** Signup, Login, Farmer Dashboard
    * **Responsibilities:** Implemented the core user-facing authentication and the complete Farmer dashboard.

* **A. Palvash kumar** (S20230010029, palvashkumar.a23@iiits.in) & **A. Anoop** (S20230010021, anoop.a23@iiits.in)
    * **Module:** Dealer Dashboard
    * **Responsibilities:** Co-developed the Dealer dashboard functionality.

* **B. Vishwesh** (S20230010048, vishwesh.b23@iiits.in)
    * **Module:** Retailer Dashboard
    * **Responsibilities:** Developed the entire Retailer dashboard, enabling retailers to browse and purchase inventory from dealers.

* **DHARAVATH OMSAI** (S20230010070, omsai.d23@iiits.in)
    * **Module:** Admin Dashboard
    * **Responsibilities:** Built the Admin dashboard for system analytics, user management, and activity logging.

## How to run (local)

### Prerequisites

**Backend:**
* **Node.js** (v18.0 or later recommended)
* **npm** (comes with Node.js)
* **MongoDB**: A running instance of MongoDB (local or a cloud service like MongoDB Atlas). The connection string is required.
* **Nodemon** (optional, for automatic server restarts): `npm install -g nodemon`

**Frontend:**
* A modern web browser (e.g., Google Chrome, Firefox).
* A local web server (like VS Code's "Live Server" extension) is recommended to avoid CORS issues.

### Steps

**1. Backend Setup**
   1.  Navigate to the `/source/backend` directory.
   2.  Create a `.env` file in this directory and add the following environment variables, replacing the placeholders with your actual credentials:
       ```
       PORT=3000
       MONGO_URI=<your-mongodb-connection-string>
       EMAIL_USER=<your-gmail-address>
       EMAIL_PASS=<your-gmail-app-password>
       GOOGLE_CLIENT_ID=<your-google-client-id>
       CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
       CLOUDINARY_API_KEY=<your-cloudinary-api-key>
       CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
       ```
   3.  Install the required dependencies from `package.json`:
       ```bash
       npm install
       ```
   4.  Start the server. For a single run:
       ```bash
       node index.js
       ```
       Or, if you have `nodemon` installed for development:
       ```bash
       nodemon index.js
       ```
   5. The backend API will be running at `http://localhost:3000`.

**2. Frontend Setup**
   1.  Navigate to the `/source/frontend/pages` directory.
   2.  Open the `home.html` file in your web browser. Using a live server is recommended.

## Key files and functions

### Backend (`/source/backend`)

* **`controllers/authcontroller.js`**: (Sriman) Manages user authentication, including sending/verifying OTPs for email login and handling Google Sign-In verification.
* **`controllers/farmercontroller.js`**: (Sriman) Manages all logic for farmer-specific actions like adding/updating crops, managing orders, and handling bids. This is a dynamic file that handles form data and file uploads (images) for crops.
* **`controllers/dealercontroller.js`**: (Palvash & Anoop) Contains the logic for dealers, including browsing products, assigning vehicles to orders, placing bids, submitting reviews, and managing their own inventory for retailers.
* **`controllers/retailercontroller.js`**: (Vishwesh) Handles retailer functionalities like viewing dealer inventories, placing multi-item orders, and processing payments. This file contains the API logic for the retailer dashboard.
* **`controllers/admincontroller.js`**: (Omsai) Powers the admin dashboard by providing aggregated system analytics, user data, and activity logs.
* **`models/user.js`**: Defines the Mongoose schema for all user roles (Farmer, Dealer, Retailer, Admin). It includes role-specific sub-documents like `crops` for farmers and `vehicles`/`inventory` for dealers.
* **`models/order.js`**: Defines the schema for orders placed by dealers to farmers, tracking quantities, bidding status, and vehicle assignments.
* **`models/retailerOrder.js`**: Defines the schema for orders placed by retailers to dealers.

### Frontend (`/source/frontend`)

* **`assets/js/signup.js`** & **`assets/js/login.js`**: (Sriman) These files handle the multi-step registration and login processes. They interact with the backend auth APIs for OTP and Google verification.
* **`assets/js/farmer.js`**: (Sriman) Contains all the client-side JavaScript for the Farmer Dashboard. It handles fetching and displaying inventory, submitting the "Add Crop" form, managing orders, and interacting with the bidding system.
* **`assets/js/dealer.js`**: (Palvash & Anoop) Powers the Dealer Dashboard. This script manages browsing products, adding items to a local cart, assigning vehicles, placing bids, and managing inventory.
* **`assets/js/retailer.js`**: (Vishwesh) Manages the Retailer Dashboard. It fetches and displays inventory from dealers, handles the shopping cart, and manages the checkout process and order history.
* **`assets/js/admin.js`**: (Omsai) Contains the logic for the Admin Dashboard, fetching data from the admin controller and rendering charts and tables for system monitoring.
* **`pages/farmer.html`**, **`pages/dealer.html`**, **`pages/retailer.html`**, **`pages/admin.html`**: These are the main dashboard pages for each user role, containing the HTML structure for their respective functionalities.

## Demo link 
* **Video URL:** `https://youtu.be/zIYFFIzLRjs`

## Evidence locations
* **Network Evidence:** `\git-logs.txt`
* **Git Logs:** `\git-logs.txt`
* **Database Schema:** The Mongoose schemas are defined in the`\source\AGROCHAIN\backend\models` directory, particularly in `user.js`, `order.js`, and `retailerOrder.js`.  
