/* globals _ */
/**
 * Created by OliverJaegle on 01.08.2016.
 */
// var _ = Npm.require('underscore');

_.extend(RocketChat.models.LivechatExternalMessage, {
	findOneById(_id, options) {
		const query = { _id };
		return this.findOne(query, options);
	},
	findOneByConversationId(convId, options) {
		const query = { 'conversationId': convId };
		return this.findOne(query, options);
	},
	clear() {
		const query = { knowledgeProvider: 'smarti' };
		return this.remove(query);
	}
});
