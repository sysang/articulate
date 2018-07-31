'use strict';
const Async = require('async');
const Boom = require('boom');
const _ = require('lodash');
const RespondSaying = require('./respondSaying.agent.tool');
const RespondFallback = require('./respondFallback.agent.tool');

const getCurrentContext = (conversationStateObject) => {

    if (conversationStateObject.context.length > 0) {
        return conversationStateObject.context[conversationStateObject.context.length - 1];
    }
    return null;
};

const recognizedKeywordsArePartOfTheContext = (currentContext, recognizedKeywords) => {

    let results = _.map(recognizedKeywords, (recognizedKeyword) => {

        return Object.keys(currentContext.slots).indexOf(recognizedKeyword.keyword) > -1;
    });
    results = _.compact(results);
    return results.length > 0;
};

const getKeywordsFromRasaResults = (conversationStateObject) => {

    const keywords = _.flatMap(conversationStateObject.parse, (domain) => {

        domain.keywords = _.map(domain.keywords, (keyword) => {

            keyword.domain = domain.domain;
            return keyword;
        });
        return domain.keywords;
    });

    return keywords;
};

const getBestRasaResult = (conversationStateObject) => {

    let rasaResult = {};

    const recognizedDomain = conversationStateObject.parse[0];

    if (conversationStateObject.parse.length > 0 && recognizedDomain.domainScore > conversationStateObject.agent.domainClassifierThreshold) {
        rasaResult = recognizedDomain;
    }
    else {
        if (conversationStateObject.parse.length === 1) {
            rasaResult = recognizedDomain;
        }
        else {
            rasaResult.keywords = getKeywordsFromRasaResults(conversationStateObject);
        }
    }

    return rasaResult;
};

const getScenarioByName = (scenarioName, conversationStateObject) => {

    const agentSayings = _.compact(_.flatten(_.map(conversationStateObject.agent.domains, 'sayings')));
    const agentScenarios = _.compact(_.map(agentSayings, 'scenario'));
    const scenario = _.filter(agentScenarios, (agentScenario) => {

        return agentScenario.scenarioName === scenarioName;
    })[0];
    return scenario;
};

const getSayingByName = (sayingName, conversationStateObject) => {

    const agentSayings = _.compact(_.flatten(_.map(conversationStateObject.agent.domains, 'sayings')));
    const saying = _.filter(agentSayings, (agentSaying) => {

        return agentSaying.sayingName === sayingName;
    })[0];
    return saying;
};

const getDomainOfSaying = (conversationStateObject) => {

    if (conversationStateObject.saying) {
        const domain = _.filter(conversationStateObject.agent.domains, (agentDomain) => {

            return agentDomain.domainName === conversationStateObject.saying.domain;
        })[0];
        return domain;
    }
    return null;
};

const getSayingData = (conversationStateObject) => {

    if (conversationStateObject.rasaResult.saying) {
        if (conversationStateObject.agent.domains) {
            const agentSayings = _.compact(_.flatten(_.map(conversationStateObject.agent.domains, 'sayings')));
            const saying = _.filter(agentSayings, (agentSaying) => {

                return agentSaying.sayingName === conversationStateObject.rasaResult.saying.name;
            })[0];
            return saying;
        }
        return null;
    }
    return null;
};

const getLastContextWithValidSlots = (conversationStateObject, recognizedKeywords) => {

    const recognizedKeywordsNames = _.map(recognizedKeywords, 'keyword');
    let keepGoing = true;
    let contextIndex = conversationStateObject.context.length - 1;
    let lastValidContext = null;
    while (keepGoing && contextIndex !== -1) {

        const contextSlots = conversationStateObject.context[contextIndex].slots ? Object.keys(conversationStateObject.context[contextIndex].slots) : [];
        const intersection = _.intersection(recognizedKeywordsNames, contextSlots);
        if (intersection.length > 0) {
            keepGoing = false;
            lastValidContext = _.cloneDeep(conversationStateObject.context[contextIndex]);
        }
        contextIndex--;
    }
    return lastValidContext;
};

const persistContext = (server, conversationStateObject, cb) => {

    Async.map(conversationStateObject.context, (elementInContext, callbackInsertInContext) => {

        if (elementInContext.id) {
            if (elementInContext.slots) {
                const options = {
                    url: `/context/${conversationStateObject.sessionId}/${elementInContext.id}`,
                    method: 'PUT',
                    payload: {
                        slots: elementInContext.slots
                    }
                };

                server.inject(options, (res) => {

                    if (res.statusCode !== 200) {
                        const error = Boom.create(res.statusCode, `An error occurred updating the context ${elementInContext.id} of the session ${conversationStateObject.sessionId}`);
                        return callbackInsertInContext(error, null);
                    }
                    return callbackInsertInContext(null);
                });
            }
            else {
                return callbackInsertInContext(null);
            }
        }
        else {

            if (elementInContext.slots && Object.keys(elementInContext.slots).length === 0) {
                delete elementInContext.slots;
            }
            const options = {
                url: `/context/${conversationStateObject.sessionId}`,
                method: 'POST',
                payload: elementInContext
            };

            server.inject(options, (res) => {

                if (res.statusCode !== 200) {
                    const error = Boom.create(res.statusCode, `An error occurred adding the a new element to the session ${conversationStateObject.sessionId}`);
                    return callbackInsertInContext(error, null);
                }
                return callbackInsertInContext(null);
            });
        }
    }, (err) => {

        if (err) {
            return cb(err);
        }
        return cb(null);
    });
};

