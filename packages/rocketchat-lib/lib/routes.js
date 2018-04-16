/* globals RocketChat */

import {FlowRouter} from 'meteor/kadira:flow-router';

/**
 * in order to provide links to messages which are stable (e. g. survive renaming a room or changing its type)
 * we introduce an explicit route. Since this needs to be executable on the client, we provide a method along with it
 */
FlowRouter.route('/message/:id', {
	name: 'message',
	action(params) {
		Meteor.call('getCurrentMessageRouteLink', params.id, (err, res) => {
			if (!err && res) {
				FlowRouter.go(res);
			}
		});
	}
});
