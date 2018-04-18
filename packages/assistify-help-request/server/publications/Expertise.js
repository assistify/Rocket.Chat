Meteor.publish('autocompleteExpertise', function(selector) {
	if (typeof this.userId === 'undefined' || this.userId === null) {
		return this.ready();
	}

	const user = RocketChat.models.Users.findOneById(this.userId);

	if (typeof user === 'undefined' || user === null) {
		return this.ready();
	}

	const pub = this;
	const options = {
		fields: {
			name: 1,
			t: 1
		},
		limit: 10
	};
	let cursorHandle = RocketChat.models.Rooms.findByNameContainingTypesAndTags(selector.term, [{type: 'e'}], options);
	if (RocketChat.models.Rooms.find({t: 'e'}).count() < 10 && cursorHandle.count() === 0) {
		cursorHandle = RocketChat.models.Rooms.findByNameContainingTypesAndTags('', [{type: 'e'}], options);
	}
	const observeChangesHandle = cursorHandle.observeChanges({
		added(_id, record) {
			return pub.added('autocompleteRecords', _id, record);
		},
		changed(_id, record) {
			return pub.changed('autocompleteRecords', _id, record);
		},
		removed(_id, record) {
			return pub.removed('autocompleteRecords', _id, record);
		}
	});

	this.ready();

	this.onStop(function() {
		return observeChangesHandle.stop();
	});
});
