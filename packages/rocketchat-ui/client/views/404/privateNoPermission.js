Template.privateNoPermission.helpers({
	data() {
		return Session.get('privateNoPermission');
	},
	name() {
		return Blaze._escape(this.name);
	},
	sameUser() {
		const user = Meteor.user();
		return user && user.username === this.name;
	},
	joinRoomRequest() {
		const instance = Template.instance();
		return instance.joinRoomRequest.get();
	},
	roomName() {
		return this.name;
	},
	requestStatus() {
		const instance = Template.instance();
		return instance.joinRoomStatus.get();
	}
});

Template.privateNoPermission.events({
	'click .joinRoomRequest'(e, t) {
		Meteor.call('joinRoomRequest', this.name, Meteor.user(), (err, result) => {
			if (err) {
				return err;
			}
			t.joinRoomStatus.set(result.attachments[0].fields[0].status);
			t.joinRoomRequest.set(false);
		});
	}
});

Template.privateNoPermission.onCreated(function() {
	const instance = this;
	instance.joinRoomRequest = new ReactiveVar(true);
	instance.joinRoomStatus = new ReactiveVar(null);
});
