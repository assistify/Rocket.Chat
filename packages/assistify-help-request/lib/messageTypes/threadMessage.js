/* globals RocketChat */
import { RocketChat } from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';
RocketChat.MessageTypes.registerType({
	id: 'thread-started-message',
	system: true,
	message: 'Thread_started_message',
	data(message) {
		/* Thread Start Message
		 * @Returns
		 * Thread Initiator
		 * Thread Room
		 * */
		return {
			initiator: ` <a class="mention-link" data-username= "${ message.mentions[0].name }" >${ message.mentions[0].name } </a> `,
			author: ` <a class="mention-link" data-username= "${ message.u.username }" >${ message.u.username }</a>`
		};
	}
});
RocketChat.MessageTypes.registerType({
	id: 'thread-started-message-self',
	system: true,
	message: 'Thread_started_message_self',
	data(message) {
		/* Thread Start Message
		 * @Returns
		 * Thread Initiator
		 * Thread Room
		 * */
		return {
			initiator: ` <a class="mention-link" data-username= "${ message.mentions[0].name }" >${ message.mentions[0].name } </a> `,
			author: ` <a class="mention-link" data-username= "${ message.u.username }" > </a>`
		};
	}
});
RocketChat.MessageTypes.registerType({
	id: 'thread-welcome-message',
	system: true,
	message: 'Thread_welcome_message',
	data(message) {
		/* Thread Welcome Message
		  * @Returns
		 * Thread Initiator
		 * Parent Room Name
		 * Original Message
		  * */
		const room = RocketChat.models.Rooms.findOne({_id: message.channels[0]._id});
		let attachEvents = true;
		for (const e of Template.room.__eventMaps) {
			if (Object.keys(e).find(eventName => eventName === 'click .mention-request' || eventName === 'click .mention-expertise')) {
				attachEvents = false; // we do not need to attach the events again and again.
			}
		}
		if (attachEvents) {
			Template.room.events({
				'click .mention-request'(event) {
					//Get the request path for router navigation
					FlowRouter.go('request', {name: $(event.currentTarget).data('request')});
				},
				'click .mention-expertise'(event) {
					//Get the expertise path for router navigation
					FlowRouter.go('expertise', {name: $(event.currentTarget).data('expertise')});
				},
				'click .mention-group'(event) {
					//Get the group path for router navigation
					FlowRouter.go('group', {name: $(event.currentTarget).data('group')});
				}
			});
		}
		/* Replace the place holder values of the system message*/
		if (room.t === 'r') {
			return {
				initiator: ` <a class="mention-link" data-username= "${ message.mentions[0].name }" >${ message.mentions[0].name } </a> `,
				roomName: ` <a class="mention-request" data-request="${ room.name }">${ room.fname || room.name } </a>`
			};
		} else if (room.t === 'e') {
			return {
				initiator: ` <a class="mention-link" data-username= "${ message.mentions[0].name }" >${ message.mentions[0].name } </a> `,
				roomName: ` <a class="mention-expertise" data-expertise="${ room.name }">${ room.fname || room.name } </a>`
			};
		} else if (room.t === 'p') {
			return {
				initiator: ` <a class="mention-link" data-username= "${ message.mentions[0].name }" >${ message.mentions[0].name } </a> `,
				roomName: ` <a class="mention-group" data-group="${ room.name }">${ room.fname || room.name } </a>`
			};
		}
		return {
			initiator: ` <a class="mention-link" data-username= "${ message.mentions[0].name }" >${ message.mentions[0].name } </a> `,
			roomName: ` <a class="mention-link" data-channel="${ room.name }" >${ room.fname || room.name } </a>`
		};
	}
});
