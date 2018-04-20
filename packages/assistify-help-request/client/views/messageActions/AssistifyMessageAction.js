import {RocketChat} from 'meteor/rocketchat:lib';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveVar} from 'meteor/reactive-var';

Meteor.startup(function() {
	const instance = this;
	instance.room = new ReactiveVar('');
	RocketChat.MessageAction.addButton({
		id: 'start-thread',
		icon: 'thread',
		label: 'Thread_start',
		context: ['message', 'message-mobile'],
		action() {
			const question = this._arguments[1];
			const modalConfig = {
				title: t('create-r'),
				text: t('Threading_about'),
				type: 'info',
				showCancelButton: true,
				confirmButtonText: t('Create'),
				cancelButtonColor: '#DD6B55',
				cancelButtonText: t('Cancel'),
				closeOnConfirm: true,
				html: false
			};
			modal.open(
				modalConfig, () => {
					Meteor.call('createRequestFromRoomId', question.rid, question, function(error, result) {
						if (result) {
							const roomCreated = RocketChat.models.Rooms.findOne({_id: result.rid});
							FlowRouter.go('request', {name: roomCreated.name}, FlowRouter.current().queryParams);
						}
					});
				});
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}
			if (message.u._id !== Meteor.userId()) {
				return RocketChat.authz.hasAtLeastOnePermission('start-thread-other-user');
			} else {
				return RocketChat.authz.hasAtLeastOnePermission('start-thread');
			}
		},
		order: 0,
		group: 'menu'
	});
});
