class Global {
	// Modal
	get modalOverlay() { return browser.element('.rc-modal-wrapper'); }
	get modal() { return browser.element('.rc-modal'); }
	get modalConfirm() { return browser.element('.rc-modal .js-confirm'); }
	get modalCancel() { return browser.element('.rc-modal .js-modal'); }
	get modalPasswordField() { return browser.element('.rc-modal [type="password"]'); }
	get modalFileName() { return browser.element('.rc-modal #file-name'); }
	get modalFileDescription() { return browser.element('.rc-modal #file-description'); }
	get modalFilePreview() { return browser.element('.rc-modal .upload-preview-file'); }
	get modalFileTitle() { return browser.element('.rc-modal .upload-preview-title'); }
	get modalInput() { return browser.element('.js-modal-input'); }

	get toastAlert() { return browser.element('.toast'); }

	confirmPopup() {
		this.modalConfirm.waitForVisible(5000);
		browser.pause(500);
		this.modalConfirm.click();
		this.modal.waitForVisible(5000, true);
	}

	enterModalText(input) {
		this.modalConfirm.waitForVisible(5000);
		this.modalInput.setValue(input);
		this.modalConfirm.waitForVisible(5000);
	}

	setWindowSize(width, height) {
		browser.windowHandleSize({
			width,
			height
		});
	}

	dismissToast() {
		this.toastAlert.click();
	}
}

module.exports = new Global();
