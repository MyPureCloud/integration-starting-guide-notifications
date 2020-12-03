"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.CompoundTopic = exports.SimpleTopic = void 0;
/*
    A simple topic is one where you have a single topic and handler you want to subscribe too.
    For example, v2.users.f2800475-2038-4e01-a8c3-77e5d29285ac.activity
*/
var SimpleTopic = /** @class */ (function () {
    function SimpleTopic(id, defaultHandler) {
        this.id = id;
        this.defaultHandler = defaultHandler;
    }
    return SimpleTopic;
}());
exports.SimpleTopic = SimpleTopic;
/*
   A CompoundTopic allows you pass in notification string for a single subject along with a map of handlers to topics.  You must specify a defaultHandler that will
   be used for any topics that do not have a specific handler.
 */
var CompoundTopic = /** @class */ (function (_super) {
    __extends(CompoundTopic, _super);
    function CompoundTopic(id, defaultHandler, additionalHandlers) {
        var _this = _super.call(this, id, defaultHandler) || this;
        _this.handlers = new Map(); //Map of all the handlers passed in by the end users
        _this.isCompoundTopicString(); //Check to make sure we have a ?
        _this.topicRoot = _this.parseTopicRoot();
        _this.topicList = _this.parseTopics();
        _this.handlers = additionalHandlers;
        return _this;
    }
    CompoundTopic.prototype.getTopics = function () {
        var _this = this;
        return this.topicList.map(function (topicKey) { return _this.topicRoot + "." + topicKey; });
    };
    CompoundTopic.prototype.getAsSimpleTopics = function () {
        var simpleTopics = [];
        this.getTopicHandlers().forEach(function (value, key) {
            return simpleTopics.push(new SimpleTopic(key, value));
        });
        return simpleTopics;
    };
    /**
     * Returns a map of all the topic handlers with a fully-qualified topic name
     */
    CompoundTopic.prototype.getTopicHandlers = function () {
        var _this = this;
        var handlerMap = new Map();
        //Walks through each handler.  If the key is in our list of handlers then map the full topic key to a handler
        //If we find a handler that is not in our list, throw an error
        this.handlers.forEach(function (value, key) {
            var topicKey = _this.topicRoot + "." + key;
            if (_this.topicList.includes(key)) {
                handlerMap.set(topicKey, value);
            }
            else {
                throw new Error("The following key " + key + " does not exist in the parsed list of topics.");
            }
        });
        //Walk through the topic list and if I cant make a match in the list of handlers assign the default handler
        this.topicList.forEach(function (topic) {
            if (!_this.handlers.has(topic)) {
                console.log("Unable to locate parsed topic name " + topic + ", assigning the default topic handler.");
                var topicKey = _this.topicRoot + "." + topic;
                handlerMap.set(topicKey, _this.defaultHandler);
            }
        });
        return handlerMap;
    };
    /**
     * Simple check to make sure this is a legitimate compound topic.  For now, it only looks for the precense of ? in the string.
     */
    CompoundTopic.prototype.isCompoundTopicString = function () {
        var IS_NOT_COMPOUND_STRING = (this.id != null && !(this.id.includes("?")));
        if (IS_NOT_COMPOUND_STRING) {
            throw new Error("Topic string is not a compound topic. string. Does not contain a ?");
        }
    };
    /**
     *  Parses the root topic name out of the string passed in
     */
    CompoundTopic.prototype.parseTopicRoot = function () {
        var lastPositionOfTopic = this.id.indexOf("?");
        return this.id.substring(0, lastPositionOfTopic);
    };
    /**
     * Parses the list of topics being passed
     */
    CompoundTopic.prototype.parseTopics = function () {
        var firstPosOfTopics = this.id.indexOf("?") + 1;
        var topicsString = this.id.substring(firstPosOfTopics, this.id.length);
        var topics = topicsString.split("&");
        if (topics.length == 0) {
            throw new Error("Unable to find topics in " + topicsString);
        }
        return topics;
    };
    return CompoundTopic;
}(SimpleTopic));
exports.CompoundTopic = CompoundTopic;
