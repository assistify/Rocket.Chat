Meteor.methods({
	getRoomNameAndTypeByNameOrId(nameOrId) {
		check(nameOrId, String);
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomNameAndTypeByNameOrId'
			});
		}

		const room = RocketChat.models.Rooms.findOne({$or: [{name: nameOrId}, {_id:nameOrId}]});

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameAndTypeByNameOrId'
			});
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(nameOrId, userId, { fields: { _id: 1 } });
		if (subscription) {
			return { t: room.t, name: room.name };
		}

		if (room.t !== 'c' || RocketChat.authz.hasPermission(userId, 'view-c-room') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameAndTypeByNameOrId'
			});
		}

		return { t: room.t, name: room.name };
	}
});
