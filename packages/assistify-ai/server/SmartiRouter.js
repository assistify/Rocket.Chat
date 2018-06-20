/* globals SystemLogger, RocketChat */

import {SmartiAdapter} from './lib/SmartiAdapter';

/**
 * The SmartiRouter handles all incoming HTTP requests from Smarti.
 * This is the only place, where adding routes to the Rocket.Chat API, related to Smarti
 * All HTTP inbound traffic (from Rocket.Chat to Smarti) should pass the this router.
 */

/**
 * Add an incoming webhook '/newConversationResult' to receive answers from Smarti.
 * This allows asynchronous callback from Smarti, when analyzing the conversation has finished.
 */
RocketChat.API.v1.addRoute('smarti.result/:_token', {authRequired: false}, {

	post() {
		SystemLogger.debug('Smarti - Incoming HTTP requests', JSON.stringify(this.bodyParams, null, 2));

		check(this.bodyParams.data, Match.ObjectIncluding({
			conversation: String
		}));

		const rcWebhookToken = RocketChat.settings.get('Assistify_AI_RocketChat_Webhook_Token');

		// verify token
		if (this.urlParams._token && this.urlParams._token === rcWebhookToken) {
			SmartiAdapter.analysisCompleted(null, this.bodyParams.data.conversation, this.bodyParams.data);
			return RocketChat.API.v1.success();
		} else {
			return RocketChat.API.v1.unauthorized({msg: 'token not valid'});
		}
	}
});