module.exports = (server, conversationStateObject, callback) => {

    conversationStateObject.currentContext = getCurrentContext(conversationStateObject);
    if (conversationStateObject.parse) {
        conversationStateObject.rasaResult = getBestRasaResult(conversationStateObject);
        conversationStateObject.saying = getSayingData(conversationStateObject);
        conversationStateObject.scenario = conversationStateObject.saying ? conversationStateObject.saying.scenario : null;
        if (conversationStateObject.saying && !conversationStateObject.scenario) {
            RespondFallback(conversationStateObject, (err, response) => {

                if (err) {
                    return callback(err, null);
                }
                persistContext(server, conversationStateObject, (err) => {

                    if (err) {
                        return callback(err);
                    }
                    return callback(null, response);
                });
            });
        }
        else {
            conversationStateObject.domain = getDomainOfSaying(conversationStateObject);
            if (conversationStateObject.saying && conversationStateObject.scenario && conversationStateObject.domain && conversationStateObject.rasaResult.saying.confidence > conversationStateObject.domain.sayingThreshold) {
                if (!conversationStateObject.currentContext || (conversationStateObject.rasaResult.saying.name !== conversationStateObject.currentContext.name)) {
                    conversationStateObject.context.push({
                        name: conversationStateObject.rasaResult.saying.name,
                        scenario: conversationStateObject.scenario.scenarioName,
                        slots: {}
                    });
                    conversationStateObject.currentContext = getCurrentContext(conversationStateObject);
                }
                RespondSaying(conversationStateObject, (err, response) => {

                    if (err) {
                        return callback(err, null);
                    }
                    persistContext(server, conversationStateObject, (err) => {

                        if (err) {
                            return callback(err);
                        }
                        return callback(null, response);
                    });
                });
            }
            else {
                const recognizedKeywords = !conversationStateObject.rasaResult.saying ? conversationStateObject.rasaResult.keywords : getKeywordsFromRasaResults(conversationStateObject.parse);
                if (conversationStateObject.currentContext) {
                    if (recognizedKeywords.length > 0) {
                        if (conversationStateObject.currentContext.slots && Object.keys(conversationStateObject.currentContext.slots).length > 0 && recognizedKeywordsArePartOfTheContext(conversationStateObject.currentContext, recognizedKeywords)) {
                            conversationStateObject.scenario = getScenarioByName(conversationStateObject.currentContext.scenario, conversationStateObject);
                            conversationStateObject.saying = getSayingByName(conversationStateObject.currentContext.name, conversationStateObject);
                            RespondSaying(conversationStateObject, (err, response) => {

                                if (err) {
                                    return callback(err, null);
                                }
                                persistContext(server, conversationStateObject, (err) => {

                                    if (err) {
                                        return callback(err);
                                    }
                                    return callback(null, response);
                                });
                            });
                        }
                        else {
                            const lastValidContext = getLastContextWithValidSlots(conversationStateObject, recognizedKeywords);
                            if (lastValidContext) {
                                conversationStateObject.context.push(lastValidContext);
                                conversationStateObject.currentContext = lastValidContext;
                                conversationStateObject.scenario = getScenarioByName(conversationStateObject.currentContext.scenario, conversationStateObject);
                                conversationStateObject.saying = getSayingByName(conversationStateObject.currentContext.name, conversationStateObject);
                                RespondSaying(conversationStateObject, (err, response) => {

                                    if (err) {
                                        return callback(err, null);
                                    }
                                    persistContext(server, conversationStateObject, (err) => {

                                        if (err) {
                                            return callback(err);
                                        }
                                        return callback(null, response);
                                    });
                                });
                            }
                            else {
                                RespondFallback(conversationStateObject, (err, response) => {

                                    if (err) {
                                        return callback(err, null);
                                    }
                                    return callback(response);
                                });
                            }
                        }
                    }
                    else {
                        RespondFallback(conversationStateObject, (err, response) => {

                            if (err) {
                                return callback(err, null);
                            }
                            return callback(response);
                        });
                    }
                }
                else {
                    RespondFallback(conversationStateObject, (err, response) => {

                        if (err) {
                            return callback(err, null);
                        }
                        return callback(response);
                    });
                }
            }
        }
    }
    else {
        const message = 'Sorry but the NLU engine didn\'t were able to parse your text';
        const error = Boom.badImplementation(message);
        return callback(error, null);
    }
};
