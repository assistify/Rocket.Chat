import Page from './Page';

import sideNav from './side-nav.page';
import flexTab from './flex-tab.page';
import global from './global';


const Keys = {
	'TAB': '\uE004',
	'ENTER': '\uE007'
};
class Assistify extends Page {

	get knowledgebaseTab() {
		return browser.element('.tab-button:not(.hidden) .tab-button-icon--lightbulb');
	}

	get completeRequest() {
		return browser.element('.button.close-helprequest.button-block');
	}

	get commentClose() {
		return browser.element('.sweet-alert input[type="text"]');
	}

	get commentCloseOK() {
		return browser.element('.sweet-alert .sa-confirm-button-container');
	}

	get sendMessageBtn() {
		return browser.element('.rc-message-box__icon.rc-message-box__send.js-send');
	}

	get messageTextField() {
		return browser.element('.rc-message-box__container textarea');
	}


	get knowledgebaseAnswer() {
		return browser.element('.external-search-content .smarti-widget .search-results');
	}

	get knowledgebasePickAnswer() {
		return browser.element('#widgetBody > div.widgetContent > div > div > div > div > div.postAction');
	}

	get knowledgebaseContent() {
		return browser.element('[data-link="class{merge: messagesCnt toggle=\'parent\'}"]');
	}

	// new Topic

	get topicName() {
		return browser.element('.create-channel__content input[name="expertise"]');
	}

	get requestTitle() {
		return browser.element('.create-channel__content input[name="request_title"]');
	}

	get topicExperts() {
		return browser.element('.create-channel__content input[name="experts"]');
	}

	get saveTopicBtn() {
		return browser.element('.create-channel__content [data-button="create"]');
	}

	get newChannelBtn() {
		return browser.element('.toolbar .toolbar__search-create-channel');
	}


	// Tabs
	get tabs() {
		return browser.element('nav.rc-tabs');
	}

	get createTopicTab() {
		return browser.element('nav.rc-tabs .rc-tabs__tab-link.AssistifyCreateExpertise');
	}

	get createRequestTab() {
		return browser.element('nav.rc-tabs .rc-tabs__tab-link.AssistifyCreateRequest');
	}

	// Knowledgebase
	get closeTopicBtn() {
		return browser.element('.rc-button.rc-button--outline.rc-button--cancel.js-delete');
	}

	get editInfoBtn() {
		return browser.element('.rc-button.rc-button--icon.rc-button--outline.js-edit');
	}

	get infoRoomIcon() {
		return browser.element('.flex-tab-container.border-component-color.opened .tab-button.active');
	}

	get addKeyword() {
		return browser.element('#tags > ul > li.add');
	}

	get keywordTextBox() {
		return browser.element('#newTagInput');
	}

	get numberOfRequests() { return browser.element('#rocket-chat > aside > div.rooms-list > h3:nth-child(9) > span.badge'); }

	createTopic(topicName, expert) {
		this.newChannelBtn.waitForVisible(10000);
		this.newChannelBtn.click();

		if (this.tabs) {
			this.createTopicTab.waitForVisible(5000);
			this.createTopicTab.click();
		}

		this.topicName.waitForVisible(10000);
		this.topicName.setValue(topicName);

		this.topicExperts.waitForVisible(10000);
		this.topicExperts.setValue(expert);
		browser.pause(500);
		browser.keys(Keys.TAB);
		browser.pause(500);

		browser.waitUntil(function() {
			return browser.isEnabled('.create-channel__content [data-button="create"]');
		}, 5000);

		browser.pause(500);
		this.saveTopicBtn.click();
		browser.pause(500);
	}

	createHelpRequest(topicName, message, requestTitle) {
		this.newChannelBtn.waitForVisible(10000);
		this.newChannelBtn.click();
		this.tabs.waitForVisible(5000);
		if (this.tabs) {
			this.createRequestTab.waitForVisible(5000);
			this.createRequestTab.click();
		}

		this.topicName.waitForVisible(5000);
		this.topicName.setValue(topicName);

		if (requestTitle) {
			this.requestTitle.waitForVisible(5000);
			this.requestTitle.setValue(requestTitle);
		}

		browser.pause(100);
		browser.keys(Keys.TAB);
		browser.pause(300);

		browser.waitUntil(function() {
			return browser.isEnabled('.create-channel__content [data-button="create"]');
		}, 5000);

		browser.pause(500);
		this.saveTopicBtn.click();
		browser.pause(500);

		this.clickKnowledgebase();
		this.sendTopicMessage(message);

	}

	sendTopicMessage(message) {
		this.messageTextField.waitForVisible(5000);
		this.messageTextField.setValue(message);
		this.sendMessageBtn.waitForVisible(5000);
		this.sendMessageBtn.click();
	}

	closeRequest() {
		this.knowledgebaseTab.click();
		this.completeRequest.waitForVisible(5000);
		this.completeRequest.click();
		global.confirmPopup();
	}

	closeTopic(topicName) {
		sideNav.openChannel(topicName);
		flexTab.channelTab.waitForVisible(5000);
		flexTab.channelTab.click();
		this.editInfoBtn.waitForVisible(5000);
		this.editInfoBtn.click();
		this.closeTopicBtn.waitForVisible(5000);
		this.closeTopicBtn.click();
		global.confirmPopup();
	}

	clickKnowledgebase() {
		this.knowledgebaseTab.waitForVisible(5000);
		this.knowledgebaseTab.click();
	}

	addNewKeyword(keyword) {
		this.addKeyword.waitForVisible(5000);
		this.addKeyword.click();
		this.keywordTextBox.setValue(keyword);
		browser.keys(Keys.ENTER);
		browser.pause(1000);
	}

	logoutRocketchat() {
		sideNav.accountMenu.waitForVisible(5000);
		sideNav.accountMenu.click();
		sideNav.logout.waitForVisible(5000);
		sideNav.logout.click();
	}
}


module.exports = new Assistify();
