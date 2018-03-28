/* eslint-env mocha */

import supertest from 'supertest';
import { adminUsername, adminPassword } from '../../data/user.js';
import { credentials } from '../ui_smarti/00-preparation.js';
import {checkIfUserIsAdmin} from '../../data/checks';
import {adminEmail} from '../../data/user';
import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';


export const clientname = 'syncclient';
export const smarti_url_active = 'http://localhost:8080/';
export const smarti_url_inactive = 'http://localhost:8081/';
export const request = supertest.agent(smarti_url_active);
export const rcrequest = supertest.agent('http://localhost:3000');


let auto_token;
let auto_clientId;
describe('[Smarti Configuration]', function() {
	describe('[Smarti Configuration]', function() {
		describe('[Client]', () => {
			it('check if client already exists', function(done) {
				request.get('/client')
					.auth(credentials['username'], credentials['password'])
					.expect(200)
					.expect(function(res) {
						for (const cl in res.body) {
							if (res.body[cl].name === clientname) {
								auto_clientId = res.body[cl].id;
								console.log('check if client exists', auto_clientId);
							}
						}
					})
					.end(done);
			});

			it('delete client if exists', function(done) {
				if (typeof auto_clientId !== 'undefined') {
					console.log('client was alread there', auto_clientId);
					request.del(`/client/${ auto_clientId }`)
						.expect(204)
						.end(done);
				} else {
					done();
				}
			});

			it('create new client', function(done) {
				request.post('/client')
					.send({
						defaultClient: true,
						description: '',
						name: clientname
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						auto_clientId = res.body.id;
						res.status.should.be.equal(201);
						console.log('clientid', res.body.id);
						done();
					});
			});

			it('check if right client was picked', function(done) {
				request.get('/client')
					.expect(200)
					.expect(function(res) {
						for (const cl in res.body) {
							if (res.body[cl].name === clientname) {
								res.body[cl].id.should.be.equal(auto_clientId);
							}
						}
						auto_clientId.should.not.equal(undefined);
					})
					.end(done);
			});

			it('post access token', function(done) {
				const code = `/client/${ auto_clientId }/token`;
				request.post(code)
					.set('Content-Type', 'application/json')
					.send({})
					.end(function(err, res) {
						auto_token = res.body.token;
						res.status.should.be.equal(201);
						console.log('token', res.body.token);
						done();
					});
			});
		});
	});

	describe('[Rocket-Chat Configuration]', () => {
		let authToken;
		let userId;

		it('Login to Rocket.Chat api', function(done) {
			rcrequest.post('/api/v1/login')
				.set('Content-Type', 'application/json')
				.send({
					username: adminUsername,
					password: adminPassword
				})
				.end(function(err, res) {
					authToken = res.body.data.authToken;
					userId = res.body.data.userId;
					res.status.should.be.equal(200);
					console.log('authToken', authToken);
					console.log('userId', userId);
					done();
				});
		});

		it('Update access token in Rocket.Chat', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rcrequest.post('/api/v1/settings/Assistify_AI_Smarti_Auth_Token')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: auto_token
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: enable Knowledgebase', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rcrequest.post('/api/v1/settings/Assistify_AI_Enabled')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: true
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: activate Smarti', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rcrequest.post('/api/v1/settings/Assistify_AI_Source')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: '0'
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: set Smarti client', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rcrequest.post('/api/v1/settings/Assistify_AI_Smarti_Domain')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: clientname
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: set Rocket.Chat Weebhook token', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rcrequest.post('/api/v1/settings/Assistify_AI_RocketChat_Webhook_Token')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: 'key123'
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: set Smarti base url', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rcrequest.post('/api/v1/settings/Assistify_AI_Smarti_Base_URL')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: smarti_url_active
				})
				.expect(200)
				.end(done);
		});

		it('Check Assistify_AI_Smarti_Domain', function(done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Smarti_Domain')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal(clientname);
					console.log('', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Source', function(done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Source')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal('0');
					console.log('Assistify_AI_Source', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Enabled', function(done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Enabled')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal(true);
					console.log('Assistify_AI_Enabled', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_RocketChat_Webhook_Token', function(done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_RocketChat_Webhook_Token')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal('key123');
					console.log('Assistify_AI_RocketChat_Webhook_Token', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Smarti_Base_URL', function(done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Smarti_Base_URL')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal(smarti_url_active);
					console.log('Assistify_AI_Smarti_Base_URL', res.body.value);
					done();
				});
		});

		it('Logout from Rocketchat api', function(done) {
			console.log('authToken-o', authToken);
			console.log('userId-o', userId);
			rcrequest.post('/api/v1/logout')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(done);
		});
	});
});

