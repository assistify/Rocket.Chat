RocketChat.saveRoomPrivacy= function(rid, value = false) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomType'
		});
	}
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room == null) {
		throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
			'function': 'RocketChat.saveRoomType',
			_id: rid
		});
	}
	if (room.t === 'd') {
		throw new Meteor.Error('error-direct-room', 'Can\'t change type of direct rooms', {
			'function': 'RocketChat.saveRoomType'
		});
	}
	const result = RocketChat.models.Rooms.setPrivacyById(rid, value);
	return result;
};
