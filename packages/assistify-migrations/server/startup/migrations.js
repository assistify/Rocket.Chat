/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

Meteor.startup(() => {
	const topics = RocketChat.models.Rooms.findByType('e').fetch();
	//Update room type and parent room id for request
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

	//Update room type and parent room id for expertises
	RocketChat.models.Rooms.update({
		t: 'e'
	}, {
		$set: {
			oldType: 'e', // move the room type as old room type
			t: 'p' // set new room type to private room
		}
	}, {
		multi: true
	});

	//update subscriptions for requests
	RocketChat.models.Subscriptions.update({
		t: 'r'
	}, {
		$set: {
			oldType: 'r',
			t: 'p'
		}
	}, {
		multi: true
	});

	//update subscriptions for expertises
	RocketChat.models.Subscriptions.update({
		t: 'e'
	}, {
		$set: {
			oldType: 'e',
			t: 'p'
		}
	}, {
		multi: true
	});

});
