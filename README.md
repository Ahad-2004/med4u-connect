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

## 🚀 Getting Started

### Prerequisites

- Node.js 16.14.0 or later
- npm 8.5.0 or later
- Firebase CLI (for deployment)
- Vercel CLI (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/med4u-connect.git
   cd med4u-connect
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   
   # API Configuration
   VITE_API_URL=your-api-url
   ```

4. **Run the development server**
   ```bash
   # From the frontend directory
   cd frontend
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

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

## 📦 Deployment

### Vercel Deployment

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   # From the project root
   vercel
   ```

3. **Set up environment variables** in the Vercel dashboard

### Manual Deployment

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the API**
   ```bash
   cd api
   npm run deploy
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For support or queries, please contact [support@med4u.com](mailto:support@med4u.com)

---

<div align="center">
  Made with ❤️ by Med4U Team
</div>
