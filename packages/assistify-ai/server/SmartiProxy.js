/* globals SystemLogger, RocketChat */

/** The HTTP methods. */
export const verbs = {
	get: 'GET',
	post: 'POST',
	put: 'PUT',
	delete: 'DELETE'
};

/**
 * The proxy propagates the HTTP requests to Smarti.
 * All HTTP outbound traffic (from Rocket.Chat to Smarti) should pass the this proxy.
 */
export class SmartiProxy {

	static get smartiAuthToken() {
		return RocketChat.settings.get('Assistify_AI_Smarti_Auth_Token');
	}

	static get smartiUrl() {
		return RocketChat.settings.get('Assistify_AI_Smarti_Base_URL');
	}

	/**
	 * Propagates requests to Smarti.
	 * Make sure all requests to Smarti are using this function.
	 *
	 * @param {String} method - the HTTP method to use
	 * @param {String} path - the path to call
	 * @param {Object} [body=null] - the payload to pass (optional)
	 *
	 * @returns {Object}
	 */
	static propagateToSmarti(method, path, body = null) {

		const url = `${ SmartiProxy.smartiUrl }${ path }`;
		const header = {
			'X-Auth-Token': SmartiProxy.smartiAuthToken,
			'Content-Type': 'application/json; charset=utf-8'
		};
		try {
			const response = HTTP.call(method, url, {data: body, headers: header});
			if (response.statusCode === 200) {
				return response.data || response.content; //.data if it's a json-response
			} else {
				SystemLogger.debug('Got unexpected result from Smarti', method, 'to', url, 'response', JSON.stringify(response));
			}
		} catch (error) {
			SystemLogger.error('Could not complete', method, 'to', url);
			SystemLogger.debug(error);
		}
	}
}
