const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel KV - only import if available
let kv = null;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  console.log('Running in local mode without Vercel KV');
}

// Use in-memory storage for local development
const localStorage = {
  content: null,
  users: null
};

// Configure multer for file uploads (memory storage for Vercel)
const upload = multer({ 
  storage: multer.memoryStorage(),
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
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

// Default content
const defaultContent = {
  name: "Ваше Имя",
  tagline: "Музыкант & IT Специалист",
  about: "Расскажите о себе здесь. Откройте админ-панель и заполните этот раздел.",
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

// Helper functions for data access
async function readContent() {
  if (kv) {
    const content = await kv.get('content');
    return content || defaultContent;
  } else {
    // Local mode
    if (!localStorage.content) {
      localStorage.content = defaultContent;
    }
    return localStorage.content;
  }
}

async function writeContent(content) {
  if (kv) {
    await kv.set('content', content);
  } else {
    // Local mode
    localStorage.content = content;
  }
}

async function readUsers() {
  if (kv) {
    const users = await kv.get('users');
    if (!users) {
      // Initialize default user
      const hashedPassword = bcrypt.hashSync('admin', 10);
      const defaultUsers = { admin: hashedPassword };
      await kv.set('users', defaultUsers);
      return defaultUsers;
    }
    return users;
  } else {
    // Local mode
    if (!localStorage.users) {
      const hashedPassword = bcrypt.hashSync('admin', 10);
      localStorage.users = { admin: hashedPassword };
    }
    return localStorage.users;
  }
}

async function writeUsers(users) {
  if (kv) {
    await kv.set('users', users);
  } else {
    // Local mode
    localStorage.users = users;
  }
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
app.get('/api/content', async (req, res) => {
  try {
    const content = await readContent();
    res.json(content);
  } catch (error) {
    console.error('Error loading content:', error);
    res.status(500).json({ error: 'Failed to load content' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await readUsers();
    
    if (users[username] && bcrypt.compareSync(password, users[username])) {
      req.session.user = username;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.user });
});

app.post('/api/content', requireAuth, async (req, res) => {
  try {
    console.log('Saving content...');
    await writeContent(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ error: 'Failed to save content', details: error.message });
  }
});

app.post('/api/upload-background', requireAuth, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Convert image to base64 data URL
    const base64Image = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    
    res.json({ success: true, url: dataUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.post('/api/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = req.session.user;
    const users = await readUsers();
    
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
    await writeUsers(users);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
});

// Only start server if not in Vercel
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Default login: admin / admin`);
  });
}

// Export for Vercel
module.exports = app;
