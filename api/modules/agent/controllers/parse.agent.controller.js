'use strict';
const Async = require('async');
const Boom = require('boom');
const AgentTools = require('../tools');
const Flat = require('../../../helpers/flat');
const RemoveBlankArray = require('../../../helpers/removeBlankArray');

// TODO: PATH 1.1
module.exports = (request, reply) => {

    const { id: agentId, text, timezone } = request.plugins['flow-loader'];
    const server = request.server;
    const redis = server.app.redis;
    let documentId;

    Async.waterfall([
        (callback) => {

            // TODO: PATH 1.1.1 (1)
            server.inject('/agent/' + agentId, (res) => {

                if (res.statusCode !== 200) {
                    if (res.statusCode === 404) {
                        const errorNotFound = Boom.notFound('The specified agent doesn\'t exists');
                        return callback(errorNotFound);
                    }
                    const error = Boom.create(res.statusCode, 'An error occurred getting the data of the agent');
                    return callback(error, null);
                }
                return callback(null, res.result);
            });
        },
        (agent, callback) => {

            Async.parallel({
                // TODO: PATH 1.1.2
                trainedDomains: Async.apply(AgentTools.getAvailableDomains, server, redis, agent),
                // TODO: PATH 1.1.3
                duckling: (callbackGetRasa) => {

                    server.inject(`/agent/${agentId}/settings/ducklingURL`, (res) => {

                        if (res.statusCode !== 200) {
                            if (res.statusCode === 404) {
                                const errorNotFound = Boom.notFound('The setting ducklingURL wasn\'t found');
                                return callbackGetRasa(errorNotFound);
                            }
                            const error = Boom.create(res.statusCode, 'An error occurred getting the data of the setting ducklingURL');
                            return callbackGetRasa(error, null);
                        }
                        return callbackGetRasa(null, res.result);
                    });
                },
                // TODO: PATH 1.1.4
                rasa: (callbackGetRasa) => {

                    server.inject(`/agent/${agentId}/settings/rasaURL`, (res) => {

                        if (res.statusCode !== 200) {
                            if (res.statusCode === 404) {
                                const errorNotFound = Boom.notFound('The setting rasaURL wasn\'t found');
                                return callbackGetRasa(errorNotFound);
                            }
                            const error = Boom.create(res.statusCode, 'An error occurred getting the data of the setting rasaURL');
                            return callbackGetRasa(error, null);
                        }
                        return callbackGetRasa(null, res.result);
                    });
                },
                // TODO: PATH 1.1.5
                spacyPretrainedEntities: (callbackGetSpacyPretrainedEntities) => {

                    server.inject(`/agent/${agentId}/settings/spacyPretrainedEntities`, (res) => {

                        if (res.statusCode !== 200) {
                            if (res.statusCode === 404) {
                                const errorNotFound = Boom.notFound('The setting spacyPretrainedEntities wasn\'t found');
                                return callbackGetSpacyPretrainedEntities(errorNotFound);
                            }
                            const error = Boom.create(res.statusCode, 'An error occurred getting the data of the setting spacyPretrainedEntities');
                            return callbackGetSpacyPretrainedEntities(error, null);
                        }
                        return callbackGetSpacyPretrainedEntities(null, res.result);
                    });
                },
                // TODO: PATH 1.1.6
                ducklingDimension: (callbackGetDucklinDimensions) => {

                    server.inject(`/agent/${agentId}/settings/ducklingDimension`, (res) => {

                        if (res.statusCode !== 200) {
                            if (res.statusCode === 404) {
                                const errorNotFound = Boom.notFound('The setting ducklingDimension wasn\'t found');
                                return callbackGetDucklinDimensions(errorNotFound);
                            }
                            const error = Boom.create(res.statusCode, 'An error occurred getting the data of the setting ducklingDimension');
                            return callbackGetDucklinDimensions(error, null);
                        }
                        return callbackGetDucklinDimensions(null, res.result);
                    });
                },
                // TODO: PATH 1.1.7
                ERPipeline: (callbackGetRasa) => {

                    server.inject(`/agent/${agentId}/settings/keywordClassifierPipeline`, (res) => {

                        if (res.statusCode !== 200) {
                            if (res.statusCode === 404) {
                                const errorNotFound = Boom.notFound('The setting keywordClassifierPipeline wasn\'t found');
                                return callbackGetRasa(errorNotFound);
                            }
                            const error = Boom.create(res.statusCode, 'An error occurred getting the data of the setting keywordClassifierPipeline');
                            return callbackGetRasa(error, null);
                        }
                        return callbackGetRasa(null, res.result);
                    });
                }
            }, (err, result) => {

                if (err) {
                    return callback(err, null);
                }
                return callback(null, Object.assign(result, { agent }));
            });
        },
        (agentData, callback) => {
            // TODO: PATH 1.1.8
            agentData.agent.timezone = timezone ? timezone : agentData.agent.timezone;
            AgentTools.parseText(agentData.rasa, agentData.spacyPretrainedEntities, agentData.ERPipeline, agentData.duckling, agentData.ducklingDimension, text, agentData, server, (err, result) => {

                if (err) {
                    return callback(err);
                }
                return callback(null, result);
            });
        }
    ], (err, document) => {

        if (err) {
            return reply(err);
        }

        Async.waterfall([
            (cb) => {
                // TODO: PATH 1.1.9
                redis.incr('documentId', (err, newDocumentId) => {

                    if (err) {
                        const error = Boom.badImplementation('An error occurred getting the new document id.');
                        return cb(error);
                    }
                    documentId = newDocumentId;
                    return cb(null);
                });
            },
            (cb) => {
                // TODO: PATH 1.1.10
                document = Object.assign({ id: documentId }, document);
                if (document.result && document.result.results){
                    document.result.results.forEach((result) => {

                        if (result.saying){
                            if (result.saying.name === null){
                                result.saying.name = '';
                            }
                        }
                        if (result.keywords){
                            result.keywords.forEach((keyword) => {

                                if (keyword.confidence === null){
                                    keyword.confidence = '';
                                }
                            });
                        }
                    });
                }
                const flatDocument = RemoveBlankArray(Flat(document));
                redis.hmset(`document:${documentId}`, flatDocument, (err) => {

                    if (err) {
                        const error = Boom.badImplementation('An error occurred adding the document data.');
                        return cb(error);
                    }
                    return cb(null, document);
                });
            }
        ], (err, result) => {

            if (err) {
                return reply(err, null);
            }
            return reply(result);
        });
    });
};
