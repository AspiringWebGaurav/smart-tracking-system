# 🛠️ Development Guide - Smart Visitor Tracking System

*Complete setup, development workflow, and best practices guide for developers*

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Standards](#code-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Deployment Process](#deployment-process)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

```bash
# Required versions
Node.js >= 18.17.0
npm >= 9.0.0
Git >= 2.30.0

# Verify installations
node --version
npm --version
git --version
```

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd gaurav-portfolio

# 2. Install dependencies
npm install

# 3. Environment setup
cp .env.example .env.local

# 4. Configure Firebase credentials (see Environment Configuration)
# Edit .env.local with your Firebase config

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

### Environment Configuration

Create `.env.local` with the following variables:

```bash
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Private)
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"

# Admin Authentication
ADMIN_JWT_SECRET=your_super_secure_random_string_minimum_32_characters

# Environment
NODE_ENV=development
```

---

## 🏗️ Development Environment

### Required Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **VS Code** | Primary IDE | [Download](https://code.visualstudio.com/) |
| **Node.js** | Runtime environment | [Download](https://nodejs.org/) |
| **Firebase CLI** | Firebase management | `npm install -g firebase-tools` |
| **Vercel CLI** | Deployment tool | `npm install -g vercel` |

### Recommended VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Firebase Setup

1. **Create Firebase Project**:
   ```bash
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init firestore
   ```

2. **Configure Firestore Rules**:
   ```javascript
   // firestore.rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /visitors/{document} {
         allow read, write: if true;
       }
       match /ban_appeals/{document} {
         allow read, write: if true;
       }
     }
   }
   ```

3. **Create Firestore Indexes**:
   ```json
   // firestore.indexes.json
   {
     "indexes": [
       {
         "collectionGroup": "visitors",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "status", "order": "ASCENDING" },
           { "fieldPath": "lastVisit", "order": "DESCENDING" }
         ]
       },
       {
         "collectionGroup": "ban_appeals",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "status", "order": "ASCENDING" },
           { "fieldPath": "submittedAt", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

---

## 📁 Project Structure

### Directory Organization

```
gaurav-portfolio/
├── app/                          # Next.js 13+ App Directory
│   ├── (routes)/                 # Route groups
│   │   ├── admin/               # Admin routes
│   │   │   ├── dashboard/       # Admin dashboard
│   │   │   ├── login/           # Admin login
│   │   │   └── page.tsx         # Admin redirect
│   │   ├── ban/                 # Ban page
│   │   └── page.tsx             # Home page
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin APIs
│   │   │   ├── login/           # Authentication
│   │   │   └── verify/          # Token verification
│   │   ├── visitors/            # Visitor management
│   │   │   ├── list/            # Visitor CRUD
│   │   │   ├── status/          # Status updates
│   │   │   └── track/           # Visitor tracking
│   │   └── contact/             # Contact/Appeals
│   │       └── ban-appeal/      # Appeal system
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   ├── admin/                   # Admin components
│   ├── tracking/                # Tracking components
│   ├── ToastSystem.tsx          # Notification system
│   ├── VisitorTracker.tsx       # Main tracker
│   ├── EnhancedBanGate.tsx      # Ban gate
│   └── EnhancedVisitorStatusWatcher.tsx
├── lib/                         # Core libraries
│   ├── firebase.ts              # Firebase client
│   ├── firebase-admin.ts        # Firebase admin
│   └── utils.ts                 # Utility functions
├── utils/                       # Business logic
│   ├── adminAuth.ts             # Admin authentication
│   ├── visitorTracking.ts       # Tracking logic
│   └── validation.ts            # Input validation
├── types/                       # TypeScript definitions
│   ├── visitor.ts               # Visitor types
│   ├── admin.ts                 # Admin types
│   └── api.ts                   # API types
├── docs/                        # Documentation
│   ├── README.md                # Main documentation
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── PROJECT_OVERVIEW.md
│   ├── TECHNICAL_SKILLS.md
│   └── DEVELOPMENT_GUIDE.md
├── public/                      # Static assets
├── .env.example                 # Environment template
├── .env.local                   # Local environment (gitignored)
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── .prettierrc                 # Prettier configuration
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── vercel.json                 # Vercel deployment config
```

### Key Files Explanation

| File/Directory | Purpose | Key Features |
|----------------|---------|--------------|
| **app/** | Next.js App Router | Server components, layouts, routing |
| **components/** | Reusable UI components | Modular, typed, documented |
| **lib/** | Core utilities and configs | Firebase, utilities, helpers |
| **utils/** | Business logic | Authentication, tracking, validation |
| **types/** | TypeScript definitions | Comprehensive type safety |
| **docs/** | Project documentation | Complete technical docs |

---

## 🔄 Development Workflow

### Branch Strategy

```bash
# Main branches
main          # Production-ready code
develop       # Integration branch
feature/*     # Feature development
hotfix/*      # Critical fixes
release/*     # Release preparation

# Example workflow
git checkout develop
git checkout -b feature/new-analytics-dashboard
# ... make changes ...
git add .
git commit -m "feat: add analytics dashboard with real-time charts"
git push origin feature/new-analytics-dashboard
# ... create pull request ...
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>[optional scope]: <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes
refactor: # Code refactoring
test:     # Adding tests
chore:    # Maintenance tasks

# Examples
feat(admin): add bulk visitor operations
fix(tracking): resolve UUID generation issue
docs(api): update authentication documentation
refactor(components): extract common UI patterns
```

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:debug        # Start with debugging enabled

# Building
npm run build            # Production build
npm run build:analyze    # Build with bundle analysis

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Deployment
npm run deploy           # Deploy to Vercel
npm run deploy:preview   # Deploy preview build
```

### Code Review Checklist

Before submitting a pull request:

- [ ] **Functionality**: Feature works as expected
- [ ] **Type Safety**: No TypeScript errors
- [ ] **Code Quality**: ESLint passes without warnings
- [ ] **Performance**: No performance regressions
- [ ] **Security**: No security vulnerabilities introduced
- [ ] **Testing**: Tests added for new functionality
- [ ] **Documentation**: Updated relevant documentation
- [ ] **Accessibility**: WCAG compliance maintained

---

## 📏 Code Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types and interfaces
interface VisitorData {
  uuid: string;
  status: 'active' | 'banned';
  metadata: VisitorMetadata;
}

// ✅ Good: Generic functions with constraints
function processVisitorData<T extends VisitorData>(
  data: T,
  processor: (item: T) => void
): void {
  processor(data);
}

// ❌ Bad: Using 'any' type
function processData(data: any): any {
  return data.someProperty;
}

// ✅ Good: Type guards
function isVisitor(data: unknown): data is Visitor {
  return (
    typeof data === 'object' &&
    data !== null &&
    'uuid' in data &&
    'status' in data
  );
}
```

### React Component Standards

```typescript
// ✅ Good: Proper component structure
interface VisitorCardProps {
  visitor: Visitor;
  onStatusChange: (uuid: string, status: VisitorStatus) => void;
  className?: string;
}

export const VisitorCard: React.FC<VisitorCardProps> = ({
  visitor,
  onStatusChange,
  className
}) => {
  const handleStatusToggle = useCallback(() => {
    const newStatus = visitor.status === 'active' ? 'banned' : 'active';
    onStatusChange(visitor.uuid, newStatus);
  }, [visitor.uuid, visitor.status, onStatusChange]);

  return (
    <div className={cn('visitor-card', className)}>
      {/* Component content */}
    </div>
  );
};

