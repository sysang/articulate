'use strict';
const _ = require('lodash');

module.exports = (object, type) => {

    switch (type) {

        case 'agent':
            if (typeof object.useWebhook !== 'boolean'){
                object.useWebhook = object.useWebhook === 'true';
            }
            if (typeof object.usePostFormat !== 'boolean'){
                object.usePostFormat = object.usePostFormat === 'true';
            }
            if (typeof object.extraTrainingData !== 'boolean'){
                object.extraTrainingData = object.extraTrainingData === 'true';
            }
            if (typeof object.enableModelsPerDomain !== 'boolean'){
                object.enableModelsPerDomain = object.enableModelsPerDomain === 'true';
            }
            object.domainClassifierThreshold = parseFloat(object.domainClassifierThreshold);
            break;
        case 'context':
            break;
        case 'domain':
            if (typeof object.enabled !== 'boolean'){
                object.enabled = object.enabled === 'true';
            }
            if (typeof object.extraTrainingData !== 'boolean'){
                object.extraTrainingData = object.extraTrainingData === 'true';
            }
            object.sayingThreshold = parseFloat(object.sayingThreshold);
            break;
        case 'keyword':
            if (object.regex === '' || !object.regex || object.regex === 'null'){
                object.regex = null;
            }
            break;
        case 'saying':
            if (typeof object.useWebhook !== 'boolean'){
                object.useWebhook = object.useWebhook === 'true';
            }

            if (typeof object.usePostFormat !== 'boolean'){
                object.usePostFormat = object.usePostFormat === 'true';
            }
            object.examples = object.examples.map((example) => {

                if (example.keywords === '') {
                    example.keywords = [];
                }
                else {
                    example.keywords = example.keywords.map((keyword) => {

                        if (keyword.keywordId) {
                            keyword.keywordId = parseInt(keyword.keywordId);
                        }
                        keyword.start = parseInt(keyword.start);
                        keyword.end = parseInt(keyword.end);
                        return keyword;
                    });
                }
                return example;
            });
            break;
        case 'scenario':
            if (object.slots === '') {
                object.slots = [];
            }
            else {
                object.slots = object.slots.map((slot) => {

                    if (!_.isArray(slot.textPrompts)) {
                        slot.textPrompts = [];
                    }
                    if (typeof object.isList !== 'boolean'){
                        slot.isList = slot.isList === 'true';
                    }
                    if (typeof object.isRequired !== 'boolean'){
                        slot.isRequired = slot.isRequired === 'true';
                    }
                    return slot;
                });
            }
            if (object.sayingResponses === '') {
                if (object.sayingResponses.length === 0) {
                    object.sayingResponses = [];
                }
            }
            break;
        case 'webhook':
            break;
        case 'postFormat':
            break;
        case 'settings':
            const newObject = [];
            Object.keys(object).forEach((key) => {

                newObject.push(object[key]);
            });
            object = newObject;
            break;
        case 'document':
            if (object.result && object.result.results){
                object.result.results.forEach((result) => {

                    if (result.saying){
                        if (result.saying.name && (result.saying.name === '' || result.saying.name === 'null')){
                            result.saying.name = null;
                        }
                    }
                    if (result.keywords !== undefined && result.keywords !== null){
                        if (Array.isArray(result.keywords)){
                            result.keywords.forEach((keyword) => {

                                if (keyword.confidence === ''){
                                    keyword.confidence = null;
                                }
                            });
                        }
                        else {
                            result.keywords = [];
                        }
                    }
                });
            }
            break;
    }
    ;
    if (object.id) {
        object.id = parseInt(object.id);
    }
    return object;
};
