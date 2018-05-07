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
	roomJoinRequest() {
		const instance = Template.instance();
		return instance.roomJoinRequest.get();
	},
	roomName() {
		return this.name;
	},
	requestStatus() {
		return 'pending';
	}
});

Template.privateNoPermission.events({
	'click .roomJoinRequest'(e, t) {
		Meteor.call('roomJoinRequest', this.name, Meteor.user(), (err) => {
			if (err != null) {
				console.log(err);
				toastr.error(t(err.reason));
			}
		});
	}
});

Template.privateNoPermission.onCreated(function() {
	const instance = this;
	instance.roomJoinRequest = new ReactiveVar(true);
});
