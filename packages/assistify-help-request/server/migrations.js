/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

const removeObsoleteSubscriptions = function() {
	let counter = 0;
	RocketChat.models.Subscriptions.model.aggregate([
		{
			'$lookup': {
				'from': 'users',
				'localField': 'u._id',
				'foreignField': '_id',
				'as': 'users'
			}
		},
		{'$match': {'users._id': {'$exists': false}}}
	]).forEach(function(errSubscription) {
		// we can bypass the cached collection as this will affect obsolete values
		RocketChat.models.Subscriptions.model.remove({_id: errSubscription._id.toString()});
		counter++;
	});
	return counter;
};

function makePrivateRoomsSecret() {
	let count = 0;
	RocketChat.models.Rooms.findByType('p').forEach((room) => {
		if ('customFields' in room) {
			if ('secretRoom' in room.customFields) {
				return;
			}
		}
		RocketChat.models.Rooms.setPrivacyById(room._id, true);
		count++;
	});
	return count;
}

Meteor.startup(() => {
	const count = removeObsoleteSubscriptions();
	if (count) {
		console.log('Removed', count, 'erroneous subscriptions');
	}
	const PrivateRoomUpdated = makePrivateRoomsSecret();
	if (PrivateRoomUpdated) {
		console.log('Migrated', PrivateRoomUpdated, 'Private Room(s) Privacy is set to secret');
	}
});
