/* eslint-env mocha */

import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import { adminUsername, adminEmail, adminPassword } from '../../data/user.js';
import { checkIfUserIsAdmin } from '../../data/checks';

const topicName = 'topic-';
const topicExpert = 'rocketchat.internal.admin.test';
const numTopics = 11;

describe('[Word-cloud Test]', () => {

	before(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
	});

	it(`create ${ numTopics } topics for word-cloud`, function() {
		this.timeout(100000);
		for (let i=1; i <= numTopics; i++) {
			try {
				sideNav.openChannel(topicName+i);
			} catch (e) {
				assistify.createTopic(topicName+i, topicExpert);
				console.log('New topic created: ', topicName+i);
			}
		}
		//done();
	});

	it('open word-cloud', function(done) {
		assistify.openWordCloud('d');
		assistify.wordCloudCanvas.waitForVisible(5000);
		done();
	});

	it('cleanup all topics', function(done) {
		this.timeout(100000);
		console.log('Topics cleaning started.');
		for (let i=1; i <= numTopics; i++) {
			console.log('Topic Deleted', topicName+i);
			assistify.deleteRoom(topicName+i);
		}
		done();
	});

});
