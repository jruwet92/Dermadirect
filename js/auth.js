// Authentication Module

async function loadDoctorsConfig() {
    try {
        const response = await fetch(CONFIG.DOCTORS_JSON_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        STATE.doctorsData = await response.json();
        console.log('Doctors configuration loaded successfully');
        showLoginScreen();
    } catch (error) {
        console.error('Error loading doctors configuration:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <div class="header">
                <h1>❌ Configuration Error</h1>
                <p>Unable to load doctors.json file</p>
            </div>
            <div style="padding: 40px;">
                <p>Please ensure doctors.json is available in the data/ directory.</p>
            </div>
        `;
    }
}

function showLoginScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'block';
}

function handleLogin() {
    const input = document.getElementById('passcode').value.trim();
    
    if (!input) {
        showLoginError('Please enter an access code.');
        return;
    }

    // Check admin tokens
    if (STATE.doctorsData.adminTokens && STATE.doctorsData.adminTokens.includes(input)) {
        STATE.currentDoctor = STATE.doctorsData.doctors.find(d => d.active) || STATE.doctorsData.doctors[0];
        showMainApp();
        return;
    }

    // Check doctor tokens
    STATE.currentDoctor = STATE.doctorsData.doctors.find(doctor => 
        doctor.active && doctor.accessToken === input
    );

    if (STATE.currentDoctor) {
        showMainApp();
    } else {
        showLoginError('Incorrect access code. Please try again.');
        document.getElementById('passcode').value = '';
    }
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    document.getElementById('doctorDetails').textContent = 
        `${STATE.currentDoctor.name} (${STATE.currentDoctor.email})`;
    document.getElementById('doctorName').value = STATE.currentDoctor.name;
    document.getElementById('doctorEmail').value = STATE.currentDoctor.email;
    
    createImageSlot(0);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDoctorsConfig();
    
    // Allow Enter key to submit login
    document.getElementById('passcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
});
