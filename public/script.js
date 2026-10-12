// Main page script
function applyTheme(theme) {
  if (!theme) return;
  
  const root = document.documentElement;
  
  // Apply custom colors
  if (theme.primaryColor) {
    root.style.setProperty('--md-sys-color-primary', theme.primaryColor);
    // Generate lighter variant for container
    root.style.setProperty('--md-sys-color-primary-container', theme.primaryColor + '40');
  }
  
  if (theme.secondaryColor) {
    root.style.setProperty('--md-sys-color-secondary', theme.secondaryColor);
    root.style.setProperty('--md-sys-color-secondary-container', theme.secondaryColor + '40');
  }
  
  if (theme.tertiaryColor) {
    root.style.setProperty('--md-sys-color-tertiary', theme.tertiaryColor);
    root.style.setProperty('--md-sys-color-tertiary-container', theme.tertiaryColor + '40');
  }
  
  if (theme.backgroundColor) {
    root.style.setProperty('--md-sys-color-background', theme.backgroundColor);
    root.style.setProperty('--md-sys-color-surface', theme.backgroundColor);
  }
  
  // Apply background image if enabled
  if (theme.useBackgroundImage && theme.backgroundImage) {
    document.body.style.backgroundImage = `url('${theme.backgroundImage}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.body.style.backgroundImage = 'none';
  }
}

async function loadContent() {
  try {
    const response = await fetch('/api/content');
    const data = await response.json();
    
    // Apply theme first
    if (data.theme) {
      applyTheme(data.theme);
    }
    
    // Update hero section
    document.getElementById('hero-name').textContent = data.name;
    document.getElementById('hero-tagline').textContent = data.tagline;
    document.getElementById('logo').textContent = data.name;
    
    // Update about section
    document.getElementById('about-text').textContent = data.about;
    
    // Update music section
    document.getElementById('music-title').textContent = data.music.title;
    document.getElementById('music-description').textContent = data.music.description;
    
    const musicItemsContainer = document.getElementById('music-items');
    musicItemsContainer.innerHTML = '';
    if (data.music.items && data.music.items.length > 0) {
      data.music.items.forEach(item => {
        const chip = document.createElement('div');
        chip.className = 'item-chip';
        chip.textContent = item;
        musicItemsContainer.appendChild(chip);
      });
    }
    
    // Update IT section
    document.getElementById('it-title').textContent = data.it.title;
    document.getElementById('it-description').textContent = data.it.description;
    
    const itItemsContainer = document.getElementById('it-items');
    itItemsContainer.innerHTML = '';
    if (data.it.items && data.it.items.length > 0) {
      data.it.items.forEach(item => {
        const chip = document.createElement('div');
        chip.className = 'item-chip';
        chip.textContent = item;
        itItemsContainer.appendChild(chip);
      });
    }
    
    // Update contacts
    const emailLink = document.getElementById('contact-email');
    const telegramLink = document.getElementById('contact-telegram');
    const instagramLink = document.getElementById('contact-instagram');
    const githubLink = document.getElementById('contact-github');
    
    if (data.contacts.email) {
      emailLink.textContent = data.contacts.email;
      emailLink.href = `mailto:${data.contacts.email}`;
      emailLink.parentElement.style.display = 'flex';
    } else {
      emailLink.parentElement.style.display = 'none';
    }
    
    if (data.contacts.telegram) {
      telegramLink.textContent = data.contacts.telegram;
      telegramLink.href = `https://t.me/${data.contacts.telegram.replace('@', '')}`;
      telegramLink.parentElement.style.display = 'flex';
    } else {
      telegramLink.parentElement.style.display = 'none';
    }
    
    if (data.contacts.instagram) {
      instagramLink.textContent = data.contacts.instagram;
      instagramLink.href = `https://instagram.com/${data.contacts.instagram.replace('@', '')}`;
      instagramLink.parentElement.style.display = 'flex';
    } else {
      instagramLink.parentElement.style.display = 'none';
    }
    
    if (data.contacts.github) {
      githubLink.textContent = data.contacts.github;
      githubLink.href = `https://github.com/${data.contacts.github}`;
      githubLink.parentElement.style.display = 'flex';
    } else {
      githubLink.parentElement.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error loading content:', error);
  }
}

// Load content when page loads
document.addEventListener('DOMContentLoaded', loadContent);
