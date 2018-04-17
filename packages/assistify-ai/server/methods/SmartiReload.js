/* globals SystemLogger, RocketChat */

import {SmartiProxy, verbs} from '../SmartiProxy';

Meteor.methods({
	triggerFullResync() {
		SystemLogger.info('Full Smarti resync triggered');

		const query = {$or: [{outOfSync: true}, {outOfSync: {$exists: false}}]};

		query.t = 'r';
		const requests = RocketChat.models.Rooms.model.find(query).fetch();
		SystemLogger.info('Number of Requests to sync: ', requests.length);
		for (let i=0; i < requests.length; i++) {
			Meteor.defer(()=>Meteor.call('tryResync', requests[i]._id));
		}

		query.t = 'e';
		const topics = RocketChat.models.Rooms.model.find(query).fetch();
		SystemLogger.info('Number of Topics to sync: ', topics.length);
		for (let i=0; i < topics.length; i++) {
			Meteor.defer(()=>Meteor.call('tryResync', topics[i]._id));
		}

		return {
			message: 'sync-triggered-successfully'
		};
	}
});

Meteor.methods({
	markMessageAsSynced(messageId) {
		const messageDB = RocketChat.models.Messages;
		const message = messageDB.findOneById(messageId);
		const lastUpdate = message ? message._updatedAt : 0;
		if (lastUpdate) {
			messageDB.model.update(
				{_id: messageId},
				{
					$set: {
						lastSync: lastUpdate
					}
				});
			SystemLogger.debug('Message Id: ', messageId, ' has been synced');
		} else {
			SystemLogger.debug('Message Id: ', messageId, ' can not be synced');
		}
	}
});

Meteor.methods({
	markRoomAsUnsynced(rid) {
		RocketChat.models.Rooms.model.update(
			{_id: rid},
			{
				$set: {
					outOfSync: true
				}
			});
		SystemLogger.debug('Room Id: ', rid, ' is out of sync');
	}
});

Meteor.methods({
	tryResync(rid) {
		SystemLogger.debug('Sync all unsynced messages in room: ', rid);
		const room = RocketChat.models.Rooms.findOneById(rid);
		const messageDB = RocketChat.models.Messages;
		const unsync = messageDB.find({ lastSync: { $exists: false }, rid, t: { $exists: false } }).fetch();
		if (unsync.length === 0 && !room.outOfSync) {
			SystemLogger.debug('Room is already in sync');
			return true;
		} else {
			SystemLogger.debug('Messages out of sync: ', unsync.length);
		}
		let conversation;

		// conversation exists for channel?
		SystemLogger.debug('Smarti - Trying legacy service to retrieve conversation ID...');
		conversation = SmartiProxy.propagateToSmarti(verbs.get,
			`legacy/rocket.chat?channel_id=${ rid }`, null, (error) => {
				// 404 is expected if no mapping exists
				if (typeof error.response === 'undefined') {
					return null;
				}
				if (error.response.statusCode === 404) {
					return false;
				}
			});

		// console.log('Conversation from legacy', conversation);

		if (conversation === null) {
			SystemLogger.debug('Can not sync Smarti - connection not available');
			return false;
		} else if (!conversation) {
			SystemLogger.debug('Conversation not found - create new conversation');
			const supportArea = room.parentRoomId || room.topic || room.expertise;
			conversation = {
				'meta': {
					'support_area': [supportArea],
					'channel_id': [rid]
				},
				'user': {
					'id': room.u._id
				},
				'messages': [],
				'context': {
					'contextType': 'rocket.chat'
				}
			};
		} else {
			SmartiProxy.propagateToSmarti(verbs.delete,
				`conversation/${ conversation.id }`, null);
			SystemLogger.debug('Deleted old conversation - ready to sync');
		}

		let messages;
		if (room.closedAt) {
			messages = messageDB.find({rid, ts: {$lt: room.closedAt}}, { sort: { ts: 1 } }).fetch();
			conversation.meta.status = 'Complete';
		} else {
			messages = messageDB.find({rid}, { sort: { ts: 1 } }).fetch();
		}

		conversation.messages = [];
		for (let i=0; i < messages.length; i++) {
			const newMessage = {
				'id': messages[i]._id,
				'time': messages[i].ts,
				'origin': 'User', //user.type,
				'content': messages[i].msg,
				'user': {
					'id': messages[i].u._id
				}
			};
			conversation.messages.push(newMessage);
		}

		SmartiProxy.propagateToSmarti(verbs.post, 'conversation', conversation);
		SystemLogger.debug('New conversation updated with Smarti');
		for (let i=0; i < messages.length; i++) {
			Meteor.defer(()=>Meteor.call('markMessageAsSynced', messages[i]._id));
		}
		RocketChat.models.Rooms.model.update(
			{_id: rid},
			{
				$set: {
					outOfSync: false
				}
			});
		SystemLogger.debug('Room Id: ', rid, ' is in sync now');
		return true;
	}
});
