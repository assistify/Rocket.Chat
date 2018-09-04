/* UserRoles RoomRoles*/
import { RocketChat } from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';

/*
 * When a repostedMessage is eligible to be answered as a independent question then it can be threaded into a new channel.
 * When threading, the question is re-posted into a new room. To leave origin traces between the messages we update
 * the original repostedMessage with system repostedMessage to allow user to navigate to the repostedMessage created in the new Room and vice verse.
 */
export class ThreadBuilder {
	constructor(parentRoomId, openingQuestion) {
		this._openingQuestion = openingQuestion;
		if (!this._openingQuestion.u) {
			this._openingQuestion.u = Meteor.user();
		}
		this._parentRoomId = parentRoomId;
	}

	static getNextId() {
		const settingsRaw = RocketChat.models.Settings.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

		const query = {
			_id: 'Thread_Count'
		};
		const update = {
			$inc: {
				value: 1
			}
		};
		const findAndModifyResult = findAndModify(query, null, update);
		return findAndModifyResult.value.value;
	}

	static getRoom(roomId) {
		return RocketChat.models.Rooms.findOne(roomId);
	}

	_postMessage(room, user, repostedMessage, attachments, channels, mentions) {
		attachments = attachments || [];

		//sendMessage expects the attachments timestamp to be a string, => serialize it
		attachments.forEach(attachment =>
			attachment.ts = attachment.ts ? attachment.ts.toISOString() : ''
		);
		const newMessage = { _id: Random.id(), rid: room.rid, msg: repostedMessage, attachments, channels, mentions };
		return RocketChat.sendMessage(user, newMessage, room);
	}

	_getMessageUrl(msgId) {
		const siteUrl = RocketChat.settings.get('Site_Url');
		return `${ siteUrl }${ siteUrl.endsWith('/') ? '' : '/' }?msg=${ msgId }`;
	}

	_linkMessages(roomCreated, parentRoom, repostedMessage) {
		const rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
		if (rocketCatUser && Meteor.userId()) {
			/* Add link in parent Room */

			const linkMessage = Object.assign({}, this._openingQuestion); // shallow copy of the original message
			delete linkMessage._id;

			const repostingUser = Meteor.user();
			linkMessage.u = {
				_id: repostingUser._id,
				username: repostingUser.username,
				name: repostingUser.name
			};

			linkMessage.mentions = [{
				_id: repostingUser._id, // Thread Initiator
				name: repostingUser.username // Use @Name field for navigation
			}].concat(this._openingQuestion.mentions||[]);

			linkMessage.channels = [{
				_id: roomCreated._id, // Parent Room ID
				name: roomCreated.name,
				initialMessage: {
					_id: repostedMessage._id,
					text: repostedMessage.msg
				}
			}];

			const messageQuoteAttachment = { // @see pinMessage.js
				message_link: FlowRouter.path('message', { id: repostedMessage._id }),
				text: this._openingQuestion.msg,
				ts: this._openingQuestion.ts
			};

			if (repostingUser._id !== this._openingQuestion.u._id) {
				messageQuoteAttachment.author_name = this._openingQuestion.u.username;
				messageQuoteAttachment.author_icon = getAvatarUrlFromUsername(this._openingQuestion.u.username);
			}

			linkMessage.attachments = [messageQuoteAttachment].concat(this._openingQuestion.attachments||[]);

			linkMessage.urls = [{url: this._getMessageUrl(repostedMessage._id)}];

			return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('create-thread', parentRoom._id, this._getMessageUrl(repostedMessage._id), rocketCatUser, linkMessage, {ts: this._openingQuestion.ts});
		}
	}

	_getMembers() {
		const checkRoles = ['owner', 'moderator', 'leader'];
		const members = [];
		const users = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(this._parentRoomId, {
			fields: {
				'u._id': 1,
				'u.username': 1
			}
		}).fetch().map(s => {
			return {
				id: s.u._id,
				username: s.u.username
			};
		});
		// filter on owner, moderators and those online (see @here-implementation)
		for (const user of users) {
			if (!RocketChat.authz.hasRole(user.id, checkRoles, this._parentRoomId)) {
				// TODO: Use a mass-read-access: Filter the non-owner/moderators and use them in an $in-query. Afterwards, add them all
				RocketChat.models.Users.findOne({
					_id: user.id,
					status: {
						$in: ['online', 'away', 'busy']
					}
				});
				if (!user) {
					continue;
					// user.splice(users.indexOf(user), 1); //remove offline user
				}
			}
			members.push(user.username);
		}
		return members;
	}

	create() {
		const parentRoom = ThreadBuilder.getRoom(this._parentRoomId);
		// Generate RoomName for the new room to be created.
		this.name = `${ parentRoom.name || parentRoom.usernames.join('-') }-${ ThreadBuilder.getNextId() }`;
		const threadRoomType = parentRoom.t === 'd' ? 'p' : parentRoom.t;
		const threadRoom = RocketChat.createRoom(threadRoomType, this.name, Meteor.user() && Meteor.user().username, this._getMembers(), false,
			{
				announcement: this._openingQuestion.msg,
				topic: parentRoom.name ? parentRoom.name : '',
				parentRoomId: this._parentRoomId
			});

		// Create messages in the newly created thread and it's parent which link the two rooms
		const room = RocketChat.models.Rooms.findOneById(threadRoom.rid);
		if (room && parentRoom) {
			// Post message
			const repostedMessage = this._postMessage(
				room,
				this._openingQuestion.u,
				this._openingQuestion.msg,
				this._openingQuestion.attachments ? this._openingQuestion.attachments.filter(attachment => attachment.type && attachment.type === 'file') : []
			);
			// Link messages
			this._linkMessages(room, parentRoom, repostedMessage);
		}

		return threadRoom;
	}
}

// Expose the functionality to the client as method
Meteor.methods({
	createThread(parentRoomId, openingQuestion) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ThreadCreation' });
		}

		return new ThreadBuilder(parentRoomId, openingQuestion).create();
	},
	createThreadFromMessage(openingQuestion) {
		const thread = Meteor.call('createThread', openingQuestion.rid, openingQuestion);
		if (thread) {
			//remove the original repostedMessage from the display
			RocketChat.models.Messages.setHiddenById(openingQuestion._id);
			return thread;
		}
	}
});
