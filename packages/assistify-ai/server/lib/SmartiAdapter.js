/* globals SystemLogger, RocketChat */

import {SmartiProxy, verbs} from '../SmartiProxy';

/**
 * The SmartiAdapter handles the interaction with Smarti triggered by Rocket.Chat hooks (not by Smarti widget).
 * This adapter has no state, as all settings are fully buffered. Thus, the complete class is static.
 */
export class SmartiAdapter {

	static get rocketWebhookUrl() {
		let rocketUrl = RocketChat.settings.get('Site_Url');
		rocketUrl = rocketUrl ? rocketUrl.replace(/\/?$/, '/') : rocketUrl;
		return `${ rocketUrl }api/v1/smarti.result/${ RocketChat.settings.get('Assistify_AI_RocketChat_Webhook_Token') }`;
	}

	static get smartiKnowledgeDomain() {
		return RocketChat.settings.get('Assistify_AI_Smarti_Domain');
	}

	static _updateMapping(roomId, conversationId, timestamp) {
		// update/insert channel/conversation specific timestamp
		RocketChat.models.LivechatExternalMessage.update(
			{
				_id: roomId
			}, {
				rid: roomId,
				knowledgeProvider: 'smarti',
				conversationId,
				ts: timestamp
			}, {
				upsert: true
			}
		);
	}

	/**
	 *
	 * @param {*} roomId - the room for which the Smarti conversationId shall be retrieved
	 * @param {*} message - An optional message for detsailed mapping information
	 */
	static _getConversationId(roomId, message) {
		const smartiResponse = RocketChat.models.LivechatExternalMessage.findOneById(roomId);
		let conversationId;

		// conversation exists for channel?
		if (smartiResponse && smartiResponse.conversationId) {
			conversationId = smartiResponse.conversationId;
		} else {
			SystemLogger.debug('Smarti - Trying legacy service to retrieve conversation ID...');
			const conversation = SmartiProxy.propagateToSmarti(verbs.get,
				`legacy/rocket.chat?channel_id=${ roomId }`, null, (error) => {
					// 404 is expected if no mapping exists
					if (error.response.statusCode === 404) {
						return null;
					}
				});
			if (conversation && conversation.id) {
				conversationId = conversation.id;
				const timestamp = message ? message.ts : Date.now();
				SmartiAdapter._updateMapping(roomId, conversationId, timestamp);
			}
		}

		return conversationId;
	}

