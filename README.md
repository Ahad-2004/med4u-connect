# Med4U Connect - Modern Healthcare Connectivity Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://vercelbadge.vercel.app/api/med4u/med4u-connect)](https://vercel.com/med4u/med4u-connect)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-9.22.0-FFCA28?logo=firebase)](https://firebase.google.com/)

Med4U Connect is a modern, secure, and scalable healthcare platform that connects doctors with patient medical records, enabling seamless access to medical history, lab reports, and treatment plans.

## 🚀 Features

- **Secure Patient Data Management**
  - HIPAA-compliant data storage
  - Role-based access control
  - End-to-end encrypted communications

- **Intuitive Doctor Dashboard**
  - Patient overview with key metrics
  - Real-time medical records access
  - Quick search and filtering

- **Efficient Report Management**
  - Upload and categorize medical reports
  - Sort and filter patient history
  - Secure file storage with access logs

- **Modern UI/UX**
  - Responsive design for all devices
  - Dark/Light mode support
  - Accessible (WCAG 2.1 compliant)

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + Custom Components
- **State Management**: Context API + useReducer
- **Routing**: React Router v6
- **UI Components**: Custom Design System
- **Icons**: Lucide Icons

### Backend
- **Runtime**: Node.js (Vercel Edge Runtime)
- **Authentication**: Firebase Authentication
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Hosting**: Vercel (Serverless)
- **API**: RESTful + Serverless Functions

## 🏗 Project Structure

```
med4u-connect/
├── frontend/               # Frontend React application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── assets/        # Images, fonts, etc.
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── styles/        # Global styles
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   └── ...
├── api/                   # Serverless API functions
├── public/                # Public assets
└── vercel.json            # Vercel configuration
```

## 🔒 Security

- **Authentication**: JWT-based authentication with Firebase
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Compliance**: HIPAA-ready architecture
- **Audit**: Comprehensive logging of all access and changes


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


<div align="center">
  Made with ❤️ by Med4U Team
</div>
