/* globals SystemLogger */

import {Mongo} from 'meteor/mongo';
import {Chatpal} from '../config/config';

class ChatpalBotService {

	constructor() {
		this._regex = />(\S+)/gi;
		this._bot_collection = new Mongo.Collection('chatpal_bots');
		this._botstatus_collection = new Mongo.Collection('chatpal_botstatus');
	}

	setBaseUrl(url) {
		this.baseUrl = url;
	}

	findOneByMessage(msg) {
		const pattern = this._regex.exec(msg);
		if (pattern && pattern[1]) {
			const bot = this._bot_collection.findOne({pattern:pattern[1].toLowerCase()});
			if (bot) {
				return bot.bot;
			}
			return false;
		}
		return false;
	}

	listBots() {

	}

	_createAnswer(answer) {
		switch (answer.type) {
			case ('button'):
				let bts = 'Die Möglickeiten sind: ';
				answer.buttons.forEach(function(b, i) {
					bts += `${ b.text } (${ b.value })`;
					if (i+1 === answer.buttons.length) { bts += '.'; } else { bts += ', '; }
				});
				return {msg:`${ answer.text } ${ bts }`};
			default: return {msg:answer.text};
		}
	}

	sendMessage(bot, user, message, room) {

		if (!this.baseUrl) { return console.log('Bot endpoint not conneced'); }

		this._botstatus_collection.update({user:user._id}, {user:user._id, bot}, {upsert:true}, () => {

			const msg = {
				type: 'text',
				value: message,
				context: {
					username: user.name || user.username
				}
			};

			const URL = `${ this.baseUrl }/message/${ bot }?user=${ user._id }`;

			const response = HTTP.post(URL, {data:msg, headers:{'content-Type':'application/json; charset=utf-8'}});

			if (response.statusCode === 200) {
				SystemLogger.debug('Send cerbot request successfully:', JSON.stringify(response, null, 2));

				const bot_user = Chatpal.service.BotService.getBotUser();

				response.data.forEach((answer) => {
					if (answer.type !== 'system') {
						RocketChat.sendMessage(
							bot_user,
							this._createAnswer(answer),
							room
						);
					} else if (answer.text === 'end') {
						this._botstatus_collection.remove({user:user._id});
					}

				});
			} else {
				SystemLogger.error('Sending cerbot request failed:', JSON.stringify(response, null, 2));
			}

		});
	}

	getCurrentBot(user) {
		const status = this._botstatus_collection.findOne({user});
		if (status) {
			return status.bot;
		}
		return false;
	}

	getHelpMessage() {
		return 'Kon i ned';
	}

	static getBotName() {
		return 'chatpal';
	}

	getBotUser() {
		return RocketChat.models.Users.findById('chatpal').fetch()[0];
	}
}

Chatpal.service.BotService = new ChatpalBotService();

RocketChat.settings.get('CHATPAL_BOT_BASEURL', (id, value)=>{
	Chatpal.service.BotService.setBaseUrl(value);
});

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	if (!message.editedAt && room.t === 'd' && room.usernames.includes(ChatpalBotService.getBotName()) && message.u.username !== ChatpalBotService.getBotName()) {
		const current = Chatpal.service.BotService.getCurrentBot(message.u._id) || Chatpal.service.BotService.findOneByMessage(message.msg) ;
		if (current) {
			Chatpal.service.BotService.sendMessage(current, message.u, message.msg, room);
		} else {



			RocketChat.sendMessage(
				Chatpal.service.BotService.getBotUser(),
				{msg:'Sorry, das kann ich nicht'},
				room
			);
		}

	}
});