	/**
	 * Event implementation that posts the message to Smarti.
	 *
	 * @param {object} message: {
	 *   _id: STRING,
	 *   rid: STRING,
	 *   u: {*},
	 *   msg: STRING,
	 *   ts: NUMBER,
	 *   origin: STRING
	 * }
	 *
	 * @returns {*}
	 */
	static onMessage(message) {
		const requestBodyMessage = {
			'id': message._id,
			'time': message.ts,
			'origin': 'User', //user.type,
			'content': message.msg,
			'user': {
				'id': message.u._id
			}
			//,"private" : false
		};

		SystemLogger.debug('Message:', requestBodyMessage);

		let conversationId = SmartiAdapter._getConversationId(message.rid, message);

		if (conversationId) {
			SystemLogger.debug(`Conversation ${ conversationId } found for channel ${ message.rid }`);
			if (message.editedAt) {
				SystemLogger.debug('Trying to update existing message...');
				// update existing message
				SmartiProxy.propagateToSmarti(verbs.put, `conversation/${ conversationId }/message/${ requestBodyMessage.id }`, requestBodyMessage, (error) => {
					// 404 is expected if message doesn't exist
					if (error.response.statusCode === 404) {
						SystemLogger.debug('Message not found!');
						SystemLogger.debug('Adding new message to conversation...');
						SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ conversationId }/message`, requestBodyMessage);
					}
				});
			} else {
				SystemLogger.debug('Adding new message to conversation...');
				SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ conversationId }/message`, requestBodyMessage);
			}
		} else {
			SystemLogger.debug('Conversation not found for channel');
			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(message.rid);
			const room = RocketChat.models.Rooms.findOneById(message.rid);

			// The "support_area" in Smarti is an optional property. A historic conversation belonging to the same support_are increases relevance
			let supportArea = room.parentRoomId || room.topic || room.expertise;
			if (!supportArea) {
				if (room.t === '') {
					supportArea = 'livechat';
				} else if (helpRequest && helpRequest.supportArea) {
					supportArea = helpRequest.supportArea;
				} else {
					supportArea = room.name;
				}
			}

			SystemLogger.debug('HelpRequest:', helpRequest);
			SystemLogger.debug('Room:', room);

			const requestBodyConversation = {
				'meta': {
					'support_area': [supportArea],
					'channel_id': [message.rid]
				},
				'user': {
					'id': room.u ? room.u._id : room.v._id
				},
				'messages': [requestBodyMessage],
				'context': {
					'contextType': 'rocket.chat'
				}
			};

			SystemLogger.debug('Creating conversation:', JSON.stringify(requestBodyConversation, null, '\t'));
			// create conversation, send message along and request analysis

			const conversation = SmartiProxy.propagateToSmarti(verbs.post, 'conversation', requestBodyConversation);
			if (conversation && conversation.id) {
				conversationId = conversation.id;
				SmartiAdapter._updateMapping(message.rid, conversationId);
			}
		}

		// request analysis results
		const analysisResult = SmartiProxy.propagateToSmarti(verbs.get, `conversation/${ conversationId }/analysis`);
		SystemLogger.debug('analysisResult:', JSON.stringify(analysisResult, null, '\t'));
		if (analysisResult) {
			RocketChat.Notifications.notifyRoom(message.rid, 'newConversationResult', analysisResult);
		}
	}

	/**
	 * Event implementation for deletion of messages
	 * @param message  - the message which has just been deleted
	 */
	static afterMessageDeleted(message) {

		const conversationId = SmartiAdapter._getConversationId(message.rid, message);

		if (conversationId) {
			SystemLogger.debug(`Conversation ${ conversationId } found for channel ${ message.rid }`);

			SystemLogger.debug(`Deleting message from conversation ${ conversationId } ...`);
			// add message to conversation
			SmartiProxy.propagateToSmarti(verbs.delete, `conversation/${ conversationId }/message/${ message._id }`);
		}
	}

	/**
	 * Propagates the deletion of a complete conversation to Smarti
	 * @param room - the room just deleted
	 */
	static afterRoomErased(room) { //async
		const conversationId = SmartiAdapter._getConversationId(room._id);

		if (conversationId) {
			SmartiProxy.propagateToSmarti(verbs.delete, `/conversation/${ conversationId }`);
		} else {
			SystemLogger.error(`Smarti - closing room failed: No conversation id for room: ${ room._id }`);
		}
	}

	/**
	 * Event implementation that publishes the conversation in Smarti.
	 *
	 * @param room - the room to close
	 *
	 * @returns {*}
	 */
	static onClose(room) { //async
		const conversationId = SmartiAdapter._getConversationId(room._id);

		if (conversationId) {
			SmartiProxy.propagateToSmarti(verbs.put, `/conversation/${ conversationId }/meta.status`, 'Complete');
		} else {
			SystemLogger.error(`Smarti - closing room failed: No conversation id for room: ${ room._id }`);
		}
	}

	/**
	 * This method provides an implementation for a hook registering an asynchronously sent response from Smarti to RocketChat
	 *
	 * @param roomId
	 * @param smartiConversationId
	 * @param token
	 */
	static analysisCompleted(roomId, smartiConversationId, token) {
		RocketChat.models.LivechatExternalMessage.update(
			{
				_id: roomId
			}, {
				rid: roomId,
				knowledgeProvider: 'smarti',
				conversationId: smartiConversationId,
				token,
				ts: new Date()
			}, {
				upsert: true
			}
		);

		RocketChat.Notifications.notifyRoom(roomId, 'newConversationResult', RocketChat.models.LivechatExternalMessage.findOneById(roomId));
	}
}
