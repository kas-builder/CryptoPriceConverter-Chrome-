// This file contains the background script for the extension. It manages events and handles communication between different parts of the extension.

safari.application.addEventListener("command", function(event) {
    if (event.command === "yourCommand") {
        // Handle your command here
    }
}, false);

safari.application.addEventListener("message", function(event) {
    // Handle messages from content scripts or popup
}, false);