/* globals RocketChat, SystemLogger */

import {getKnowledgeAdapter} from '../lib/KnowledgeAdapterProvider';

RocketChat.callbacks.remove('afterSaveMessage', 'externalWebHook');

function isMessageRelevant(message, room) {
	let knowledgeEnabled = false;
	RocketChat.settings.get('Assistify_AI_Enabled', function(key, value) {
		knowledgeEnabled = value;
	});

	if (!knowledgeEnabled) {
		return false;
	}

	//we only want to forward messages from livechat-rooms - requests are implemented in the help-request-package
	if (!room) {
		room = RocketChat.models.Rooms.findOneById(message.rid);
	}

	if (!(room && (room.t === 'l'))) {
		return false;
	}

	const knowledgeAdapter = getKnowledgeAdapter();
	if (!knowledgeAdapter) {
		return false;
	}

	return true;
}

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	if (isMessageRelevant(message, room)) {
		const knowledgeAdapter = getKnowledgeAdapter();
		SystemLogger.debug(`Send message ${ message._id } to knowledgeAdapter (Meteor.defer()`);
		Meteor.defer(() => {
			try {
				SystemLogger.debug(`Calling onMessage(${ message._id });`);
				knowledgeAdapter.onMessage(message);
			} catch (e) {
				SystemLogger.error('Error using knowledge provider ->', e);
			}
		});
	}
}, RocketChat.callbacks.priority.LOW, 'Assistify_AI_OnMessage');

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

}, RocketChat.callbacks.priority.LOW, 'Assistify_AI_afterDeleteMessage');

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
}, RocketChat.callbacks.priority.LOW, 'Assistify_AI_afterRoomErased');
