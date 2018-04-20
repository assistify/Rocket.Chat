import Page from './Page';

class Discovery extends Page {
	get typeSelection() { return browser.element('.js-typeSelector'); }
	get searchInput() { return browser.element('.rc-directory-search .js-search'); }
	get directoryResult() { return browser.element('.rc-directory-channel-name'); }

	findUser(username) {
		this.typeSelection.waitForVisible(5000);
		this.typeSelection.selectByValue('users');

		this.searchInput.setValue(username);
	}
}

export const discovery = new Discovery();
