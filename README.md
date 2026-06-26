# 🌍 GlobeTrek Adventures

A full-stack web application for a travel and tourism management company. This platform allows customers to browse, book, and manage travel packages, while staff and administrators can manage content and operations efficiently.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [License](#license)

---

## ✨ Features

### 👤 Customers / Travelers
- User registration and authentication
- Browse travel packages with search and filter functionality
- View detailed package information with image gallery
- Book packages with date and traveler selection
- View booking history in personal dashboard
- Submit inquiries to travel administration

### 👨‍💼 Travel Agency Staff
- Manage package details
- Confirm and manage bookings
- Coordinate with hotels and transport providers
- Respond to customer inquiries

### 👑 Administrators
- Manage staff accounts
- Oversee booking process
- Generate sales and customer reports
- Add and manage travel packages
- Ensure secure handling of user data

### General Features
- Responsive design (mobile, tablet, desktop)
- Secure user authentication with session management
- Password hashing with bcrypt
- Error handling and validation
- Email notifications (forgot password)
- Modern and attractive UI with smooth animations

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **dotenv** - Environment variables
- **nodemailer** - Email functionality (for password reset)

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling and animations
- **JavaScript (ES6)** - Interactivity
- **Font Awesome** - Icons
- **Google Fonts (Inter)** - Typography

### Development Tools
- **nodemon** - Auto-restart during development
- **MySQL Workbench** - Database management

---

## 📁 Project Structure
![alt text](image.png)

## 🔐 Environment Variables
Create a .env file in the root directory with the following variables:

env
### Server Configuration
- PORT=3000
- SESSION_SECRET=your_secure_session_secret_key

### Database Configuration
- DB_HOST=localhost
- DB_PORT=3306
- DB_USER=root
- DB_PASSWORD=your_database_password
- DB_NAME=globetrek_db

### Email Configuration (for password reset)
- EMAIL_USER= your_email@gmail.com
- EMAIL_PASS= your_app_password

## 🙏 Acknowledgments
- Unsplash for free stock images
- Font Awesome for icons
- Google Fonts for typography