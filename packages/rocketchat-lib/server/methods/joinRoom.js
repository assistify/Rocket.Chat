/* globals RocketChat */
Meteor.methods({
	joinRoom(rid, code) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'joinRoom'});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {method: 'joinRoom'});
		}

		// TODO we should have a 'beforeJoinRoom' call back so external services can do their own validations
		const user = Meteor.user();
		if (room.tokenpass && user && user.services && user.services.tokenpass) {
			const balances = RocketChat.updateUserTokenpassBalances(user);

			if (!RocketChat.Tokenpass.validateAccess(room.tokenpass, balances)) {
				throw new Meteor.Error('error-not-allowed', 'Token required', {method: 'joinRoom'});
			}
		} else {
			if ((room.t !== 'c') || (RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true)) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', {method: 'joinRoom'});
			}

			if ((room.joinCodeRequired === true) && (code !== room.joinCode) && !RocketChat.authz.hasPermission(Meteor.userId(), 'join-without-join-code')) {
				throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', {method: 'joinRoom'});
			}
		}

		return RocketChat.addUserToRoom(rid, user);
	}
});

Meteor.methods({
	joinRoomRequest(name, user, joinReason) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'joinRoomRequest'});
		}

		const room = RocketChat.models.Rooms.findOneByName(name);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {method: 'joinRoomRequest'});
		}

		const rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
		if (rocketCatUser && user) {
			const joinRequest = RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('join-room-request', room._id, user.username, rocketCatUser,
				{
					rid: room._id,
					attachments: [{
						fields: [{
							requester: user.username,
							type: 'joinRoomRequest',
							reason: joinReason,
							status: 'pending'
						}]
					}]
				});
			if (joinRequest) {
				RocketChat.models.Subscriptions.find({rid: room._id}).forEach((sub) => {
					// Subscriptions will be validated based on the authorization.
					if (RocketChat.authz.hasAtLeastOnePermission(sub.u._id, 'add-user-to-joined-room')) {
						sub.alert = true;
						RocketChat.models.Subscriptions.updateUnreadAlertById(sub._id, sub.alert);
					}
				});
			}
			return joinRequest;
		}
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'joinRoomRequest'});
	},
	updateJoinRoomStatus(roomId, message, status, responder) {
		check(status, String);
		if (!roomId) {
			throw new Meteor.Error('error-invalid-room-id', 'Invalid room Id', {method: 'updateJoinRoomStatus'});
		}
		message.attachments[0].fields[0].status = status;
		message.attachments[0].fields[0].responder = responder;
		return RocketChat.models.Messages.setMessageAttachments(message._id, message.attachments);
	},
	getJoinRoomStatus(roomName) {
		check(roomName, String);
		const room = RocketChat.models.Rooms.findOneByName(roomName);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {method: 'getJoinRoomStatus'});
		}
		return RocketChat.models.Messages.findByMsgTypeRoomAndUser('join-room-request', room._id, Meteor.user().username).fetch();
	},
	notifyUser(roomId, user) {
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'notifyUser'});
		}
		if (!roomId) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {method: 'notifyUser'});
		}
		const to = RocketChat.models.Users.findOneByUsername(user);
		const cat = RocketChat.models.Users.findOneByUsername('rocket.cat');
		const rid = [cat._id, to._id].sort().join('');
		const room = RocketChat.models.Rooms.findOneById(roomId);
		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('Notify_user_request_accepted', rid, 'test', cat,
			{
				name: user.username,
				room
			});
	}
});

