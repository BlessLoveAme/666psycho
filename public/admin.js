// Admin panel script
const loginPage = document.getElementById('login-page');
const adminPage = document.getElementById('admin-page');
const loginForm = document.getElementById('login-form');
const adminForm = document.getElementById('admin-form');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');
const saveMessage = document.getElementById('save-message');

let currentBackgroundImage = '';

// Color input sync
function setupColorInputs() {
  const colorPairs = [
    ['primary-color', 'primary-color-text'],
    ['secondary-color', 'secondary-color-text'],
    ['tertiary-color', 'tertiary-color-text'],
    ['background-color', 'background-color-text']
  ];

  colorPairs.forEach(([colorId, textId]) => {
    const colorInput = document.getElementById(colorId);
    const textInput = document.getElementById(textId);

    colorInput.addEventListener('input', (e) => {
      textInput.value = e.target.value;
    });

    textInput.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        colorInput.value = e.target.value;
      }
    });
  });
}

// Background image upload
document.getElementById('background-image')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('background', file);

  try {
    const response = await fetch('/api/upload-background', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      currentBackgroundImage = data.url;
      const preview = document.getElementById('background-preview');
      preview.innerHTML = `<img src="${data.url}" alt="Background preview">`;
    } else {
      alert('Ошибка загрузки изображения');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Ошибка загрузки изображения');
  }
});

// Check authentication on load
async function checkAuth() {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();
    
    if (data.authenticated) {
      showAdminPanel();
      loadContentForEdit();
    } else {
      showLoginPage();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showLoginPage();
  }
}

function showLoginPage() {
  loginPage.style.display = 'flex';
  adminPage.style.display = 'none';
}

function showAdminPanel() {
  loginPage.style.display = 'none';
  adminPage.style.display = 'block';
  setupColorInputs();
}

