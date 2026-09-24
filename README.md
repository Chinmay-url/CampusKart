# CampusKart

A campus-based e-commerce marketplace platform where students can buy, sell, and trade products within their campus community.

## Features

- **User Authentication**: Secure login/signup with OTP verification
- **Product Management**: List, edit, and manage products with image uploads
- **Real-time Chat**: In-app messaging between buyers and sellers using Socket.io
- **Payment Integration**: Secure payments via Razorpay
- **Admin Panel**: Comprehensive admin dashboard for platform management
- **Search & Filter**: Find products quickly with advanced search options
- **User Profiles**: Manage personal information and view purchase history
- **Responsive Design**: Mobile-friendly interface built with React

## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication
- **CSS3** - Styling and animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Razorpay** - Payment gateway
- **Nodemailer** - Email services
- **Multer** - File upload handling

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (running locally or MongoDB Atlas)
- **Git** (for version control)

## Quick Start

### Option 1: Using Windows Scripts (Recommended for Windows)

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/campuskart.git
   cd campuskart
   ```

2. **Get your local IP address**
   ```bash
   GET_IP.bat
   ```
   Copy your IPv4 address (usually starts with 192.168.x.x)

3. **Configure frontend environment**
   Update `frontend/.env.local` with your IP:
   ```
   REACT_APP_API_URL=http://YOUR_IP:5000/api
   REACT_APP_SOCKET_URL=http://YOUR_IP:5000
   ```

4. **Start the backend**
   ```bash
   START_BACKEND.bat
   ```

5. **Start the frontend** (in a new terminal)
   ```bash
   START_FRONTEND.bat
   ```

### Option 2: Manual Setup

1. **Clone and setup**
   ```bash
   git clone https://github.com/YOUR_USERNAME/campuskart.git
   cd campuskart
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables** (see Environment Variables section)

5. **Start MongoDB**
   ```bash
   # For local MongoDB
   mongod
   ```

6. **Run the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## Environment Variables

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb://localhost:27017/campuskart
JWT_SECRET=your_jwt_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PORT=5000
```

### Frontend (`frontend/.env.local`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Project Structure

```
campuskart/
├── backend/
│   ├── middleware/          # Custom middleware functions
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── uploads/            # Product images
│   ├── receipts/           # Payment receipts
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json
├── GET_IP.bat              # Get local IP address
├── START_BACKEND.bat       # Start backend server
├── START_FRONTEND.bat      # Start frontend app
├── SETUP_FIREWALL.bat      # Configure firewall
└── README.md
```

## Available Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Frontend
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/forgot-password` - Password reset

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Chat
- `GET /api/chat/:userId` - Get chat messages
- `POST /api/chat` - Send message

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/products` - Get all products
- `PUT /api/admin/products/:id/approve` - Approve product

## Development Setup

### MongoDB Setup
1. Install MongoDB locally or create a free MongoDB Atlas account
2. Update `MONGO_URI` in `backend/.env`
3. Ensure MongoDB is running before starting the backend

### Razorpay Setup
1. Create a Razorpay account
2. Get your API keys from the Razorpay dashboard
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `backend/.env`

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password
3. Update email credentials in `backend/.env`

## Network Access

For other devices on your network to access the application:

1. Run `GET_IP.bat` to get your local IP address
2. Update `frontend/.env.local` with your IP:
   ```
   REACT_APP_API_URL=http://YOUR_IP:5000/api
   REACT_APP_SOCKET_URL=http://YOUR_IP:5000
   ```
3. Run `SETUP_FIREWALL.bat` to configure Windows Firewall
4. Other users can access the app at `http://YOUR_IP:3000`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues

If you encounter any issues or have suggestions, please open an issue on the GitHub Issues page.

## Support

For support or questions, please create an issue on GitHub.

---

If you find this project helpful, please give it a star!
