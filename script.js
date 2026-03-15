// --- IndexedDB Wrapper for Large Storage ---
const DB_NAME = 'NexisAppStore';
const DB_VERSION = 1;

function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function saveImageToDB(id, dataUrl) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readwrite');
            const store = tx.objectStore('images');
            const req = store.put(dataUrl, id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    });
}

function loadImageFromDB(id) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('images', 'readonly');
            const store = tx.objectStore('images');
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Search Logic ---
    const searchForm = document.getElementById('search-form');
    const engineSelect = document.getElementById('engine-select');
    const searchInput = document.getElementById('search-input');

    // Load saved engine preference, default to google
    const savedEngine = localStorage.getItem('searchEngine') || 'google';
    engineSelect.value = savedEngine;
    updateFormAction(savedEngine);

    // Save preference when changed
    engineSelect.addEventListener('change', (e) => {
        const engine = e.target.value;
        localStorage.setItem('searchEngine', engine);
        updateFormAction(engine);
        searchInput.focus(); // Keep focus on input for quick typing
    });

    // Update form action url based on selected engine
    function updateFormAction(engine) {
        if (engine === 'google') {
            searchForm.action = 'https://www.google.com/search';
        } else if (engine === 'bing') {
            searchForm.action = 'https://www.bing.com/search';
        } else if (engine === 'duckduckgo') {
            searchForm.action = 'https://duckduckgo.com/';
        } else if (engine === 'yahoo') {
            searchForm.action = 'https://search.yahoo.com/search';
        }
    }


    // --- 2. Profile Name Editing Logic ---
    const profileNameInput = document.getElementById('profile-name-input');

    // Load saved name
    const savedName = localStorage.getItem('profileName');
    if (savedName) {
        profileNameInput.value = savedName;
    }

    // Save name function
    function saveProfileName() {
        const newName = profileNameInput.value.trim() || 'User'; // Fallback to 'User' if empty
        profileNameInput.value = newName; // cleanup whitespace visually
        localStorage.setItem('profileName', newName);
    }

    // Save on blur (clicking away)
    profileNameInput.addEventListener('blur', saveProfileName);

    // Save on Enter key
    profileNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            profileNameInput.blur(); // Triggers the blur event above to save
        }
    });

    // --- 2.5 Clock, Greetings & App Dropdown ---
    const clockElement = document.getElementById('clock');
    const greetingMsgElement = document.getElementById('greeting-msg');

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();

        // Format to HH:MM (24 hour style or 12 hour to preference, let's do 24h as requested "00:00")
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        if (clockElement) {
            clockElement.textContent = `${hours}:${minutes}`;
        }
    }

    // Initial call and set interval
    updateClock();
    setInterval(updateClock, 1000);

    const positiveMessages = [
        "Have a wonderful day!",
        "You're doing great!",
        "Keep up the good work!",
        "Believe in yourself!",
        "Make today amazing!",
        "Stay positive and happy!",
        "Take a deep breath and relax."
    ];

    if (greetingMsgElement) {
        const randomMsg = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
        greetingMsgElement.textContent = randomMsg;
    }

    // Apps Dropdown Toggle
    const appsBtn = document.getElementById('apps-toggle');
    const appsDropdown = document.getElementById('apps-dropdown');

    if (appsBtn && appsDropdown) {
        appsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent closing immediately
            appsDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!appsDropdown.contains(e.target) && !appsBtn.contains(e.target)) {
                appsDropdown.classList.remove('show');
            }
        });
    }

    // --- 3. Dynamic Apps & Quick Links ---

    // Default Data
    const defaultApps = [
        { name: 'Gmail', url: 'https://mail.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg' },
        { name: 'Drive', url: 'https://drive.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg' },
        { name: 'Docs', url: 'https://docs.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg' },
        { name: 'Calendar', url: 'https://calendar.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' },
        { name: 'Translate', url: 'https://translate.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg' }
    ];

    const defaultLinks = [
        { name: 'YouTube', url: 'https://www.youtube.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' },
        { name: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' },
        { name: 'Twitter', url: 'https://twitter.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg' }
    ];

    // State
    let apps = JSON.parse(localStorage.getItem('myApps')) || defaultApps;
    let links = JSON.parse(localStorage.getItem('myLinks')) || defaultLinks;

    // DOM Elements
    const appGrid = document.getElementById('app-grid');
    const quickLinks = document.getElementById('quick-links');
    const addAppBtn = document.getElementById('add-app-btn');
    const addLinkBtn = document.getElementById('add-link-btn');

    // Helper: generic render function
    function renderItems(dataArray, containerElement, isApp) {
        if (!containerElement) return;
        containerElement.innerHTML = '';

        dataArray.forEach((item, index) => {
            const anchor = document.createElement('a');
            anchor.href = item.url;
            anchor.className = isApp ? 'app-item' : 'link-item';
            anchor.title = item.name;

            const contentHTML = isApp ?
                `<img src="${item.icon}" alt="${item.name}"><span>${item.name}</span>` :
                `<div class="link-icon"><img src="${item.icon}" alt="${item.name}"></div><span>${item.name}</span>`;

            anchor.innerHTML = `
                ${contentHTML}
                <button class="delete-btn" data-index="${index}" title="Remove">×</button>
            `;

            containerElement.appendChild(anchor);
        });

        // Attach delete listeners
        const deleteBtns = containerElement.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent navigating
                e.stopPropagation();

                const idx = parseInt(btn.getAttribute('data-index'));
                if (isApp) {
                    apps.splice(idx, 1);
                    localStorage.setItem('myApps', JSON.stringify(apps));
                    renderItems(apps, appGrid, true);
                } else {
                    links.splice(idx, 1);
                    localStorage.setItem('myLinks', JSON.stringify(links));
                    renderItems(links, quickLinks, false);
                }
            });
        });
    }

    // Initial Render
    renderItems(apps, appGrid, true);
    renderItems(links, quickLinks, false);

    // Add logic
    function promptAddItem(isApp) {
        const name = prompt(`Enter ${isApp ? 'App' : 'Link'} Name:`);
        if (!name) return;

        const urlStr = prompt(`Enter ${isApp ? 'App' : 'Link'} URL (e.g., https://example.com):`);
        if (!urlStr) return;

        let finalUrl = urlStr;
        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;

        // Auto fetch favicon
        let domain = new URL(finalUrl).hostname;
        let genericIcon = `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`;

        const newItem = { name, url: finalUrl, icon: genericIcon };

        if (isApp) {
            apps.push(newItem);
            localStorage.setItem('myApps', JSON.stringify(apps));
            renderItems(apps, appGrid, true);
        } else {
            links.push(newItem);
            localStorage.setItem('myLinks', JSON.stringify(links));
            renderItems(links, quickLinks, false);
        }
    }

    if (addAppBtn) {
        addAppBtn.addEventListener('click', () => promptAddItem(true));
    }

    if (addLinkBtn) {
        addLinkBtn.addEventListener('click', () => promptAddItem(false));
    }

    // --- 4. Image Editing & Cropping Logic ---
    const imageUpload = document.getElementById('image-upload');
    const cropperModal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const cancelCropBtn = document.getElementById('cancel-crop');
    const saveCropBtn = document.getElementById('save-crop');
    const closeModalBtn = document.getElementById('close-modal');

    // Settings Menu Options (Modal)
    const settingsModal = document.getElementById('settings-modal');
    const mainSettingsBtn = document.getElementById('main-settings-btn');
    const closeSettingsModalBtn = document.getElementById('close-settings-modal');

    // Modal buttons
    const changeBgBtn = document.getElementById('change-bg-btn');
    const changeCharBtn = document.getElementById('change-char-btn');
    const changeAvatarBtn = document.getElementById('change-avatar-btn');

    let cropper = null;
    let currentEditTargetId = null;

    // Load saved images from IndexedDB
    const savedImages = ['hero-img', 'profile-img', 'main-character-img'];
    savedImages.forEach(id => {
        loadImageFromDB(`custom_img_${id}`).then(savedDataUrl => {
            if (savedDataUrl) {
                const imgElement = document.getElementById(id);
                if (imgElement) imgElement.src = savedDataUrl;
            }
        }).catch(err => console.error("Error loading image from DB:", err));
    });

    // Toggle Settings Modal
    if (mainSettingsBtn && settingsModal) {
        mainSettingsBtn.addEventListener('click', (e) => {
            settingsModal.classList.add('active');
        });

        // Close via X button
        if (closeSettingsModalBtn) {
            closeSettingsModalBtn.addEventListener('click', () => {
                settingsModal.classList.remove('active');
            });
        }
    }

    // Handle Settings Menu Option Clicks
    const triggerUpload = (targetId) => {
        currentEditTargetId = targetId;
        if (settingsModal) settingsModal.classList.remove('active'); // Close modal
        imageUpload.click();
    };

    if (changeBgBtn) changeBgBtn.addEventListener('click', () => triggerUpload('hero-img'));
    if (changeCharBtn) changeCharBtn.addEventListener('click', () => triggerUpload('main-character-img'));
    if (changeAvatarBtn) changeAvatarBtn.addEventListener('click', () => triggerUpload('profile-img'));

    let uploadFileType = 'image/jpeg';

    // Handle File Selection
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadFileType = file.type;

            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result;

                // If it's a GIF, skip Cropper to NOT destroy animation!
                if (uploadFileType === 'image/gif') {
                    const targetImg = document.getElementById(currentEditTargetId);
                    if (targetImg) targetImg.src = dataUrl;
                    saveImageToDB(`custom_img_${currentEditTargetId}`, dataUrl).catch(console.error);
                    imageUpload.value = ''; // Reset
                    return;
                }

                // For PNGs and JPEGs, open Cropper
                imageToCrop.src = dataUrl;
                cropperModal.classList.add('active');

                // Determine aspect ratio based on target
                let aspectRatio = NaN; // Free crop default for background
                if (currentEditTargetId === 'profile-img') {
                    aspectRatio = 1 / 1; // Square/Circle for avatar
                } else if (currentEditTargetId === 'main-character-img') {
                    aspectRatio = NaN; // Free crop for character
                }

                if (cropper) cropper.destroy();

                cropper = new Cropper(imageToCrop, {
                    aspectRatio: aspectRatio,
                    viewMode: 1,
                    background: false,
                    zoomable: true
                });
            };
            reader.readAsDataURL(file);
        }
        imageUpload.value = ''; // Reset
    });

    // Close Modal without saving
    function closeModal() {
        cropperModal.classList.remove('active');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        imageToCrop.src = '';
    }

    cancelCropBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);

    // Save Cropped Image
    saveCropBtn.addEventListener('click', () => {
        if (!cropper || !currentEditTargetId) return;

        let maxWidth = 2560; // Max for background
        let maxHeight = 1440;

        if (currentEditTargetId === 'profile-img') {
            maxWidth = 400;
            maxHeight = 400;
        } else if (currentEditTargetId === 'main-character-img') {
            maxWidth = 1500; // Allow high-res character
            maxHeight = 1500;
        }

        const canvas = cropper.getCroppedCanvas({
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        // Use PNG if original was PNG or requested character (keeps transparency)
        // Otherwise use JPEG for backgrounds to save space
        const isPng = uploadFileType === 'image/png' || currentEditTargetId === 'main-character-img';
        const format = isPng ? 'image/png' : 'image/jpeg';
        const quality = isPng ? undefined : 0.85; // Quality parameter only applies to jpeg/webp

        const croppedDataUrl = canvas.toDataURL(format, quality);

        const targetImg = document.getElementById(currentEditTargetId);
        if (targetImg) {
            targetImg.src = croppedDataUrl;
        }

        // Save safely to IndexedDB instead of localStorage (Bypasses 5MB limit!)
        saveImageToDB(`custom_img_${currentEditTargetId}`, croppedDataUrl)
            .then(() => console.log('Image saved persistently in DB!'))
            .catch(error => {
                alert('Could not save image persistently to database.');
                console.error('Database error:', error);
            });

        closeModal();
    });

    // --- 5. Weather Widget Logic ---
    const weatherIcon = document.getElementById('weather-icon');
    const weatherTemp = document.getElementById('weather-temp');
    const weatherDesc = document.getElementById('weather-desc');

    function getWeatherEmoji(wmoCode) {
        // Simple mapping of WMO weather codes to emojis
        if (wmoCode === 0) return '☀️'; // clear
        if (wmoCode >= 1 && wmoCode <= 3) return '⛅'; // partly cloudy
        if (wmoCode >= 45 && wmoCode <= 48) return '🌫️'; // fog
        if (wmoCode >= 51 && wmoCode <= 57) return '🌧️'; // drizzle
        if (wmoCode >= 61 && wmoCode <= 67) return '☔'; // rain
        if (wmoCode >= 71 && wmoCode <= 77) return '❄️'; // snow
        if (wmoCode >= 80 && wmoCode <= 82) return '🌦️'; // rain showers
        if (wmoCode >= 95 && wmoCode <= 99) return '⛈️'; // thunderstorm
        return '🌤️';
    }

    function getWeatherDesc(wmoCode) {
        if (wmoCode === 0) return 'Clear sky';
        if (wmoCode >= 1 && wmoCode <= 3) return 'Partly cloudy';
        if (wmoCode >= 45 && wmoCode <= 48) return 'Foggy';
        if (wmoCode >= 51 && wmoCode <= 57) return 'Drizzle';
        if (wmoCode >= 61 && wmoCode <= 67) return 'Rain';
        if (wmoCode >= 71 && wmoCode <= 77) return 'Snow';
        if (wmoCode >= 80 && wmoCode <= 82) return 'Showers';
        if (wmoCode >= 95 && wmoCode <= 99) return 'Thunderstorm';
        return 'Unknown';
    }

    if (navigator.geolocation && weatherTemp) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                    const data = await res.json();

                    if (data && data.current_weather) {
                        const temp = Math.round(data.current_weather.temperature);
                        const code = data.current_weather.weathercode;

                        weatherTemp.innerText = `${temp}°C`;
                        weatherIcon.innerText = getWeatherEmoji(code);
                        weatherDesc.innerText = getWeatherDesc(code);
                    }
                } catch (e) {
                    console.error("Weather fetch failed:", e);
                    weatherDesc.innerText = "Unavailable";
                }
            },
            (err) => {
                console.warn("Geolocation blocked:", err);
                weatherDesc.innerText = "Location needed";
            }
        );
    }

    // --- 6. AI Chatbot Logic (Gemini API) ---
    const aiToggleBtn = document.getElementById('ai-toggle-btn');
    const aiChatPanel = document.getElementById('ai-chat-panel');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const apiSettingsBtn = document.getElementById('api-settings-btn');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');

    let geminiApiKey = localStorage.getItem('geminiApiKey') || '';

    if (apiSettingsBtn) {
        apiSettingsBtn.addEventListener('click', () => {
            const newKey = prompt("Enter your Gemini API Key:", geminiApiKey);
            if (newKey !== null) {
                geminiApiKey = newKey.trim();
                localStorage.setItem('geminiApiKey', geminiApiKey);
                if (geminiApiKey) {
                    appendMessage("API Key saved! How can I help you?", false);
                }
            }
        });
    }

    if (aiToggleBtn) {
        aiToggleBtn.addEventListener('click', () => {
            aiChatPanel.classList.add('active');
            chatInput.focus();
        });
    }

    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            aiChatPanel.classList.remove('active');
        });
    }

    function appendMessage(text, isUser) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${isUser ? 'user-msg' : 'ai-msg'}`;
        bubble.innerText = text;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    }

    async function sendToGemini() {
        const text = chatInput.value.trim();
        if (!text) return;

        if (!geminiApiKey) {
            appendMessage("Please enter your Gemini API Key first by clicking the settings ⚙️ icon.", false);
            return;
        }

        appendMessage(text, true);
        chatInput.value = '';

        const loadingBubble = appendMessage("Thinking...", false);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: text }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Gemini API Error");
            }

            const data = await response.json();
            const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't understand that.";

            loadingBubble.innerText = aiReply;
        } catch (e) {
            console.error(e);
            loadingBubble.innerText = `⚠️ API Error: ${e.message}`;
        }
    }

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendToGemini);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendToGemini();
            }
        });
    }

    // --- 7. Quick Notes Logic ---
    const qnInput = document.getElementById('qn-input');
    const qnAddBtn = document.getElementById('qn-add-btn');
    const notesDropdown = document.getElementById('notes-dropdown');
    const notesList = document.getElementById('notes-list');

    let notes = JSON.parse(localStorage.getItem('myQuickNotes') || '[]');

    function renderNotes() {
        if (!notesList) return;
        notesList.innerHTML = '';

        if (notes.length === 0) {
            notesList.innerHTML = '<div style="color:var(--text-light);text-align:center;padding:10px;">No notes yet.</div>';
            return;
        }

        notes.forEach((note, index) => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';

            noteEl.innerHTML = `
                <div class="note-text">${note}</div>
                <button class="delete-note-btn" data-index="${index}" title="Delete Note">×</button>
            `;
            notesList.appendChild(noteEl);
        });

        // Attach delete listeners
        const delBtns = notesList.querySelectorAll('.delete-note-btn');
        delBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'));
                notes.splice(idx, 1);
                localStorage.setItem('myQuickNotes', JSON.stringify(notes));
                renderNotes();

                // Keep dropdown open if notes exist, else close
                if (notes.length === 0) {
                    notesDropdown.classList.remove('active');
                }
            });
        });
    }

    function addNote() {
        const text = qnInput.value.trim();
        if (!text) return;

        notes.push(text);
        localStorage.setItem('myQuickNotes', JSON.stringify(notes));
        qnInput.value = '';
        renderNotes();
        notesDropdown.classList.add('active'); // Show list when adding
    }

    if (qnAddBtn && qnInput && notesDropdown) {
        // Initial render
        renderNotes();

        // Add note on button click
        qnAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addNote();
        });

        // Add note on Enter
        qnInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNote();
            }
        });

        // Toggle dropdown on input click
        qnInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (notes.length > 0) {
                notesDropdown.classList.toggle('active');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notesDropdown.contains(e.target) && e.target !== qnInput) {
                notesDropdown.classList.remove('active');
            }
        });

        // Prevent closing when clicking inside dropdown
        notesDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

});
