RocketChat.saveRoomSecracy= function(rid, value = false) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomSecracy'
		});
	}
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room == null) {
		throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
			'function': 'RocketChat.saveRoomSecracy',
			_id: rid
		});
	}
	return RocketChat.models.Rooms.setSecretById(rid, value);
};
