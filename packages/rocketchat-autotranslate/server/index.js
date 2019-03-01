/**
 * This file contains the exported members of the package shall be re-used.
 * @module AutoTranslate, TranslationProviderRegistry
 */

import './models/Messages';
import './models/Subscriptions';
import './settings';
import './permissions';
import './autotranslate';
import './methods/getSupportedLanguages';
import './methods/saveSettings';
import './methods/translateMessage';

import { AutoTranslate, TranslationProviderRegistry } from './autotranslate';

import './googleTranslate';
import './deeplTranslate';
import './dbsTranslate';
import './models/Settings';

export {
	AutoTranslate,
	TranslationProviderRegistry,
};
