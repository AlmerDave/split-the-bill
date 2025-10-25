// Image Export Module - Uses html2canvas to export results as image

const ImageExporter = {
    /**
     * Export container as PNG image with header and results
     */
    async exportAsImage() {
        const container = document.querySelector('.container');
        const button = document.getElementById('saveImage');
        
        if (!container) {
            alert('Container not found');
            return;
        }
        
        // Show loading state
        const originalText = button.textContent;
        button.textContent = '⏳ Generating...';
        button.disabled = true;

        // Store original states
        const allSteps = document.querySelectorAll('.step');
        const originalDisplayStates = [];
        
        // Save original display states and hide all steps except step4
        allSteps.forEach(step => {
            originalDisplayStates.push({
                element: step,
                display: step.style.display
            });
            step.style.display = 'none';
        });
        
        // Show only step4
        const step4 = document.getElementById('step4');
        if (step4) {
            step4.style.display = 'block';
        }

        try {
            // Small delay to let the DOM update
            await new Promise(resolve => setTimeout(resolve, 300));

            // Capture the container
            const canvas = await html2canvas(container, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (!blob) {
                    throw new Error('Failed to create image');
                }

                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().split('T')[0];
                link.download = `split-the-bill-${timestamp}.png`;
                link.href = url;
                link.click();

                // Cleanup
                URL.revokeObjectURL(url);

                // Show success
                button.textContent = '✅ Saved!';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }, 'image/png');

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to save image. Please try again.');
            button.textContent = originalText;
            button.disabled = false;
        } finally {
            // Restore original display states
            originalDisplayStates.forEach(item => {
                item.element.style.display = item.display;
            });
        }
    },

    /**
     * Check if html2canvas is loaded
     */
    isAvailable() {
        return typeof html2canvas !== 'undefined';
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageExporter;
}