const topicName = 'test-topic';
const topicExpert = adminUsername;
const messages = ['Nachricht im Thema wurde synchronisiert',
	'Nachricht in der Anfrage wurde synchronisiert',
	'1. Nachricht in der 1. Anfrage wurde nicht synchronisiert',
	'2. Nachricht in der 1. Anfrage wurde nicht synchronisiert',
	'Nachricht in der 2. Anfrage wurde nicht synchronisiert',
	'1. Nachricht in der automatisch synchronisiert Anfrage wurde synchronisiert',
	'2. Nachricht in der automatisch synchronisiert Anfrage wurde nicht synchronisiert',
	'3. Nachricht in der automatisch synchronisiert Anfrage wurde synchronisiert'
];
const sync_request1 = 'sync_request1';
const unsync_request1 = 'unsync_request1';
const unsync_request2 = 'unsync_request2';
const autosync_request1 = 'autosync_request1';


function loginRC() {
	return new Promise(resolve => {
		rcrequest.post('/api/v1/login')
			.set('Content-Type', 'application/json')
			.send({
				username: adminUsername,
				password: adminPassword
			})
			.end(function(err, res) {
				const authToken = res.body.data.authToken;
				const userId = res.body.data.userId;
				res.status.should.be.equal(200);
				console.log('authToken', authToken);
				console.log('userId', userId);
				resolve([authToken, userId]);
			});
	});
}

async function changeSmartiStatus(status, done) {
	const login_credentials = await loginRC();

	await rcrequest.post('/api/v1/settings/Assistify_AI_Smarti_Base_URL')
		.set('X-Auth-Token', login_credentials[0])
		.set('X-User-Id', login_credentials[1])
		.send({
			value: status
		})
		.expect(200)
		.then(rcrequest.post('/api/v1/logout')
			.set('X-Auth-Token', login_credentials[0])
			.set('X-User-Id', login_credentials[1])
			.expect(200)
			.end(done));
}



