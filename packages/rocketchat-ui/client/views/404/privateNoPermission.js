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
	}
});

Template.privateNoPermission.events({
	'click .askJoin'(event) {
		event.stopPropagation();
		event.preventDefault();
		Meteor.call('askJoin', this.name, Meteor.user(), (err) => {
			if (err != null) {
				toastr.error(t(err.reason));
			}
		});
	}
});
