import { RocketChat } from 'meteor/rocketchat:lib';

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
				subscription = RocketChat.models.Subscriptions.createWithRoomAndUser(request, user);
			}

			if (expertise) {
				const expertiseSubscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(expertise._id, user._id);
				if (expertiseSubscription) {
					RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, expertiseSubscription.desktopNotifications);
					RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, expertiseSubscription.mobilePushNotifications);
					RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, expertiseSubscription.emailNotifications);
					RocketChat.models.Subscriptions.updateAudioNotificationsById(subscription._id, expertiseSubscription.audioNotifications);
				}
			} else {
				// Fallback: notify everything
				RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, 'all');
				RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, 'all');
				RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, 'all');
			}
		});
	}
	_postMessage(room, user, msg) {
		const msgObject = {_id: Random.id(), rid: room.rid, msg};
		return RocketChat.sendMessage(user, msgObject, room);
	}

	//abstract method must be implemented.
	create() {
	}

}