// ✅ Good: Custom hooks
export const useVisitorManagement = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);

  const updateVisitorStatus = useCallback(async (
    uuid: string, 
    status: VisitorStatus
  ) => {
    setLoading(true);
    try {
      await updateVisitorStatusAPI(uuid, status);
      setVisitors(prev => 
        prev.map(v => v.uuid === uuid ? { ...v, status } : v)
      );
    } catch (error) {
      console.error('Failed to update visitor status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { visitors, loading, updateVisitorStatus };
};
```

### API Route Standards

```typescript
// ✅ Good: Proper API route structure
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const UpdateVisitorSchema = z.object({
  uuid: z.string().uuid(),
  status: z.enum(['active', 'banned']),
  reason: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate input
    const body = await req.json();
    const validatedData = UpdateVisitorSchema.parse(body);

    // Authentication check
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Business logic
    const result = await updateVisitorStatus(validatedData);

    // Success response
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 422 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### CSS/Styling Standards

```css
/* ✅ Good: Utility-first with Tailwind */
.admin-dashboard {
  @apply min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900;
}

.glassmorphism-card {
  @apply backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl;
  @apply hover:bg-white/10 transition-all duration-300;
}

/* ✅ Good: Responsive design */
.visitor-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
  @apply gap-4 md:gap-6;
}

/* ✅ Good: Custom animations */
@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.online-indicator {
  @apply w-3 h-3 bg-green-400 rounded-full;
  animation: pulse-glow 2s infinite;
}
```

---

## 🧪 Testing Guidelines

### Testing Structure

```
tests/
├── __mocks__/                   # Mock implementations
│   ├── firebase.ts              # Firebase mocks
│   └── next-router.ts           # Next.js router mocks
├── components/                  # Component tests
│   ├── VisitorTracker.test.tsx
│   └── AdminDashboard.test.tsx
├── api/                         # API route tests
│   ├── visitors.test.ts
│   └── admin.test.ts
├── utils/                       # Utility function tests
│   ├── visitorTracking.test.ts
│   └── adminAuth.test.ts
└── setup.ts                     # Test setup configuration
```

### Unit Testing Examples

```typescript
// Component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisitorTracker } from '@/components/VisitorTracker';

describe('VisitorTracker', () => {
  const mockProps = {
    onTrack: jest.fn(),
    uuid: 'test-uuid-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track visitor on mount', async () => {
    render(<VisitorTracker {...mockProps} />);

    await waitFor(() => {
      expect(mockProps.onTrack).toHaveBeenCalledWith({
        uuid: 'test-uuid-123',
        fingerprint: expect.objectContaining({
          browser: expect.any(String),
          os: expect.any(String),
          device: expect.any(String)
        }),
        timestamp: expect.any(String)
      });
    });
  });

  it('should handle tracking errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockProps.onTrack.mockRejectedValue(new Error('Network error'));

    render(<VisitorTracker {...mockProps} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Visitor tracking failed:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});

// API testing
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/visitors/track/route';

describe('/api/visitors/track', () => {
  it('should create new visitor successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        uuid: 'test-uuid',
        fingerprint: {
          browser: 'Chrome',
          os: 'Windows',
          device: 'Desktop'
        }
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    
    const data = JSON.parse(res._getData());
    expect(data).toMatchObject({
      success: true,
      data: {
        visitor: {
          uuid: 'test-uuid',
          status: 'active'
        }
      }
    });
  });
});
```

### Testing Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

---

## 🚀 Deployment Process

### Local Development Deployment

```bash
# 1. Build and test locally
npm run build
npm run start

# 2. Test production build
npm run build:analyze  # Check bundle sizes
npm run type-check     # Verify types
npm run lint          # Check code quality

# 3. Deploy to Vercel preview
vercel --prod=false

# 4. Deploy to production
vercel --prod
```

### Environment-Specific Configurations

```bash
# Development (.env.local)
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Staging (.env.staging)
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://staging-domain.vercel.app

# Production (.env.production)
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### Deployment Checklist

Before deploying to production:

- [ ] **Environment Variables**: All required variables set in Vercel
- [ ] **Firebase Rules**: Production-ready Firestore rules deployed
- [ ] **Domain Configuration**: Custom domain configured and SSL enabled
- [ ] **Performance**: Lighthouse scores >90 for all metrics
- [ ] **Security**: Security headers configured
- [ ] **Monitoring**: Error tracking and analytics configured
- [ ] **Backup**: Database backup strategy in place

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Firebase Connection Issues

```bash
# Problem: Firebase initialization errors
# Solution: Check environment variables and Firebase config

# Debug Firebase connection
console.log('Firebase config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
});

# Verify Firebase Admin SDK
import { getApps } from 'firebase-admin/app';
console.log('Firebase Admin apps:', getApps().length);
```

#### TypeScript Errors

```bash
# Problem: Type errors in development
# Solution: Clear Next.js cache and rebuild

rm -rf .next
npm run build

# Problem: Module resolution issues
# Solution: Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

#### Performance Issues

```bash
# Problem: Slow page loads
# Solution: Analyze bundle and optimize

npm run build:analyze
# Check for large dependencies and optimize imports

# Problem: Real-time updates slow
# Solution: Optimize Firestore queries
# Use proper indexes and limit query results
```

#### Deployment Issues

```bash
# Problem: Vercel build failures
# Solution: Check build logs and environment variables

vercel logs <deployment-url>

# Problem: API routes not working
# Solution: Verify API route structure and exports
# Ensure proper HTTP methods are exported (GET, POST, etc.)
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Development with debug logging
DEBUG=* npm run dev

# Specific debug categories
DEBUG=firebase:* npm run dev
DEBUG=api:* npm run dev
```

### Performance Monitoring

```typescript
// Add performance monitoring to components
import { useEffect } from 'react';

export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) {
        console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
      }
    };
  }, [componentName]);
};
```

### Error Tracking

```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, LogRocket, etc.
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

---

## 📚 Additional Resources

### Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Learning Resources

- [Next.js Learn Course](https://nextjs.org/learn)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Firebase Web Codelab](https://firebase.google.com/codelabs/firebase-web)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs/utility-first)

### Community and Support

- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [React Community Discord](https://discord.gg/react)
- [Firebase Community Slack](https://firebase.community/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

---

*This development guide provides comprehensive information for developers to effectively work with the Smart Visitor Tracking System, from initial setup to production deployment.*