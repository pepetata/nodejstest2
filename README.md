# Restaurant Ordering System

A full-stack web application for a restaurant ordering system with a React frontend and Node.js/Express backend.

## Project Structure

```
├── backend/               # Node.js/Express API server
│   ├── src/               # Source code
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Helper functions
│   │   ├── config/        # Configuration
│   │   └── db/            # Database migrations and seeds
│   ├── tests/             # Backend tests
│   └── server.js          # Main entry point
│
├── frontend/              # React frontend
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React Context API providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   └── utils/         # Helper functions
│   └── tests/             # Frontend tests
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/pepetata/nodejstest2.git
   cd nodejstest2
   ```

2. Set up the backend:

   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create and configure your environment variables
   npm run dev
   ```

3. Set up the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Features

- **User Authentication:** Register, login, and user profile management
- **Menu Management:** Browse menu items by categories
- **Cart System:** Add items to cart, adjust quantities
- **Order Processing:** Place orders, track order status

## Code Quality

This project uses ESLint and Prettier to ensure code quality and consistent formatting.

### Backend

```bash
cd backend
npm run lint         # Check for linting issues
npm run lint:fix     # Fix linting issues automatically
npm run format       # Format code with Prettier
```

### Frontend

```bash
cd frontend
npm run lint         # Check for linting issues
npm run lint:fix     # Fix linting issues automatically
npm run format       # Format code with Prettier
```

### VS Code Extensions

The project includes recommendations for VS Code extensions in `.vscode/extensions.json`. When you open the project in VS Code, it will suggest installing:

- ESLint - For real-time linting feedback
- Prettier - For code formatting

## Configuration Files

- **Backend**

  - `.eslintrc.json` - ESLint configuration (CommonJS format)
  - `.prettierrc` - Prettier configuration
  - `.eslintignore` - Files to be ignored by ESLint
  - `.prettierignore` - Files to be ignored by Prettier

- **Frontend**
  - `.eslintrc.json` - ESLint configuration for React
  - `.prettierrc` - Prettier configuration
  - `.eslintignore` - Files to be ignored by ESLint
  - `.prettierignore` - Files to be ignored by Prettier
  - `vite.config.js` - Vite bundler configuration
  - `tailwind.config.js` - Tailwind CSS configuration
  - `tailwind.config.js` - Tailwind CSS configuration

## Contributing

Feel free to submit issues and enhancement requests!
