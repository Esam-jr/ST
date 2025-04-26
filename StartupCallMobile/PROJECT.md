# Startup Call Management System - Mobile App

## Project Overview
A mobile application for managing startup calls, sponsorships, and project tracking. This app serves as the mobile counterpart to the web-based Startup Call Management System.

## Tech Stack
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Context API
- **Navigation**: React Navigation
- **Styling**: React Native StyleSheet with custom theme
- **API Client**: Axios
- **Storage**: AsyncStorage
- **Authentication**: JWT with NextAuth.js integration

## Project Structure
```
src/
├── assets/           # Static assets (images, fonts, etc.)
├── components/       # Reusable UI components
├── config/          # Configuration files
│   ├── config.ts    # App configuration
│   └── theme.ts     # Theme configuration
├── context/         # React Context providers
│   └── AuthContext.tsx
├── hooks/           # Custom React hooks
├── navigation/      # Navigation configuration
│   ├── index.tsx
│   └── types.ts
├── screens/         # Screen components
│   ├── auth/        # Authentication screens
│   └── main/        # Main app screens
├── services/        # API and other services
│   └── api.ts
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Features
1. **Authentication**
   - User registration and login
   - Password recovery
   - Session management
   - Role-based access control

2. **Startup Management**
   - Startup idea submission
   - Idea listing and details
   - Status tracking
   - Document management

3. **Sponsorship**
   - Sponsor dashboard
   - Investment tracking
   - ROI calculations
   - Communication tools

4. **Project Tracking**
   - Milestone management
   - Progress updates
   - Task assignment
   - Timeline visualization

5. **Financial Management**
   - Budget planning
   - Expense tracking
   - Financial reports
   - Analytics dashboard

## Development Steps

### Phase 1: Project Setup
- [x] Initialize React Native project with Expo
- [x] Set up TypeScript
- [x] Configure navigation structure
- [x] Set up theme and styling
- [x] Configure API client
- [x] Set up authentication context

### Phase 2: Authentication
- [x] Create login screen
- [ ] Create registration screen
- [ ] Create password recovery screen
- [ ] Implement form validation
- [ ] Set up API integration
- [ ] Add error handling

### Phase 3: Main Features
- [ ] Create home screen
- [ ] Implement startup management
- [ ] Add sponsorship features
- [ ] Create project tracking
- [ ] Implement financial management
- [ ] Add profile management

### Phase 4: Polish & Optimization
- [ ] Add loading states
- [ ] Implement error boundaries
- [ ] Add animations
- [ ] Optimize performance
- [ ] Add offline support
- [ ] Implement push notifications

### Phase 5: Testing & Deployment
- [ ] Unit testing
- [ ] Integration testing
- [ ] UI testing
- [ ] Performance testing
- [ ] App store preparation
- [ ] Production deployment

## API Integration
The mobile app communicates with the following API endpoints:

### Authentication
- POST /auth/login
- POST /auth/register
- POST /auth/forgot-password
- POST /auth/reset-password

### Startups
- GET /startups
- GET /startups/:id
- POST /startups
- PUT /startups/:id
- DELETE /startups/:id

### Projects
- GET /projects
- GET /projects/:id
- POST /projects
- PUT /projects/:id
- DELETE /projects/:id

### Financial
- GET /financial
- GET /financial/:id
- POST /financial
- PUT /financial/:id
- DELETE /financial/:id

## Environment Setup
1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm start
```

4. Run on device:
```bash
npm run android
# or
npm run ios
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License. 