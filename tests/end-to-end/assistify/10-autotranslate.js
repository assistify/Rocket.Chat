/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback, no-var, space-before-function-paren,
quotes, prefer-template, no-undef, no-unused-vars*/

import {adminEmail, adminPassword, adminUsername, username, email, password} from '../../data/user';
import {checkIfUserIsValid, checkIfUserIsAdmin, createUserAndLogin} from '../../data/checks';
import sideNav from '../../pageobjects/side-nav.page';
import flexTab from '../../pageobjects/flex-tab.page';
import admin from '../../pageobjects/administration.page';
import mainContent from '../../pageobjects/main-content.page';
import {expandSBP, manageAutoTranslate} from '../../pageobjects/main-content.page';

var deutschMessage = 'Guten Morgen';
var englishMessage = 'Good morning';

function setTranslationPreferences(language) {
	it('show Auto translate flex tab', () => {
		flexTab.moreActions.click();
		flexTab.autoTranslateTab.waitForVisible(1000);
		flexTab.autoTranslateTab.isVisible().should.equal(true);
		flexTab.autoTranslateTab.click();
		browser.pause(3000);
	});
	it('activate automatic translation', () => {
		flexTab.autoTranslateToggle.isVisible().should.equal(true);
		if (flexTab.autoTranslateToggleValue.isSelected() === false) {
			flexTab.autoTranslateToggle.click();
		}
		flexTab.autoTranslateToggleValue.isSelected().should.equal(true);
		browser.pause(3000);
	});
	it('choose Language to be used for translation', () => {
		flexTab.autoTranslateShowLanguages.click();
		flexTab.autoTranslateChooseLanguage.click('option=' + language[1]);
		flexTab.autoTranslateChooseLanguage.getValue().should.equal(language[0]);
		browser.pause(3000);
	});
	it('save & close preferences', () => {
		flexTab.autoTranslateSave.click();
		browser.pause(3000);
	});
}

describe('[Auto Translate]', function() {
	describe('[Admin User]', function() {
		var language = ['EN', 'English' ];
		before(() => {
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		});
		describe('[Translation Settings]', function() {
			before(function() {
				sideNav.openAdminView();
			});
			describe('[Section: Message]', function() {
				before(() => {
					admin.messageLink.waitForVisible(5000);
					admin.messageLink.click();
				});
				describe('[Settings: Auto translate]', function() {
					before(() => {
						if (admin.messageButtonCollapseAutotranslate.isVisible()) {
							admin.messageButtonCollapseAutotranslate.waitForVisible(10000);
							admin.messageButtonCollapseAutotranslate.click();
						}
						admin.messageButtonExpandAutotranslate.click();
						admin.messageButtonExpandGoogleMaps.click(); // Will make the auto translate section visible on the view port
					});
					it('enable auto translate', () => {
						if (browser.isVisible('[name="AutoTranslate_Enabled"]')) {
							admin.messageAutoTranslateEnable.click();
						}
						admin.messageAutoTranslateEnable.isSelected().should.equal(true);
					});
					it('select provider', () => {
						if (admin.messageAutoTranslateEnable.isSelected() && admin.messageAutoTranslateProvider.isVisible()) {
							admin.messageAutoTranslateProvider.click('option=DeepL');
							browser.pause(1000);
						}
						admin.messageAutoTranslateProvider.getValue().should.equal('deepl-translate');
					});
					it('API Key', () => {
						admin.messageAutoTranslateAPIKey.isVisible();
						admin.messageAutoTranslateAPIKey.setValue(process.env.DEEPL_CONNECTION_KEY);
						browser.pause(1000);
						admin.messageAutoTranslateAPIKey.getValue().should.equal(process.env.DEEPL_CONNECTION_KEY);
					});
					it('save changes', () => {
						browser.pause(1000);
						if (admin.buttonSave.isEnabled()) {
							admin.adminSaveChanges();
						}
					});
				});
			});
			describe('[Set up Permissions]', function() {
				before(() => {
					admin.permissionsLink.isVisible();
					admin.permissionsLink.click();
				});
				it('set permission for User to auto translate', () => {
					if (!manageAutoTranslate.isSelected()) {
						manageAutoTranslate.click();
						browser.pause(3000);
					}
					manageAutoTranslate.isSelected().should.equal(true);
				});
			});
			after(() => {
				console.log('Auto translate settings and permissions updated.');
				sideNav.preferencesClose.waitForVisible(5000);
				sideNav.preferencesClose.click();
			});
		});
		describe('[Set up Room Translation Preferences]', function() {
			before(() => {
				sideNav.general.click();
			});
			setTranslationPreferences(language);
		});
	});
	describe('[Translation User]', function() {
		var language = ['DE', 'German'];
		describe('[Create User]', function() {
			before(() => {
				// So now we create a new target user
				checkIfUserIsValid(username, email, password);
			});
			describe('[Set up Room Translation Preferences]', function() {
				before(() => {
					sideNav.general.click();
				});
				setTranslationPreferences(language);
				after(() => {
					console.log('Room Preferences updated');
				});
			});
			describe('[Send Message]', function() {
				it('send a Message in Deutsch', () => {
					sideNav.general.click();
					mainContent.sendMessage(deutschMessage);
					browser.pause(5000);
				});
			});
		});
	});
	describe('[Back to Admin User]', function() {
		before(() => {
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.general.click();
		});
		it('compare the last message', () => {
			browser.pause(5000);
			mainContent.waitForLastMessageEqualsText(englishMessage);
		});
		after(() => {
			console.log('Auto Translation Successful');
		});
	});
});
