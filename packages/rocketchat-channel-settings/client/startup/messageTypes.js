Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'room_changed_privacy',
		system: true,
		message: 'room_changed_privacy',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_type: t(message.msg)
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_topic',
		system: true,
		message: 'room_changed_topic',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_topic: message.msg
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_announcement',
		system: true,
		message: 'room_changed_announcement',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_announcement: message.msg
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_description',
		system: true,
		message: 'room_changed_description',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_description: message.msg
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'ask_for_group_invite',
		system: true,
		message: 'ask_for_group_invite',
		data(message) {
			Template.room.events({
				'click .rc-button-accept'() {
					Meteor.call('addUserToRoom', { rid: message.rid, username: message.name });
					Meteor.call('notifyUser', message.rid, message.name);
				}
			});
			return {
				user: ` <a class="mention-link" data-username= "${ message.name }" >${ message.name } </a> `,
				accept: '<button class="rc-button rc-button--small rc-button-accept">accept</button>'
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'notify_user_that_he_was_accepted',
		system: true,
		message: 'notify_user_that_he_was_accepted',
		data(message) {
			const room = message.room;
			Template.room.events({
				'click .mention-group'(event) {
					//Get the request path for router navigation
					FlowRouter.go('group', {name: $(event.currentTarget).data('group')});
				}
			});
			return {
				user: ` <a class="mention-link" data-username= "${ message.name }" >${ message.name } </a> `,
				roomname: ` <a class="mention-group" data-group="${ room.name }">${ room.fname || room.name } </a>`
			};
		}
	});
});
