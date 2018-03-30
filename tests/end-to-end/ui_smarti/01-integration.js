/* eslint-env mocha */

import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import mainContent from '../../pageobjects/main-content.page';
import Global from '../../pageobjects/global';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';

const topicName = 'smarti-test-topic';
const topicExpert = 'rocketchat.internal.admin.test';
const shortTopicMessage = 'Das ist das neue Thema zu dem Anfragen erstellt werden und die Wissensbasis genutzt wird!';
const message = 'Mit allgemeinen Anfragen verschaffen Sie sich einen Überblick über den Markt, indem Sie Produkte, Preise und Bestellbedingungen unterschiedlicher Lieferanten und Dienstleister kennen lernen. In einem allgemeinen Anfragebrief bitten Sie zum die Zusendung von Katalogen, Prospekten, Preislisten und Produktmustern. Wie kann ich dieses Wissen nutzen?';
const answer = 'Das ist die Antwort auf diese Anfrage!';

import { checkIfUserIsAdmin } from '../../data/checks';
import supertest from 'supertest';

// the following should actually be imported from 00-preparation
const smarti = supertest.agent('http://localhost:8080');
const credentials = {
	username: 'admin',
	password: 'admin'
};

describe('[Smarti Integration]', () => {

	before(() => {
		browser.pause(5000); // wait some time to make sure that all settings on both sides are actually persisted

		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword); // is broken -- if not admin it will log in as user or create a user
	});

	describe('[Topic]', () => {
		before(() => {
			try {
				sideNav.openChannel(topicName);
			} catch (e) {
				assistify.createTopic(topicName, topicExpert);
			}

		});

		describe('Message', () => {
			it('it should send a message', () => {
				assistify.clickKnowledgebase();
				assistify.sendTopicMessage(shortTopicMessage);
			});
		});
	});

	describe('[Request]', () => {

		describe('First request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, message);
			});
			it.skip('answer request', () => {
				assistify.sendTopicMessage(answer);
			});
			it('close request', () => {
				assistify.clickKnowledgebase();
				assistify.closeRequest();

			});
		});
		describe('Second request', () => {

			it('create is successful', () => {
				assistify.createHelpRequest(topicName, message);
				assistify.clickKnowledgebase();
			});

			it('knowledgebase answer visible', () => {
				assistify.clickKnowledgebase();
				assistify.knowledgebaseContent.waitForVisible(5000);
			});

			it('post knowledgebase answer', () => {
				assistify.knowledgebasePickAnswer.waitForVisible(5000);
				assistify.knowledgebasePickAnswer.click();
			});
			it('close request', () => {
				assistify.clickKnowledgebase();
				assistify.closeRequest();
			});
		});
	});

	describe('Message lifecycle', () => {
		let clientid;
		let token;
		let conversationId;

		it('create is successful', () => {
			assistify.createHelpRequest(topicName, 'Diese Nachricht soll editiert werden');
		});
		it('check if client already exists', function(done) {
			smarti.get('/client')
				.auth(credentials['username'], credentials['password'])
				.expect(200)
				.expect(function(res) {
					for (const cl in res.body) {
						if (res.body[cl].name === 'testclient') {
							clientid = res.body[cl].id;
							console.log('check if client exists', clientid);
						}
					}
				})
				.end(done);
		});

		it('post access token', function(done) {
			const code = `/client/${ clientid }/token`;
			smarti.post(code)
				.auth(credentials['username'], credentials['password'])
				.set('Content-Type', 'application/json')
				.send({})
				.end(function(err, res) {
					token = res.body.token;
					res.status.should.be.equal(201);
					console.log('token', res.body.token);
					done();
				});
		});

		it('shall find the conversation in Smarti', (done) => {
			const roomId = assistify.roomId;
			roomId.should.not.be.empty;

			console.log('roomId', roomId);

			smarti.get(`/conversation?channel_id=${ roomId }`) //this does not really filter, see https://github.com/redlink-gmbh/smarti/issues/233
				.set('Accept', 'application/json')
				.set('X-Auth-Token', token)
				.expect((res) => {
					res.body.content.should.not.be.empty;

					const currentConversation = res.body.content.filter((conversation) => {
						console.log('conversation candidate', conversation);
						return conversation.meta.channel_id === roomId;
					})[0];

					currentConversation.id.should.not.be.empty;
					conversationId = currentConversation.id;
				})
				.end(done);
		});

		it('shall find the message in Smarti', (done) => {
			const messageId = assistify.lastMessageId;
			messageId.should.not.be.empty;
			console.log(`finding  /conversation/${ conversationId }/message/${ messageId }`);
			smarti.get(`/conversation/${ conversationId }/message/${ messageId }`)
				.set('Accept', 'application/json')
				.set('X-Auth-Token', token)
				.expect(200)
				.end(done);
		});

		it('shall modify an edited message in Smarti', (done) => {
			const textAfterChange = 'Diese Nachricht soll bearbeitet worden sein';

			mainContent.openMessageActionMenu();
			mainContent.messageEdit.click();
			mainContent.setTextToInput(textAfterChange);
			mainContent.sendBtn.click();

			const messageId = assistify.lastMessageId;
			messageId.should.not.be.empty;

			smarti.get(`/conversation/${ conversationId }/message/${ messageId }`)
				.set('Accept', 'application/json')
				.set('X-Auth-Token', token)
				.expect((res) => {
					console.log('message from smarti', res.body);
					res.body.content.should.equal(textAfterChange);
				})
				.end(done);
		});

		it('shall delete the message in Smarti', (done) => {
			const messageId = assistify.lastMessageId;
			messageId.should.not.be.empty;

			mainContent.openMessageActionMenu();
			mainContent.messageDelete.click();

			Global.modal.waitForVisible(5000);
			Global.confirmPopup();

			console.log(`deleted /conversation/${ conversationId }/message/${ messageId }`);

			smarti.get(`/conversation/${ conversationId }/message/${ messageId }`)
				.set('Accept', 'application/json')
				.set('X-Auth-Token', token)
				.expect(404)
				.end(done);
		});
	});

	after(() => {
		it('close new Topic', () => {
			console.log('TopicName for cleanup', topicName);
			assistify.closeTopic(topicName);
		});
	});
});
