const renderers = {};

export function registerFieldTemplate(fieldType, templateName) {
	renderers[fieldType] = templateName;
}

Template.renderField.helpers({
	specializedRendering(field) {
		let html = '';
		if (field.type && renderers[field.type]) {
			html = Blaze.toHTMLWithData(Template[renderers[field.type]], field);
		} else {
			// consider the value already formatted as html
			html = field.value;
		}
		return html;
	}
});
