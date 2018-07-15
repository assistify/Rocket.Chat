import { RocketChat } from 'meteor/rocketchat:lib';
import { SystemLogger } from 'meteor/rocketchat:logger';

export class CreateRequestBase {
	constructor(openingQuestion) {
		this._openingQuestion = openingQuestion;
	}

	static getNextId() {
		const settingsRaw = RocketChat.models.Settings.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

		const query = {
			_id: 'Assistify_Room_Count'
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

	_createNotifications(requestId, usernames) {
		const request = RocketChat.models.Rooms.findOneById(requestId);
		const expertise = RocketChat.models.Rooms.findByNameContainingAndTypes(request.expertise, 'e').fetch()[0];

		usernames.forEach((username) => {
			const user = RocketChat.models.Users.findOneByUsername(username);
			let subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(requestId, user._id);
			if (!subscription) {
				try {
					subscription = RocketChat.models.Subscriptions.createWithRoomAndUser(request, user);
				} catch (e) {
					// In some cases, particularly in mongo-replicasets in combination with caching (it seems)
					// the notification has already been create and a duplicate key index violation is thrown
					// => Consider it already done once the create of the subscription fails
					SystemLogger.info('Subscription for createroom could not be created explicitly', e);
					subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(requestId, user._id);
				}
			}

			if (expertise) {
				const expertiseSubscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(expertise._id, user._id);
				if (expertiseSubscription) {
					RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, expertiseSubscription.desktopNotifications || null);
					RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, expertiseSubscription.mobilePushNotifications || null);
					RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, expertiseSubscription.emailNotifications || null);
					RocketChat.models.Subscriptions.updateAudioNotificationsById(subscription._id, expertiseSubscription.audioNotifications || null);
				}
			} else {
				// Fallback: notify everything
				RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, 'all');
				RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, 'all');
				RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, 'all');
			}
		});
	}
	_postMessage(room, user, message, attachments) {
		attachments = attachments || [];

		//sendMessage expects the attachments timestamp to be a string, => serialize it
		attachments.forEach(attachment =>
			attachment.ts = attachment.ts ? attachment.ts.toISOString() : ''
		);
		const newMessage = { _id: Random.id(), rid: room.rid, msg: message, attachments };
		return RocketChat.sendMessage(user, newMessage, room);
	}

	//abstract method must be implemented.
	create() {
	}

}


