/* globals RocketChat */
import { RocketChat } from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { CreateRequestFactory } from './createRequestFactory';
import { CreateRequestBase } from './createRequestBase';
import {getKnowledgeAdapter} from 'meteor/assistify:ai';

/*
 * When a message is eligible to be answered as a independent question then it can be threaded into a new channel.
 * When threading, the question is re-posted into a new room. To leave origin traces between the messages we update
 * the original message with system message to allow user to navigate to the message created in the new Room and vice verse.
 */
export class CreateRequestFromRoomId extends CreateRequestBase {
	constructor(parentRoomId, openingQuestion) {
		super(openingQuestion);
		this._parentRoomId = parentRoomId;
	}

	_getMessageUrl(msgId) {
		return FlowRouter.path('message', { id: msgId });
	}

	_linkMessages(roomCreated, parentRoom) {
		const rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
		if (rocketCatUser && Meteor.userId()) {
			/**
			 * Parent Room
			 */
			RocketChat.models.Messages.updateMsgWithThreadMessage(
				Meteor.user().username === this._openingQuestion.u.username ? 'thread-started-message-self' : 'thread-started-message',
				this._openingQuestion._id,
				'',
				Meteor.user(),
				{
					mentions: [
						{
							_id: Meteor.user()._id, // Thread Initiator
							name: Meteor.user().username
						}]
				}
			);

			// The follwing lines would have the attachment remain at the original message.
			// if (this._openingQuestion.attachments) {
			// 	RocketChat.models.Messages.addMessageAttachments(this._openingQuestion._id, this._openingQuestion.attachments);
			// }

			/*
			 * Child Room
			 */
			RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('thread-welcome-message', roomCreated._id, this._getMessageUrl(this._openingQuestion._id), rocketCatUser,
				{
					mentions: [{
						_id: Meteor.user()._id, // Thread Initiator
						name: Meteor.user().username // Use @Name field for navigation
					}],
					channels: [{
						_id: parentRoom._id // Parent Room ID
					}]
				});
			// Re-post message in the new room
			const msgAuthor = RocketChat.models.Users.findOneByUsername(this._openingQuestion.u.username); // Search with the technical username
			const msgRePosted = this._postMessage(
				roomCreated,
				msgAuthor,
				this._openingQuestion.msg,
				this._openingQuestion.attachments ? this._openingQuestion.attachments.filter(attachment => attachment.type && attachment.type === 'file') : []
			);

			if (msgRePosted) {
				/* Add a reference to the original message which can be rendered for navigation */
				RocketChat.models.Messages.setMessageAttachments(this._openingQuestion._id, [{
					author_name: this._openingQuestion.u.username || this._openingQuestion.u.name,
					author_icon: `/avatar/${ this._openingQuestion.u.username }?_dc=0`,
					ts: this._openingQuestion.ts,
					fields: [{
						type: 'threadReference',
						value: this._openingQuestion.msg,
						threadUrl: this._getMessageUrl(msgRePosted._id)
					}]
				}]);
			}
		}
	}

	create() {
		const parentRoom = CreateRequestBase.getRoom(this._parentRoomId);
		// Generate RoomName for the new room to be created.
		this.name = `${ parentRoom.name }-${ CreateRequestBase.getNextId() }`;
		const roomCreateResult = RocketChat.createRoom('r', this.name, Meteor.user() && Meteor.user().username, parentRoom.usernames, false, { parentRoomId: this._parentRoomId });
		const knowledgeAdapter = getKnowledgeAdapter();
		knowledgeAdapter.afterCreateChannel(roomCreateResult.rid);

		if (parentRoom.t === 'e') {
			parentRoom.usernames.concat([Meteor.user().username]);
		}
		if (parentRoom.name) {
			RocketChat.saveRoomTopic(roomCreateResult.rid, parentRoom.name, Meteor.user());
		}
		// Invoke create notifications
		this._createNotifications(roomCreateResult.rid, parentRoom.usernames);
		// Instance of newly created room.
		const room = RocketChat.models.Rooms.findOneById(roomCreateResult.rid);
		if (room && parentRoom) {
			this._linkMessages(room, parentRoom);
		}
		const helpRequestId = RocketChat.models.HelpRequests.createForSupportArea(parentRoom.name, roomCreateResult.rid, '');
		//propagate help-id to room in order to identify it  as a "helped" room
		RocketChat.models.Rooms.addHelpRequestInfo(room, helpRequestId);
		return roomCreateResult;
	}
}

Meteor.methods({
	createRequestFromRoomId(parentRoomId, openingQuestion) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createRequestFromRoomId' });
		}
		const config = {
			parentRoomId,
			openingQuestion
		};
		return CreateRequestFactory.getInstance('r', config).create();
	}
});
