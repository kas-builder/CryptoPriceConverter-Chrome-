document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('myButton');
    button.addEventListener('click', function() {
        // Send a message to the background script
        safari.extension.dispatchMessage('buttonClicked');
    });
    
    // Listen for messages from the background script
    safari.application.addEventListener('message', function(event) {
        if (event.name === 'responseMessage') {
            const response = event.message;
            // Handle the response from the background script
            document.getElementById('response').textContent = response;
        }
    }, false);
});