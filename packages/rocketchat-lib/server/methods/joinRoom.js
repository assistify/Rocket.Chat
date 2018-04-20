Meteor.methods({
	joinRoom(rid, code) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'joinRoom' });
		}

		// TODO we should have a 'beforeJoinRoom' call back so external services can do their own validations
		const user = Meteor.user();
		if (room.tokenpass && user && user.services && user.services.tokenpass) {
			const balances = RocketChat.updateUserTokenpassBalances(user);

			if (!RocketChat.Tokenpass.validateAccess(room.tokenpass, balances)) {
				throw new Meteor.Error('error-not-allowed', 'Token required', { method: 'joinRoom' });
			}
		} else {
			if ((room.t !== 'c') || (RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true)) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
			}

			if ((room.joinCodeRequired === true) && (code !== room.joinCode) && !RocketChat.authz.hasPermission(Meteor.userId(), 'join-without-join-code')) {
				throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', { method: 'joinRoom' });
			}
		}

		return RocketChat.addUserToRoom(rid, user);
	}
});

Meteor.methods({
	askJoin(name, user) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'askJoin' });
		}

		const room = RocketChat.models.Rooms.findOneByName(name);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'askJoin' });
		}


		console.log(user, name);
		const rocketCatUser = RocketChat.models.Users.findOneByUsername('rocket.cat');
		if (rocketCatUser && user) {
			RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('ask_for_group_invite', room._id, 'test', rocketCatUser,
				{
					name: user.username,
					rid: room._id
				});
		}
	}
});

Meteor.methods({
	notifyUser(rname, user) {
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'askJoin' });
		}
		const to = RocketChat.models.Users.findOneByUsername(user);
		const cat = RocketChat.models.Users.findOneByUsername('rocket.cat');
		const rid = [cat._id, to._id].sort().join('');
		const room = RocketChat.models.Rooms.findOneById(rname);

		console.log(to, cat, rid);
		console.log(user, rname, room);

		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('notify_user_that_he_was_accepted', rid, 'test', cat,
			{
				name: user.username,
				room
			});
	}
});
