
Meteor.methods({
	'assistify.translate'(httpMethod, url, options) {
		try {
			const result = HTTP.call(httpMethod, url, options);
			if (result.statusCode === 200 && result.data && result.data.translation && result.data.translation.length > 0) {
				return decodeURIComponent(result.data.translation);
			}
		} catch (e) {
			throw new Meteor.Error('translation-failed', 'Auto-Translate is not allowed', e);
		}
	}
});
