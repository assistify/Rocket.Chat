/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback, no-var, space-before-function-paren,
quotes, prefer-template, no-undef, no-unused-vars*/

import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import {username, email, password, adminUsername, adminEmail, adminPassword} from '../../data/user.js';
import { checkIfUserIsAdmin } from '../../data/checks';
import globalObject from '../../pageobjects/global';
const topicName = 'unit-testing';
const message = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
describe('[Help Reqeust]', function() {
	const helpRequest = 'write-test-cases';
	const comment = 'Request tested successfully';
	before(function() {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		sideNav.spotlightSearch.waitForVisible(10000);
	});

	it('Create a Expertise', function() {
		try {
			sideNav.searchChannel(topicName);
			console.log('Expertise already Exists');
		} catch (e) {
			assistify.createTopic(topicName, adminUsername);
			console.log('New Expertise created');
		}
	});

	it('Create a HelpRequest', function() {
		try {
			sideNav.searchChannel(helpRequest);
			console.log('HelpRequest already Exists');
		} catch (e) {
			assistify.createHelpRequest(topicName, message, helpRequest);
			console.log('New Help Request Created');
		}
	});

	describe('[Clean Up]', function() {
		it('close new Topic', () => {
			console.log('Clean for the Topic and Expertise Started...', topicName);
			assistify.closeTopic(helpRequest);
		});
	});

});
describe('[Threading]', function() {
	const helpRequest = 'execute-test-cases';
	const inChatHelp = 'what-is-test-case';

	before(()=> {
		try {
			sideNav.searchChannel(inChatHelp);
			assistify.closeTopic(inChatHelp);
			console.log('Cleanup request from last run');
		} catch (e) {
			console.log('In-Chat-Help preparation done');
		}
	});

	it('Create a Expertise', function() {
		try {
			sideNav.searchChannel(topicName);
			console.log('Expertise already Exists');
		} catch (e) {
			assistify.createTopic(topicName, adminUsername);
			console.log('New Expertise created');
		}
	});

	it('Create a HelpRequest', function() {
		try {
			sideNav.searchChannel(helpRequest);
			console.log('HelpRequest already Exists');
			assistify.sendTopicMessage(message);
		} catch (e) {
			assistify.createHelpRequest(topicName, message, helpRequest);
			console.log('New Help Request Created');
		}
	});

	describe('Thread:', () => {
		before(() => {
			sideNav.spotlightSearch.waitForVisible(10000);
			mainContent.openMessageActionMenu();
		});

		it('it should show a dialog for starting a thread', () => {
			mainContent.selectAction('thread');
		});

		it.skip('it should fill values in popup', function() {
			globalObject.enterModalText(inChatHelp);
			browser.pause(1000);
		});

		it('It should create a new request from chat Room', function() {
			globalObject.confirmPopup();
			sideNav.spotlightSearch.waitForVisible(5000);
		});

		it.skip('It should show the thread\'s request room', function() {
			sideNav.searchChannel(helpRequest);
			sideNav.spotlightSearch.waitForVisible(10000);
		});

		it('The message should be copied', function() {
			try {
				mainContent.waitForLastMessageEqualsText(message);
			} catch (e) {
				console.log('message not propagated to child help request');
			}
		});
	});
	after(function() {
		describe('[Clean Up]', function() {
			it('close the topics and request', () => {
				console.log('Clean for the Topic and Expertise Started...', topicName);
				// assistify.closeTopic(inChatHelp);
				assistify.closeTopic(helpRequest);
				assistify.closeTopic(topicName);
			});
		});
	});
});
