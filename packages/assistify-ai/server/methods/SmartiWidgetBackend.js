/* globals SystemLogger, RocketChat */

import {SmartiProxyFactory, verbs} from '../SmartiProxy';

/** @namespace RocketChat.RateLimiter.limitFunction */

/**
 * The SmartiWidgetBackend handles all interactions  triggered by the Smarti widget (not by Rocket.Chat hooks).
 * These 'Meteor.methods' are made available to be accessed via DDP, to be used in the Smarti widget.
 */
Meteor.methods({

	/**
	 * Returns the conversation Id for the given client and its channel.
	 *
	 * @param {String} channelId - the channel Id
	 *
	 * @returns {String} - the conversation Id
	 */
	getConversationId(channelId) {

		// TODO: Cache this setting
		const clientDomain = RocketChat.settings.get('Assistify_AI_Smarti_Domain');
		const response = RocketChat.RateLimiter.limitFunction(
			SmartiProxyFactory.getInstance().propagateToSmarti.bind(SmartiProxyFactory.getInstance()), 5, 1000, {
				userId(userId) {
					return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
				}
			}
		)(verbs.get, `rocket/${ clientDomain }/${ channelId }/conversationid`);
		// Smarti only returns the plain id (no JSON Object), therefore we do not get an response.data obeject.
		// use body instead
		// TODO: Smarti release 0.7.0 should return a valid JSON
		return response.body.content;
	},

	/**
	 * Returns the analyzed conversation by id.
	 *
	 * @param {String} conversationId - the conversation to retrieve
	 *
	 * @returns {Object} - the analysed conversation
	 */
	getConversation(conversationId) {

		return RocketChat.RateLimiter.limitFunction(
			SmartiProxyFactory.getInstance().propagateToSmarti.bind(SmartiProxyFactory.getInstance()), 5, 1000, {
				userId(userId) {
					return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
				}
			}
		)(verbs.get, `conversation/${ conversationId }`);
	},

	/**
	 * Returns the query builder results for the given conversation (used by Smarti widget)
	 *
	 * @param {String} conversationId - the conversation id to get results for
	 * @param {Number} templateIndex - the index of the template to get the results for
	 * @param {String} creator - the creator providing the suggestions
	 * @param {Number} start - the offset of the suggestion results (pagination)
	 *
	 * @returns {Object} - the suggestions
	 */
	getQueryBuilderResult(conversationId, templateIndex, creator, start) {

		return RocketChat.RateLimiter.limitFunction(
			SmartiProxyFactory.getInstance().propagateToSmarti.bind(SmartiProxyFactory.getInstance()), 5, 1000, {
				userId(userId) {
					return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
				}
			}
		)(verbs.get, `conversation/${ conversationId }/template/${ templateIndex }/${ creator }?start=${ start }`);
	}
});


////////////////////////////////////////////
//////// LOAD THE SMARTI JavaScript ////////
////////////////////////////////////////////

// TODO: Prevent writing JavaScript into a inline <script>-Tags
// TODO: It would be much better, having a RC-HTTP-Endpoint returning the plain JavaScript file, to be used like
// TODO: <script type="text/javascript" src="https://${ROCKET-CHAT-URL}/api/rocket.chat.js" />

let script;
let timeoutHandle;

function loadSmarti() {

	const response = RocketChat.RateLimiter.limitFunction(
		SmartiProxyFactory.getInstance().propagateToSmarti.bind(SmartiProxyFactory.getInstance()), 5, 1000, {
			userId(userId) {
				return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
			}
		}
	)(verbs.get, 'plugin/v1/rocket.chat.js');
	if (response && response.statusCode === 200) {
		script = response.body.content;

		if (!script) {
			SystemLogger.error('Could not extract script from Smarti response');
			throw new Meteor.Error('no-smarti-ui-script', 'no-smarti-ui-script');
		} else {
			// add pseudo comment in order to make the script appear in the frontend as a file. This makes it de-buggable
			script = `${ script } //# sourceURL=SmartiWidget.js`;
		}
	} else {
		SystemLogger.error('Could not load Smarti script from', '${SMARTI-SERVER}/plugin/v1/rocket.chat.js');
		throw new Meteor.Error('no-smarti-ui-script', 'no-smarti-ui-script');
	}
	return response.body.content;
}

function delayedReload() {
	if (timeoutHandle) {
		Meteor.clearTimeout(timeoutHandle);
	}
	timeoutHandle = Meteor.setTimeout(loadSmarti(), 86400000);
}

/**
 * This method can be used to explicitly trigger a reconfiguration of the Smarti-widget
 */
Meteor.methods({
	reloadSmarti() {
		script = undefined;
		loadSmarti();
		delayedReload();
		return {
			message: 'settings-reloaded-successfully'
		};
	}
});

/**
 * This method is triggered by the client in order to retrieve the most recent widget
 */
Meteor.methods({
	getSmartiUiScript() {
		if (!script) { //buffering
			loadSmarti();
			delayedReload();
		}
		return script;
	}
});
