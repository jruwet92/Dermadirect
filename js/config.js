// Configuration Constants
const CONFIG = {
    WEBHOOK_URL: 'https://hook.eu2.make.com/5foiew3chncbqcux79xy1iuc79kju9r1',
    MAX_IMAGES: 3,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000, // 2 seconds
    DOCTORS_JSON_PATH: 'data/doctors.json'
};

// Global State
const STATE = {
    doctorsData: null,
    currentDoctor: null,
    imageFiles: [],
    imageSlotCount: 0
};

// Progress Steps
const PROGRESS_STEPS = {
    VALIDATING: { percent: 10, message: 'Validating form data...' },
    COLLECTING: { percent: 20, message: 'Collecting patient information...' },
    PROCESSING_IMAGES: { percent: 40, message: 'Processing images...' },
    CREATING_COLLAGE: { percent: 50, message: 'Creating image collage...' },
    PREPARING_UPLOAD: { percent: 70, message: 'Preparing upload...' },
    UPLOADING: { percent: 80, message: 'Uploading to server...' },
    PROCESSING_RESPONSE: { percent: 90, message: 'Processing response...' },
    COMPLETE: { percent: 100, message: '✅ Successfully sent!' }
};
