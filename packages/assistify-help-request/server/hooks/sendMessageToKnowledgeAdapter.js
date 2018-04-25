/* globals SystemLogger */

import {getKnowledgeAdapter} from 'meteor/assistify:ai';
function isMessageRelevant(message, room) {
	let knowledgeEnabled = false;
	RocketChat.settings.get('Assistify_AI_Enabled', function(key, value) {
		knowledgeEnabled = value;
	});

	if (!knowledgeEnabled) {
		return false;
	}

	//we only want to forward messages from requests and topics - livechats are implemented in the assistify-ai-package
	if (!room) {
		room = RocketChat.models.Rooms.findOneById(message.rid);
	}

	if (!(room && (room.t === 'r' || (room.t === 'e')))) {
		return false;
	}

	const knowledgeAdapter = getKnowledgeAdapter();
	if (!knowledgeAdapter) {
		return false;
	}

	return true;
}

Meteor.startup(() => {
	RocketChat.callbacks.add('afterSaveMessage', function(message, room) {

		if (isMessageRelevant(message, room)) {

			//do not trigger a new evaluation if the message was sent from a bot (particularly by assistify itself)
			//todo: Remove dependency to bot. It should actually be the other way round.
			//proposal: Make bot create metadata in the help-request collection
			const botUsername = RocketChat.settings.get('Assistify_Bot_Username');
			if (message.u.username === botUsername) {
				return;
			}

			const knowledgeAdapter = getKnowledgeAdapter();
			Meteor.defer(() => {

				const helpRequest = RocketChat.models.HelpRequests.findOneById(room.helpRequestId);
				const context = {};
				if (helpRequest) { //there might be rooms without help request objects if they have been created inside the chat-application
					context.contextType = 'ApplicationHelp';
					context.environmentType = helpRequest.supportArea;
					context.environment = helpRequest.environment;
				}
				try {
					knowledgeAdapter.onMessage(message, context, room.expertise ? [room.expertise] : []);
					Meteor.defer(()=>Meteor.call('tryResync', message.rid));
				} catch (e) {
					SystemLogger.error('Error using knowledge provider ->', e);
				}
			});

			return message;
		}
	}, RocketChat.callbacks.priority.LOW, 'Assistify_Request_onMessage');
});

RocketChat.callbacks.add('afterDeleteMessage', function(message) {
	if (isMessageRelevant(message)) {
		const knowledgeAdapter = getKnowledgeAdapter();
		SystemLogger.debug(`Propagating delete of message${ message._id } to knowledge-adapter`);
		Meteor.defer(() => {
			try {
				SystemLogger.debug(`Calling afterDeleteMessage(${ message._id });`);
				knowledgeAdapter.afterMessageDeleted(message);
			} catch (e) {
				SystemLogger.error('Error using knowledge provider ->', e);
			}
		});
	}

}, RocketChat.callbacks.priority.LOW, 'Assistify_Request_afterDeleteMessage');

RocketChat.callbacks.add('afterRoomErased', function(room) {
	const knowledgeAdapter = getKnowledgeAdapter();
	SystemLogger.debug(`Propagating delete of room ${ room._id } to knowledge-adapter`);
	Meteor.defer(() => {
		try {
			SystemLogger.debug(`Calling afterRoomErased(${ room._id });`);
			knowledgeAdapter.afterRoomErased(room);
		} catch (e) {
			SystemLogger.error('Error using knowledge provider ->', e);
		}
	});
}, RocketChat.callbacks.priority.LOW, 'Assistify_Request_afterRoomErased');
