// Form Handling Module

function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Form submitted!');
    
    const hasImage = STATE.imageFiles.some(file => file !== null && file !== undefined);
    if (!hasImage) {
        alert('Please upload at least one image.');
        return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Sending...';
    submitBtn.disabled = true;
    
    const form = document.getElementById('patientForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
    }
    
    // Hide any previous messages
    document.getElementById('bottomSuccessMessage').classList.add('hidden');
    document.getElementById('bottomErrorMessage').classList.add('hidden');
    
    // Show progress container
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.classList.remove('hidden');
    updateProgress(
        PROGRESS_STEPS.VALIDATING.percent, 
        PROGRESS_STEPS.VALIDATING.message
    );
    
    // Collect form data
    const formData = new FormData(form);
    const data = {};
    
    for (let pair of formData.entries()) {
        data[pair[0]] = pair[1];
    }
    
    // Collect symptom checkboxes
    const symptoms = [];
    document.querySelectorAll('input[name="symptomType"]:checked').forEach(cb => {
        symptoms.push(cb.value);
    });
    
    // Send data with retry logic
    sendDataWithRetry(data, symptoms, submitBtn, originalText);
}

// Initialize form submission handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('patientForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});