describe('[Test Sync]', function() {
	before(() => {
		browser.pause(5000); // wait some time to make sure that all settings on both sides are actually persisted

		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword); // is broken -- if not admin it will log in as user or create a user
	});

	describe('[Test full Sync]', function() {

		describe('Test synced messaging', function() {
			let conversationId;
			before(() => {
				try {
					sideNav.openChannel(topicName);
					assistify.closeTopic(topicName);
					assistify.createTopic(topicName, topicExpert);
				} catch (e) {
					assistify.createTopic(topicName, topicExpert);
				}
			});

			afterEach((done)=> {
				request.del(`/conversation/${ conversationId }`)
					.auth(credentials['username'], credentials['password'])
					.expect(204)
					.end(done);
			});

			it('Send synced message in Topic', (done)=> {
				sideNav.openChannel(topicName);
				assistify.sendTopicMessage(messages[0]);
				browser.pause(500);
				request.get('/conversation/')
					.auth(credentials['username'], credentials['password'])
					.query({client: auto_clientId, size: 10})
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content[0].messages;
						let found = false;
						for (let i=0; i < msgs.length; i++) {
							if (msgs[i].content === messages[0]) {
								found = true;
								conversationId = res.body.content[0].id;
								break;
							}
						}
						found.should.be.equal(true);

					})
					.end(done);
			});

			it('Send synced message in Request', (done)=> {
				try {
					sideNav.searchChannel(sync_request1);
					console.log('HelpRequest already Exists');
					assistify.closeTopic(sync_request1);
					assistify.createHelpRequest(topicName, messages[1], sync_request1);
				} catch (e) {
					assistify.createHelpRequest(topicName, messages[1], sync_request1);
					console.log('New Help Request Created');
				}
				browser.pause(500);
				request.get('/conversation/')
					.auth(credentials['username'], credentials['password'])
					.query({client: auto_clientId})
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content[0].messages;
						let found = false;
						for (let i=0; i < msgs.length; i++) {
							if (msgs[i].content === messages[1]) {
								found = true;
								conversationId = res.body.content[0].id;
								break;
							}
						}
						found.should.be.equal(true);

					})
					.end(done);
			});
		});

		describe('Test unsynced messaging', function() {

			it('Make Smarti unavailable', (done)=> {
				changeSmartiStatus(smarti_url_inactive, done);
			});

			it('Send unsynced message in Request', (done)=> {
				try {
					sideNav.searchChannel(unsync_request1);
					console.log('HelpRequest already Exists');
					assistify.closeTopic(unsync_request1);
					assistify.createHelpRequest(topicName, messages[2], unsync_request1);
				} catch (e) {
					assistify.createHelpRequest(topicName, messages[2], unsync_request1);
					console.log('New Help Request Created');
				}
				browser.pause(500);
				request.get('/conversation/')
					.auth(credentials['username'], credentials['password'])
					.query({client: auto_clientId})
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						msgs.length.should.be.equal(0);
					})
					.end(done);
			});

			it('Send second unsynced message in Request', (done)=> {
				assistify.sendTopicMessage(messages[3]);
				browser.pause(500);
				request.get('/conversation/')
					.auth(credentials['username'], credentials['password'])
					.query({client: auto_clientId})
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						msgs.length.should.be.equal(0);
					})
					.end(done);
			});

			it('Send unsynced message in second Request', (done)=> {
				try {
					sideNav.searchChannel(unsync_request2);
					console.log('HelpRequest already Exists');
					assistify.closeTopic(unsync_request2);
					assistify.createHelpRequest(topicName, messages[4], unsync_request2);
				} catch (e) {
					assistify.createHelpRequest(topicName, messages[4], unsync_request2);
					console.log('New Help Request Created');
				}
				browser.pause(500);
				request.get('/conversation/')
					.auth(credentials['username'], credentials['password'])
					.query({client: auto_clientId})
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						msgs.length.should.be.equal(0);
					})
					.end(done);
			});

			it('Make Smarti available', (done)=> {
				changeSmartiStatus(smarti_url_active, done);
			});

			it('Trigger full resync', (done)=> {
				sideNav.accountMenu.waitForVisible(5000);
				sideNav.accountMenu.click();
				sideNav.admin.waitForVisible(5000);
				sideNav.admin.click();
				assistify.assitifyLink.waitForVisible(5000);
				assistify.assitifyLink.click();
				assistify.expandKnowledgebaseSettings.waitForVisible(5000);
				assistify.expandKnowledgebaseSettings.click();
				assistify.resyncBtn.waitForVisible(5000);
				assistify.resyncBtn.click();
				sideNav.preferencesClose.waitForVisible(5000);
				sideNav.preferencesClose.click();
				sideNav.preferencesClose.click();
				browser.pause(500);
				request.get('/conversation/')
					.auth(credentials['username'], credentials['password'])
					.query({client: auto_clientId})
					.expect(200)
					.expect(function(res) {
						const conversations = res.body.content;
						console.log(conversations);
						conversations.length.should.be.equal(2);
					})
					.end(done);
				// done();
			});
		});

		describe('[Cleanup Full Sync Test', ()=> {
			it('Remove sync Request', (done)=> {
				console.log('TopicName for cleanup', sync_request1);
				assistify.closeTopic(sync_request1);
				done();
			});

			it('Remove 1. unsync Request', (done)=> {
				console.log('TopicName for cleanup', unsync_request1);
				assistify.closeTopic(unsync_request1);
				done();
			});

			it('Remove 2. unsync Request', (done)=> {
				console.log('TopicName for cleanup', unsync_request2);
				assistify.closeTopic(unsync_request2);
				done();
			});

			it('Cleanup all Conversations in Smarti', (done)=> {
				request.get('/conversation/')
					.auth(credentials['username'], credentials['password'])
					.query({client: auto_clientId})
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						for (let i=0; i < msgs.length; i++) {
							request.del(`/conversation/${ msgs[i].id }`)
								.auth(credentials['username'], credentials['password'])
								.expect(204)
								.end();
						}

					})
					.end(done);
			});
		});
	});

	describe('[Test auto Sync]', function() {
		let conversationId;

		it('Send synced message in Request', (done)=> {
			browser.pause(500);
			try {
				sideNav.searchChannel(autosync_request1);
				console.log('HelpRequest already Exists');
				assistify.closeTopic(autosync_request1);
				assistify.createHelpRequest(topicName, messages[5], autosync_request1);
			} catch (e) {
				assistify.createHelpRequest(topicName, messages[5], autosync_request1);
				console.log('New Help Request Created');
			}
			browser.pause(500);
			request.get('/conversation/')
				.auth(credentials['username'], credentials['password'])
				.query({client: auto_clientId})
				.expect(200)
				.expect(function(res) {
					const msgs = res.body.content[0].messages;
					let found = false;
					for (let i=0; i < msgs.length; i++) {
						if (msgs[i].content === messages[5]) {
							found = true;
							conversationId = res.body.content[0].id;
							break;
						}
					}
					found.should.be.equal(true);

				})
				.end(done);
		});

		it('Make Smarti unavailable', (done)=> {
			changeSmartiStatus(smarti_url_inactive, done);
		});

		it('Send unsynced message in Request', (done)=> {
			assistify.sendTopicMessage(messages[6]);
			browser.pause(500);
			request.get('/conversation/')
				.auth(credentials['username'], credentials['password'])
				.query({client: auto_clientId})
				.expect(200)
				.expect(function(res) {
					const conversations = res.body.content;
					conversations.length.should.be.equal(1);
					conversations[0].messages.length.should.be.equal(1);
					conversations[0].messages[0].content.should.be.equal(messages[5]);
				})
				.end(done);
		});

		it('Make Smarti available', (done)=> {
			changeSmartiStatus(smarti_url_active, done);
		});

		it('Send last synced message in Request', (done)=> {
			assistify.sendTopicMessage(messages[7]);
			browser.pause(2000);
			request.get('/conversation/')
				.auth(credentials['username'], credentials['password'])
				.query({client: auto_clientId})
				.expect(200)
				.expect(function(res) {
					const conversations = res.body.content;
					conversations.length.should.be.equal(1);
					conversations[0].messages.length.should.be.equal(3);
				})
				.end(done);
		});

		describe('[Cleanup Full Sync Test', ()=> {
			it('Remove sync Request', ()=> {
				console.log('TopicName for cleanup', autosync_request1);
				assistify.closeTopic(autosync_request1);
			});

			it('Cleanup all Conversations in Smarti', (done)=> {
				request.del(`/conversation/${ conversationId }`)
					.auth(credentials['username'], credentials['password'])
					.expect(204)
					.end(done);
			});
		});
	});
});