// Login form handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAdminPanel();
      loadContentForEdit();
      loginError.textContent = '';
      loginError.classList.remove('show');
    } else {
      loginError.textContent = 'Неверный логин или пароль';
      loginError.classList.add('show');
    }
  } catch (error) {
    console.error('Login error:', error);
    loginError.textContent = 'Ошибка при входе';
    loginError.classList.add('show');
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
    showLoginPage();
    loginForm.reset();
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Load content for editing
async function loadContentForEdit() {
  try {
    const response = await fetch('/api/content');
    const data = await response.json();
    
    // Fill form fields
    document.getElementById('name').value = data.name || '';
    document.getElementById('tagline').value = data.tagline || '';
    document.getElementById('about').value = data.about || '';
    
    document.getElementById('music-title').value = data.music?.title || '';
    document.getElementById('music-description').value = data.music?.description || '';
    document.getElementById('music-items').value = data.music?.items ? data.music.items.join('\n') : '';
    
    document.getElementById('it-title').value = data.it?.title || '';
    document.getElementById('it-description').value = data.it?.description || '';
    document.getElementById('it-items').value = data.it?.items ? data.it.items.join('\n') : '';
    
    document.getElementById('email').value = data.contacts?.email || '';
    document.getElementById('telegram').value = data.contacts?.telegram || '';
    document.getElementById('instagram').value = data.contacts?.instagram || '';
    document.getElementById('github').value = data.contacts?.github || '';
    
    // Load theme settings
    if (data.theme) {
      document.getElementById('primary-color').value = data.theme.primaryColor || '#6750A4';
      document.getElementById('primary-color-text').value = data.theme.primaryColor || '#6750A4';
      
      document.getElementById('secondary-color').value = data.theme.secondaryColor || '#625B71';
      document.getElementById('secondary-color-text').value = data.theme.secondaryColor || '#625B71';
      
      document.getElementById('tertiary-color').value = data.theme.tertiaryColor || '#7D5260';
      document.getElementById('tertiary-color-text').value = data.theme.tertiaryColor || '#7D5260';
      
      document.getElementById('background-color').value = data.theme.backgroundColor || '#FEF7FF';
      document.getElementById('background-color-text').value = data.theme.backgroundColor || '#FEF7FF';
      
      currentBackgroundImage = data.theme.backgroundImage || '';
      document.getElementById('use-background-image').checked = data.theme.useBackgroundImage || false;
      
      if (currentBackgroundImage) {
        const preview = document.getElementById('background-preview');
        preview.innerHTML = `<img src="${currentBackgroundImage}" alt="Background preview">`;
      }
    }
    
  } catch (error) {
    console.error('Error loading content:', error);
  }
}

// Save content handler
adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const content = {
    name: document.getElementById('name').value,
    tagline: document.getElementById('tagline').value,
    about: document.getElementById('about').value,
    music: {
      title: document.getElementById('music-title').value,
      description: document.getElementById('music-description').value,
      items: document.getElementById('music-items').value
        .split('\n')
        .filter(item => item.trim() !== '')
    },
    it: {
      title: document.getElementById('it-title').value,
      description: document.getElementById('it-description').value,
      items: document.getElementById('it-items').value
        .split('\n')
        .filter(item => item.trim() !== '')
    },
    contacts: {
      email: document.getElementById('email').value,
      telegram: document.getElementById('telegram').value,
      instagram: document.getElementById('instagram').value,
      github: document.getElementById('github').value
    },
    theme: {
      primaryColor: document.getElementById('primary-color').value,
      secondaryColor: document.getElementById('secondary-color').value,
      tertiaryColor: document.getElementById('tertiary-color').value,
      backgroundColor: document.getElementById('background-color').value,
      backgroundImage: currentBackgroundImage,
      useBackgroundImage: document.getElementById('use-background-image').checked
    }
  };
  
  try {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      saveMessage.textContent = 'Изменения успешно сохранены!';
      saveMessage.style.color = 'var(--md-sys-color-success)';
      saveMessage.classList.add('show');
      setTimeout(() => {
        saveMessage.classList.remove('show');
      }, 3000);
    } else {
      saveMessage.textContent = 'Ошибка при сохранении: ' + (data.error || 'неизвестная ошибка');
      saveMessage.style.color = 'var(--md-sys-color-error)';
      saveMessage.classList.add('show');
    }
  } catch (error) {
    console.error('Save error:', error);
    saveMessage.textContent = 'Ошибка при сохранении: ' + error.message;
    saveMessage.style.color = 'var(--md-sys-color-error)';
    saveMessage.classList.add('show');
  }
});

// Password change form handler
const passwordForm = document.getElementById('password-form');
const passwordMessage = document.getElementById('password-message');

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    passwordMessage.textContent = 'Новые пароли не совпадают';
    passwordMessage.style.color = 'var(--md-sys-color-error)';
    passwordMessage.classList.add('show');
    return;
  }
  
  if (newPassword.length < 4) {
    passwordMessage.textContent = 'Пароль должен быть не менее 4 символов';
    passwordMessage.style.color = 'var(--md-sys-color-error)';
    passwordMessage.classList.add('show');
    return;
  }
  
  try {
    const response = await fetch('/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      passwordMessage.textContent = 'Пароль успешно изменен!';
      passwordMessage.style.color = 'var(--md-sys-color-success)';
      passwordMessage.classList.add('show');
      passwordForm.reset();
      
      setTimeout(() => {
        passwordMessage.classList.remove('show');
      }, 3000);
    } else {
      passwordMessage.textContent = data.error || 'Ошибка при смене пароля';
      passwordMessage.style.color = 'var(--md-sys-color-error)';
      passwordMessage.classList.add('show');
    }
  } catch (error) {
    console.error('Password change error:', error);
    passwordMessage.textContent = 'Ошибка при смене пароля';
    passwordMessage.style.color = 'var(--md-sys-color-error)';
    passwordMessage.classList.add('show');
  }
});

// Check auth on page load
checkAuth();
