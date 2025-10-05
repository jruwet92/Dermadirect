// API and Network Module

function updateProgress(percent, statusText, isRetry = false, retryNum = 0) {
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const retryInfo = document.getElementById('retryInfo');
    
    progressBar.style.width = percent + '%';
    progressBar.textContent = Math.round(percent) + '%';
    progressStatus.textContent = statusText;
    
    if (isRetry && retryNum > 0) {
        retryInfo.classList.remove('hidden');
        retryInfo.textContent = `⚠️ Attempt ${retryNum + 1} of 3 - Retrying...`;
    } else {
        retryInfo.classList.add('hidden');
    }
    
    // Scroll to progress bar so user can see it
    progressBar.parentElement.parentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

async function sendDataWithRetry(data, symptoms, submitBtn, originalText) {
    for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                updateProgress(20 + (attempt * 10), 'Retrying connection...', true, attempt);
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
            }
            
            await sendData(data, symptoms, submitBtn, originalText, attempt);
            return; // Success, exit
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            
            if (attempt < CONFIG.MAX_RETRIES) {
                console.log(`Retrying in ${CONFIG.RETRY_DELAY/1000} seconds... (${attempt + 1}/${CONFIG.MAX_RETRIES + 1})`);
                updateProgress(
                    30 + (attempt * 15), 
                    'Connection issue detected, preparing retry...', 
                    true, 
                    attempt
                );
            } else {
                // Final attempt failed
                console.error('All retry attempts failed');
                handleSubmissionError(error, submitBtn, originalText);
            }
        }
    }
}

async function sendData(data, symptoms, submitBtn, originalText, attemptNumber = 0) {
    console.log('Sending data to Make.com...');
    
    updateProgress(
        PROGRESS_STEPS.COLLECTING.percent, 
        PROGRESS_STEPS.COLLECTING.message
    );
    
    const timestamp = new Date();
    const formData = new FormData();
    
    // Add all form data
    formData.append('recipient_email', STATE.currentDoctor.email);
    formData.append('subject', `Dermatological Assessment - Patient: ${data.patientId}`);
    formData.append('doctor_name', data.doctorName);
    formData.append('doctor_email', data.doctorEmail);
    formData.append('patient_id', data.patientId);
    formData.append('patient_email', data.patientEmail);
    formData.append('patient_age', data.patientAge);
    formData.append('patient_gender', data.patientGender);
    formData.append('lesion_duration', data.lesionDuration.replace(/-/g, ' '));
    formData.append('symptoms_present', data.symptoms);
    formData.append('symptom_types', symptoms.join(', ') || 'None');
    formData.append('lesion_appearance_changes', data.lesionChange);
    formData.append('family_history', data.familyHistory);
    formData.append('sun_exposure_level', data.sunExposure);
    formData.append('previous_treatments', data.previousTreatments || 'None reported');
    formData.append('additional_notes', data.additionalNotes || 'No additional observations');
    formData.append('timestamp', timestamp.toISOString());
    formData.append('report_date', timestamp.toLocaleDateString());
    formData.append('report_time', timestamp.toLocaleTimeString());
    formData.append('portal_source', 'Dermatology Portal');
    
    updateProgress(
        PROGRESS_STEPS.PROCESSING_IMAGES.percent, 
        PROGRESS_STEPS.PROCESSING_IMAGES.message
    );
    
    try {
        const validImages = STATE.imageFiles.filter(file => file !== null && file !== undefined);
        
        if (validImages.length === 0) {
            throw new Error('No images to send');
        }

        console.log(`Creating collage from ${validImages.length} image(s)...`);
        updateProgress(
            PROGRESS_STEPS.CREATING_COLLAGE.percent, 
            `Creating image collage (${validImages.length} image${validImages.length > 1 ? 's' : ''})...`
        );
        
        const imageToSend = await createImageCollage(STATE.imageFiles);
        
        updateProgress(
            PROGRESS_STEPS.PREPARING_UPLOAD.percent, 
            PROGRESS_STEPS.PREPARING_UPLOAD.message
        );
        
        const filename = `patient_${data.patientId.replace(/[^a-zA-Z0-9]/g, '_')}_${validImages.length > 1 ? 'collage' : 'image'}_${timestamp.getTime()}.jpg`;
        
        formData.append('image_file', imageToSend, filename);
        formData.append('image_filename', filename);
        formData.append('image_mime_type', 'image/jpeg');
        formData.append('image_count', validImages.length);
        formData.append('is_collage', validImages.length > 1 ? 'Yes' : 'No');
        formData.append('images_attached', 'Yes');
        
        console.log(`Sending ${validImages.length > 1 ? 'collage' : 'single image'}...`);
        updateProgress(
            PROGRESS_STEPS.UPLOADING.percent, 
            PROGRESS_STEPS.UPLOADING.message
        );
        
        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        updateProgress(
            PROGRESS_STEPS.PROCESSING_RESPONSE.percent, 
            PROGRESS_STEPS.PROCESSING_RESPONSE.message
        );
        
        if (response.ok) {
            const result = await response.text();
            console.log('Success:', result);
            
            handleSubmissionSuccess(submitBtn, originalText);
        } else {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        
    } catch (error) {
        console.error('Error:', error);
        throw error; // Re-throw to trigger retry logic
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function handleSubmissionSuccess(submitBtn, originalText) {
    updateProgress(
        PROGRESS_STEPS.COMPLETE.percent, 
        PROGRESS_STEPS.COMPLETE.message
    );
    
    // Hide progress after a moment
    setTimeout(() => {
        document.getElementById('progressContainer').classList.add('hidden');
    }, 1500);
    
    document.getElementById('bottomSuccessMessage').classList.remove('hidden');
    
    // Reset form
    document.getElementById('patientForm').reset();
    STATE.imageFiles = [];
    STATE.imageSlotCount = 0;
    document.getElementById('imagesContainer').innerHTML = '';
    createImageSlot(0);
    document.getElementById('addImageBtn').classList.add('hidden');
    
    // Scroll to success message
    document.getElementById('bottomSuccessMessage').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}

function handleSubmissionError(error, submitBtn, originalText) {
    document.getElementById('progressContainer').classList.add('hidden');
    
    document.getElementById('bottomErrorMessage').innerHTML = 
        '<strong>❌ ERREUR:</strong> Impossible d\'envoyer les données après plusieurs tentatives. ' + 
        'Veuillez vérifier votre connexion internet et réessayer.<br><small>Détails: ' + 
        error.message + '</small>';
    document.getElementById('bottomErrorMessage').classList.remove('hidden');
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    // Scroll to error message
    document.getElementById('bottomErrorMessage').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
    });
}
