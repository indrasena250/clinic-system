# 🏥 Clinic Management System

<div align="center">

[![Status](https://img.shields.io/badge/Status-Active-brightgreen)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/License-ISC-yellow)]()
[![Node](https://img.shields.io/badge/Node-v18+-green)]()
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react)]()

**A comprehensive full-stack clinic management system designed to streamline healthcare operations**

[🌐 Live Demo](https://clinic-system-tau.vercel.app) • [📖 Documentation](#documentation) • [🚀 Quick Start](#-quick-start)

</div>

---

## ✨ Overview

**Clinic Management System** is a modern, feature-rich web application designed for healthcare clinics to efficiently manage patient records, diagnostic reports, billing operations, and referral tracking. The system provides a seamless experience for clinic staff to handle daily operations with real-time data synchronization and comprehensive reporting capabilities.

---

## 🎯 Key Features

### 👥 Patient Management
- **Comprehensive Patient Records** - Detailed patient profiles with contact information, medical history, and demographics
- **Multi-Scan Support** - Add multiple diagnostic scans for the same patient across different categories
- **Patient Deduplication** - Automatic duplicate detection and merging by mobile number and name
- **Advanced Search** - Quick patient lookup with filters and sorting
- **Edit & Update** - Modify patient information with full form validation

### 📋 Diagnostic Management
- **CT Scans** - Track and manage CT scan procedures and results
- **Ultrasound** - Handle ultrasound procedures with detailed documentation
- **Multiple Scan Categories** - Support for various diagnostic scan types
- **Scan Status Tracking** - Monitor scan completion and reporting status
- **Dynamic Scan Addition** - Add or remove scans on-the-fly with automatic calculations

### 💰 Financial Management
- **Billing System** - Create and manage patient invoices
- **Income Tracking** - Record and categorize clinic income
- **Expense Management** - Track daily clinic expenses
- **Settlement Reports** - Generate comprehensive financial settlement reports
- **Financial Analytics** - View income/expense trends and summaries

### 📊 Reporting & Analytics
- **Patient Reports** - Generate detailed diagnostic reports (PDF export)
- **Financial Reports** - Settlement and income reports with date ranges
- **Counter Management** - Track patient counts and clinic metrics
- **Data Exports** - Export reports in PDF format for record-keeping
- **Activity Tracking** - Monitor system activities and transactions

### 🔐 Security & Access Control
- **JWT Authentication** - Secure user login with token-based authentication
- **Role-Based Access Control** - Different user roles with specific permissions
- **Firebase Integration** - Optional Firebase authentication support
- **Password Security** - Bcrypt-based password hashing
- **Rate Limiting** - API request throttling for security

### 🏢 Multi-Clinic Support
- **Multiple Clinic Management** - Manage multiple clinic branches
- **Clinic-Specific Data** - Isolate data per clinic with proper access control
- **Centralized Dashboard** - Overview of all clinic operations

### 🔔 Additional Features
- **Real-time Updates** - Live data synchronization
- **Responsive Design** - Mobile-friendly interface with Material-UI
- **Cloud Storage** - Cloudinary integration for document management
- **Email Notifications** - Nodemailer-based notification system
- **Comprehensive Logging** - Error tracking and activity logs

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks and functional components
- **Vite** - Lightning-fast build tool and dev server
- **Material-UI (MUI)** - Professional component library
- **React Router** - Client-side routing
- **React Hook Form** - Efficient form state management
- **Axios** - HTTP client for API communication
- **Yup** - Schema validation
- **Firebase** - Authentication and cloud services
- **Dayjs** - Date/time manipulation
- **jsPDF** - PDF generation
- **React Confetti** - UI enhancements

### Backend
- **Node.js & Express** - RESTful API server
- **MySQL2** - Relational database
- **Bcrypt** - Password hashing
- **JWT (jsonwebtoken)** - Authentication tokens
- **Cloudinary** - Image and file storage
- **Multer** - File upload handling
- **PDFKit** - PDF generation
- **Nodemailer** - Email service
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Validator** - Input validation

---

## 📁 Project Structure

```
clinic-system/
├── frontend/                    # React application
│   ├── src/
│   │   ├── api/                # API endpoints
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   │   ├── patients/       # Patient management
│   │   │   ├── finance/        # Financial management
│   │   │   ├── reports/        # Reporting
│   │   │   ├── referrals/      # Referral tracking
│   │   │   ├── settings/       # Configuration
│   │   │   └── Dashboard.jsx   # Main dashboard
│   │   ├── context/            # React context
│   │   ├── hooks/              # Custom hooks
│   │   ├── layouts/            # Layout components
│   │   ├── theme/              # MUI theme config
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Node.js/Express server
│   ├── routes/                 # API routes
│   ├── controllers/            # Route handlers
│   ├── services/               # Business logic
│   ├── middleware/             # Express middleware
│   ├── config/                 # Configuration files
│   ├── scripts/                # Database scripts
│   ├── docs/                   # API documentation
│   ├── server.js              # Entry point
│   └── package.json
│
├── Database Scripts/           # SQL migrations
│   ├── MULTIPLE_SCANS_MIGRATION.sql
│   ├── SETTLEMENTS_MIGRATION.sql
│   ├── DATABASE_SETUP.md
│   └── ...other migrations
│
└── Documentation/              # Project documentation
    ├── README.md              # This file
    ├── DATABASE_SETUP.md      # Database configuration
    └── ...other docs
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and npm
- **MySQL** 8.0+
- **.env file** with configuration (see [Configuration](#-configuration))

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server (uses nodemon for auto-reload)
npm start

# Or run directly with node
node server.js
```

The frontend will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:8080` (or your configured port)

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=clinic_system
DB_PORT=3306

# Server Configuration
PORT=8080
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Optional - Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Firebase Configuration (Optional)
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id
```

### Database Setup

1. **Create Database:**
   ```sql
   CREATE DATABASE clinic_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Run Migrations:**
   - Check `DATABASE_SETUP.md` for detailed migration instructions
   - Execute SQL files in the root directory:
     - `MULTIPLE_SCANS_MIGRATION.sql` - For multiple scan support
     - `SETTLEMENTS_MIGRATION.sql` - For financial settlements
     - Other migration files as needed

3. **Verify Connection:**
   ```bash
   cd backend
   node check_database.js
   ```

---

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Patient Management
- `GET /api/patients` - Get all patients
- `POST /api/patients/add` - Add new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id` - Get patient details

### Financial Management
- `GET /api/finance/income` - Get income records
- `POST /api/finance/income` - Add income
- `GET /api/finance/expenses` - Get expense records
- `POST /api/finance/expenses` - Add expense
- `GET /api/settlements` - Get settlements
- `POST /api/settlements/generate` - Generate settlement report

### Reports
- `GET /api/reports/patient/:id` - Get patient report
- `POST /api/reports/generate-pdf` - Generate PDF report
- `GET /api/counter` - Get counter metrics

### Additional Routes
- Clinic management
- Referral tracking
- Demo functionality for testing

---

## 🗄️ Database Schema Highlights

### Key Tables
- **unique_patients** - Patient master data
- **patient_scans** - Individual diagnostic scans
- **patients_view** - View for backward compatibility
- **income** - Income records
- **expenses** - Daily expenses
- **settlements** - Financial settlements
- **users** - User accounts and authentication
- **clinics** - Clinic branch information

---

## 🔧 Development Workflow

### Hot Reload
- **Frontend:** Vite provides instant hot module replacement (HMR)
- **Backend:** Nodemon automatically restarts on file changes

### Debugging
- Use browser DevTools for frontend debugging
- Check backend logs in terminal output
- Check database logs in MySQL workbench/console

### Testing
```bash
# Backend test files (if added)
node test_demo.js
node test_multiclinic.js

# Database checks
node check_database.js
node check_clinics.js
```

---

## 📚 Additional Documentation

- **[Database Setup Guide](./DATABASE_SETUP.md)** - Detailed database configuration and migrations
- **[Demo Features Guide](./DEMO_FEATURE_README.md)** - Testing and demo functionality
- **[Multi-Clinic Setup](./README.md)** - Managing multiple clinic branches

---

## 🔒 Security Features

✅ JWT-based authentication
✅ Password hashing with bcrypt
✅ Rate limiting on API endpoints
✅ Helmet.js for security headers
✅ CORS protection
✅ Input validation with express-validator
✅ SQL injection prevention via parameterized queries
✅ Role-based access control

---

## 🚀 Deployment

### Frontend Deployment (Vercel)
The frontend is configured for Vercel deployment with `vercel.json`:

```bash
npm run build
# Deploy to Vercel
vercel
```

### Backend Deployment
Deploy backend to your preferred hosting:
- Heroku
- AWS EC2
- DigitalOcean
- Railway
- Render.com

Ensure environment variables are set in your hosting platform.

---

## 📝 Features by Module

| Module | Features |
|--------|----------|
| **Patients** | Add, Edit, Delete, Search, Multiple Scans, Medical History |
| **Diagnostics** | CT Scans, Ultrasound, Scan Tracking, Report Generation |
| **Finance** | Income, Expenses, Settlements, Financial Reports |
| **Reports** | Patient Reports, Financial Reports, PDF Export |
| **Settings** | User Management, Clinic Configuration, Role Management |
| **Referrals** | Referral Tracking, Referral Status, Referral History |

---

## 🐛 Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
- Run `node check_database.js` to test connection
- Check `FIX_SETTLEMENTS_TABLE.sql` if encountering table schema errors

### API 401 Errors
- Ensure JWT token is valid
- Check token expiration
- Verify API headers include `Authorization: Bearer <token>`

### File Upload Issues
- Verify Cloudinary credentials in `.env`
- Check file size limits in multer configuration
- Ensure user has `uploads` folder permissions

### Port Already in Use
```bash
# Kill process using the port (Windows)
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or use different port in .env
```

---

## 📞 Support & Contact

For issues, bugs, or feature requests:
- Check existing documentation in the docs folder
- Review SQL migration files for database issues
- Check backend logs for error messages
- Verify configuration in `.env` file

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 🎉 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines
1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Test thoroughly before submitting
4. Update documentation as needed
5. Submit a pull request with detailed description

---

## 📈 Project Status

- ✅ Patient Management - Complete
- ✅ Diagnostic Tracking - Complete
- ✅ Financial Management - Complete
- ✅ Multi-Clinic Support - Complete
- ✅ Settlement Reports - Complete
- ✅ Authentication & Security - Complete
- 🔄 Continuous Improvement - Ongoing

---

<div align="center">

**Made with ❤️ for healthcare clinics**

[⬆ Back to top](#-clinic-management-system)

</div>
