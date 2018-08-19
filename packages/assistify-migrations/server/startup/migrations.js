/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

Meteor.startup(() => {
	const topics = RocketChat.models.Rooms.findByType('e').fetch();
	RocketChat.models.Rooms.findByType('r').forEach((request) => {
		const update = {};
		if (!update.$set) {
			update.$set = {};
		}
		// prepare update fields
		if (request.expertise) {
			topics.find(topic => {
				if (request.expertise === topic.name) {
					update.$set.parentRoomId = topic._id;
				}
			});
		}
		update.$set.oldType = request.t;
		update.$set.t = 'p';
		// update requests
		RocketChat.models.Rooms.update({_id: request._id}, update);
	});
	//Update topics
	RocketChat.models.Rooms.update({
		t: 'e'
	}, {
		$set: {
			oldRoomType: 'e', // move the room type as old room type
			t: 'p' // set new room type to private room
		}
	}, {
		multi: true
	});
});
