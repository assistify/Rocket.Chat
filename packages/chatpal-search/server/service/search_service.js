/* globals SystemLogger */
import {Chatpal} from '../config/config';

const Future = Npm.require('fibers/future');
const moment = Npm.require('moment');

class SmartiBackendUtils {

	static getQueryParameterString(text, page, pagesize, /*filters*/) {
		return `?sort=time%20desc&fl=id,message_id,meta_channel_id,user_id,time,message,type&hl=true&hl.fl=message&df=message&q=${ encodeURIComponent(text) }&start=${ (page - 1) * pagesize }&rows=${ pagesize }`;
	}

	static alignResponse(result) {
		const docs = [];
		result.response.forEach(function(doc) {
			docs.push({
				type: doc.type,
				subtype: 'c',
				room: doc.meta_channel_id[0],
				id: doc.message_id,
				text: doc.message,
				highlight_text: result.highlighting[doc.id] ? result.highlighting[doc.id].message[0] : undefined,
				user: doc.user_id,
				date: doc.time
			});
		});

		return {
			numFound: result.meta.numFound,
			start: result.meta.start,
			docs
		};
	}

	static bootstrap() {
		console.log('no bootstrap required for smarti backend');
	}

}

/**
 * The chatpal search service calls solr and returns result
 * ========================================================
 */
class ChatpalSearchService {

	constructor() {
		this.backendUtils = SmartiBackendUtils;
	}

	setBaseUrl(url) {
		this.baseUrl = url;
		this._pingAsync((err) => {
			if (err) {
				console.log(`cannot ping url ${ url }`);
			} else {
				this._bootstrapIndex();
			}
		});
	}

	_bootstrapIndex() {
		this.backendUtils.bootstrap();
	}

	_getUserData(user_id) {
		const user = RocketChat.models.Users.findById(user_id).fetch();
		if (user && user.length > 0) {
			return {
				name: user[0].name,
				username: user[0].username
			};
		} else {
			return {
				name: 'Unknown',
				username: user_id
			};
		}
	}

	_getRoomData(room_id) {
		const room = RocketChat.models.Rooms.findOneByIdOrName(room_id);

		let type_symbol = '#';
		let link_path = 'channel';

		if (room) {
			switch (room.t) {
				case 'd':
					type_symbol = '@';
					break;
				case 'r':
					type_symbol = '?';
					link_path = 'request';
					break;
			}
		}

		return {
			name: room ? room.name : room_id,
			type_symbol,
			link_path
		};
	}

	_getDateStrings(date) {
		const d = moment(date);
		return {
			date: d.format(RocketChat.settings.get('CHATPAL_DATE_FORMAT')),
			time: d.format(RocketChat.settings.get('CHATPAL_TIME_FORMAT'))
		};
	}

	_searchAsync(text, page, pagesize, filters, callback) {

		const self = this;

		HTTP.call('GET', this.baseUrl + this.backendUtils.getQueryParameterString(text, page, pagesize, filters), ChatpalSearchService._httpOptions, (err, data) => {
			if (err) {
				callback(err);
			} else if (data.statusCode === 200) {
				const result = this.backendUtils.alignResponse(JSON.parse(data.content));
				SystemLogger.debug(JSON.stringify(data, '', 2));
				result.docs.forEach(function(doc) {
					doc.user_data = self._getUserData(doc.user);
					doc.date_strings = self._getDateStrings(doc.date);
					doc.room_data = self._getRoomData(doc.room);
				});
				callback(null, result);
			} else {
				callback(data);
			}
		});
	}

	static get _httpOptions() {
		const options = {};

		const authToken = RocketChat.settings.get('CHATPAL_AUTH_TOKEN');
		if (authToken) {
			options.headers = {'X-Auth-Token': authToken};
		}

		const basicAuth = RocketChat.settings.get('CHATPAL_BASIC_AUTH');
		if (basicAuth) {
			options.auth = basicAuth;
		}

		return options;
	}

	_pingAsync(callback) {

		HTTP.call('GET', `${ this.baseUrl }?q=*:*&rows=0`, ChatpalSearchService._httpOptions, (err, data) => {
			if (err) {
				callback(err);
			} else if (data.statusCode === 200) {
				callback(null);
			} else {
				callback(data);
			}
		});
	}

	search(text, page, pagesize, filters) {
		const fut = new Future();

		SystemLogger.info('chatpal search: ', this.baseUrl, text, page, pagesize, filters);

		const bound_callback = Meteor.bindEnvironment(function(err, res) {
			if (err) {
				fut.throw(err);
			} else {
				fut.return(res);
			}
		});

		this._searchAsync(text, page, pagesize, filters, bound_callback);
		return fut.wait();
	}

	ping() {
		const fut = new Future();

		SystemLogger.info('chatpal ping');

		const bound_callback = Meteor.bindEnvironment(function(err, res) {
			if (err) {
				fut.throw(err);
			} else {
				fut.return(res);
			}
		});

		this._pingAsync(bound_callback);
		return fut.wait();
	}

	stop() {
		//SystemLogger.info('Chatpal Service stopped');
	}
}

// Reload on settings change
// =========================

Chatpal.service.SearchService = new ChatpalSearchService();

RocketChat.settings.get('CHATPAL_BASEURL', (id, value)=>{
	Chatpal.service.SearchService.setBaseUrl(value);
});

/**
 * Add the service methods to meteor
 * =================================
 */
Meteor.methods({
	'chatpal.search'(text, page, pagesize, filters) {
		return Chatpal.service.SearchService.search(text, page, pagesize, filters);
	}
});

Meteor.methods({
	'chatpal.ping'() {
		return Chatpal.service.SearchService.ping();
	}
});
