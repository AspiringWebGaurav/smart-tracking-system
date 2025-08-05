# Gaurav's Portfolio - Smart Visitor Tracking System

A modern, optimized portfolio website with an advanced Smart Visitor Tracking System built using Next.js, Firebase, and TypeScript.

## 🚀 Features

### Core Portfolio
- **Modern Design**: Clean, responsive design with dark theme
- **Performance Optimized**: Fast loading with optimized assets
- **Interactive Components**: Smooth animations and transitions
- **Mobile Responsive**: Perfect experience across all devices

### Smart Visitor Tracking System
- **Real-time Visitor Monitoring**: Track visitors with persistent UUIDs
- **Device Fingerprinting**: Advanced device detection and duplicate prevention
- **Privacy Compliant**: GDPR-friendly with opt-out functionality
- **Admin Dashboard**: Comprehensive visitor management interface
- **Ban/Unban System**: Real-time visitor access control
- **Appeal System**: Contact form for banned users to appeal

### Admin Features
- **Secure Authentication**: JWT-based admin login system
- **Real-time Dashboard**: Live visitor statistics and management
- **Bulk Operations**: Multi-select ban/unban functionality
- **Appeal Management**: Review and process user appeals
- **Responsive Interface**: Mobile-friendly admin panel

## 🛠 Technology Stack

- **Frontend**: Next.js 15.3.2, React 19, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: Firebase Firestore
- **Authentication**: JWT with HTTP-only cookies
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Notifications**: Enhanced React Toastify
- **Device Detection**: Custom fingerprinting system

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore enabled

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gaurav-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin SDK (Service Account Key - all on one line)
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_super_secret_jwt_key

   # Optional
   ADMIN_EMAIL=admin@example.com
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

4. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Generate a service account key
   - Set up Firestore security rules (see below)

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Admin Access

### Default Credentials
- **Admin ID**: `gaurav`
- **Password**: `1234`

### Admin Dashboard
- Access: `/admin`
- Login: `/admin/login`
- Features:
  - Visitor management
  - Real-time statistics
  - Ban/unban functionality
  - Appeal management

## 🔥 Firebase Setup

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Visitors collection - read/write for authenticated users
    match /visitors/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
    
    // Ban appeals collection - read/write for authenticated users
    match /ban_appeals/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

### Required Collections
The system will automatically create these collections:
- `visitors` - Stores visitor data and status
- `ban_appeals` - Stores user appeals for ban reviews

## 📱 Usage

### For Visitors
1. **Automatic Tracking**: Visitors are automatically tracked on first visit
2. **Privacy Notice**: Users can opt-out of tracking
3. **Ban Appeals**: Banned users can submit appeals via the ban page

### For Admins
1. **Login**: Access `/admin/login` with credentials
2. **Dashboard**: View visitor statistics and manage users
3. **Ban/Unban**: Select visitors and perform bulk operations
4. **Appeals**: Review and approve/reject user appeals

## 🎯 Key Components

### Visitor Tracking
- [`VisitorTracker.tsx`](components/VisitorTracker.tsx) - Main tracking component
- [`visitorTracking.ts`](utils/visitorTracking.ts) - Core utilities
- [`EnhancedBanGate.tsx`](components/EnhancedBanGate.tsx) - Access control

### Admin System
- [`AdminDashboard`](app/admin/page.tsx) - Main admin interface
- [`AdminLogin`](app/admin/login/page.tsx) - Authentication
- [`adminAuth.ts`](utils/adminAuth.ts) - Auth utilities

### Real-time Features
- [`EnhancedVisitorStatusWatcher.tsx`](components/EnhancedVisitorStatusWatcher.tsx) - Status monitoring
- [`ToastSystem.tsx`](components/ToastSystem.tsx) - Enhanced notifications

## 🔒 Security Features

### Data Protection
- No personal information stored
- Device fingerprinting only
- Secure JWT authentication
- HTTP-only cookies
- CSRF protection

### Privacy Compliance
- Opt-out mechanism
- Do Not Track support
- Transparent privacy notice
- Data minimization

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Configure environment variables
4. Set up SSL certificates

## 📊 Monitoring

### Built-in Analytics
- Visitor counts and statistics
- Ban/unban rates
- Appeal success rates
- Real-time status monitoring

### Error Tracking
- Client-side error monitoring
- Server-side error logging
- Database operation tracking
- Authentication failure alerts

## 🛠 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run release      # Create new release
```

### Project Structure
```
├── app/                 # Next.js app directory
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API routes
│   ├── ban/            # Ban page
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── ui/            # UI components
│   └── ...            # Feature components
├── lib/               # Library configurations
├── utils/             # Utility functions
├── data/              # Static data
└── public/            # Static assets
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify environment variables
   - Check Firebase project configuration
   - Ensure Firestore is enabled

2. **Admin Login Problems**
   - Check JWT_SECRET configuration
   - Verify hardcoded credentials
   - Clear browser cookies

3. **Visitor Tracking Not Working**
   - Check browser localStorage support
   - Verify Firebase client configuration
   - Check network connectivity

4. **Real-time Updates Failing**
   - Verify Firestore listeners
   - Check browser console for errors
   - Ensure proper Firebase rules

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed console logging
- Visitor status indicator
- Enhanced error messages

## 📈 Performance Optimization

### Implemented Optimizations
- Lazy loading of components
- Optimized Firebase queries
- Efficient caching strategies
- Minimized bundle size
- Image optimization

### Monitoring Tools
- Next.js built-in analytics
- Firebase performance monitoring
- Custom error tracking
- Real-time performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for the backend infrastructure
- Tailwind CSS for the styling system
- React Hook Form for form management
- All open-source contributors

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact via the portfolio contact form
- Email: [your-email@example.com]

---

**Built with ❤️ by Gaurav**

*A modern portfolio with intelligent visitor management*
