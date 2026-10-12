const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initialize data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize default content
if (!fs.existsSync(CONTENT_FILE)) {
  const defaultContent = {
    name: "Ваше Имя",
    tagline: "Музыкант & IT Специалист",
    about: "Расскажите о себе здесь",
    music: {
      title: "Музыка",
      description: "Опишите ваше музыкальное направление",
      items: []
    },
    it: {
      title: "IT",
      description: "Опишите ваши IT проекты и навыки",
      items: []
    },
    contacts: {
      email: "",
      telegram: "",
      instagram: "",
      github: ""
    },
    theme: {
      primaryColor: "#6750A4",
      secondaryColor: "#625B71",
      tertiaryColor: "#7D5260",
      backgroundColor: "#FEF7FF",
      backgroundImage: "",
      useBackgroundImage: false
    }
  };
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(defaultContent, null, 2));
}

// Initialize default admin user (admin/admin)
if (!fs.existsSync(USERS_FILE)) {
  const hashedPassword = bcrypt.hashSync('admin', 10);
  const defaultUsers = {
    admin: hashedPassword
  };
  fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
}

// Helper functions
function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

function writeContent(content) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
}

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Routes
app.get('/api/content', (req, res) => {
  try {
    const content = readContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load content' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  
  if (users[username] && bcrypt.compareSync(password, users[username])) {
    req.session.user = username;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.user });
});

app.post('/api/content', requireAuth, (req, res) => {
  try {
    console.log('Saving content:', JSON.stringify(req.body, null, 2));
    writeContent(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ error: 'Failed to save content', details: error.message });
  }
});

app.post('/api/upload-background', requireAuth, upload.single('background'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = '/uploads/' + req.file.filename;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.post('/api/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = req.session.user;
    const users = readUsers();
    
    if (!users[username]) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    if (!bcrypt.compareSync(currentPassword, users[username])) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }
    
    users[username] = bcrypt.hashSync(newPassword, 10);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Default login: admin / admin`);
});
