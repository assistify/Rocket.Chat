Template.AssistifyTopicSearchEmpty.helpers({
	showMoreTopics() {
		const instance = Template.instance();
		return instance.expertisesCount.get() > 10 ? true : false;
	}
});
Template.AssistifyTopicSearchEmpty.onCreated(function() {
	const instance = this;
	instance.expertisesCount = new ReactiveVar('');
	Meteor.call('expertiseList', {sort: 'name'}, function(err, result) {
		if (result) {
			instance.expertisesCount.set(result.channels.length);
		}
	});
});
