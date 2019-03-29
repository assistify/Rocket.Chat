/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

// test data imports
import { username, email, password } from '../data/user.js';
import { checkIfUserIsValid } from '../data/checks';

const greyTimeout = process.env.GREY_TIMEOUT || 2000;

function singleMessage(index) {
	it(`Message sending should work in less than ${ greyTimeout } seconds`, () => {
		const text = `how long is the round-trip for message #${ index }?`;
		mainContent.sendMessageOptimistic(text);
		mainContent.waitForMessageArrival(text, greyTimeout);
		// mainContent.openMessageActionMenu();
		// mainContent.messageDelete.click();
		// mainContent.confirmPopup('Yes, delete it!');
	});
}

let iterations = 1000;
let index = 1;
describe('Performance test', () => {
	before(() => {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearchIcon.click();
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');
	});

	while (iterations--) {
		singleMessage(index++);
	}
});
