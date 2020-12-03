export type TopicHandler<T> = (id: string, message: string) => Promise<T>;
export type Topic = SimpleTopic | CompoundTopic;


/*
    A simple topic is one where you have a single topic and handler you want to subscribe too.
    For example, v2.users.f2800475-2038-4e01-a8c3-77e5d29285ac.activity
*/
export class SimpleTopic {
  readonly id: string
  readonly defaultHandler: TopicHandler<any>;

  constructor(id: string, defaultHandler: TopicHandler<any>) {
    this.id = id;
    this.defaultHandler = defaultHandler;
  }
}

/*
   A CompoundTopic allows you pass in notification string for a single subject along with a map of handlers to topics.  You must specify a defaultHandler that will
   be used for any topics that do not have a specific handler.
 */
export class CompoundTopic extends SimpleTopic {
  //Pieces of the topic.  (e.g. v2.users.f2800475-2038-4e01-a8c3-77e5d29285ac?presence&outofoffice&callforwarding&greetings
  private topicRoot: string;      //Basic root of the topic, v2.users.f2800475-2038-4e01-a8c3-77e5d29285ac
  private topicList: string[];    //List of the topic pieces, ["presence","outofoffice","callforwarding"]
  private handlers = new Map<string, TopicHandler<any>>();  //Map of all the handlers passed in by the end users


  constructor(id: string, defaultHandler: TopicHandler<any>, additionalHandlers: Map<string, TopicHandler<any>>) {
    super(id, defaultHandler);

    this.isCompoundTopicString();  //Check to make sure we have a ?
    this.topicRoot = this.parseTopicRoot();
    this.topicList = this.parseTopics();
    this.handlers = additionalHandlers;
  }

  public getTopics(): string[] {
    return this.topicList.map((topicKey) => { return `${this.topicRoot}.${topicKey}` });
  }

  public getAsSimpleTopics(): SimpleTopic[] {
    const simpleTopics: SimpleTopic[] = [];
    this.getTopicHandlers().forEach((value, key) => {
      return simpleTopics.push(new SimpleTopic(key, value));
    });

    return simpleTopics;
  }

  /**
   * Returns a map of all the topic handlers with a fully-qualified topic name
   */
  private getTopicHandlers(): Map<string, TopicHandler<any>> {
    const handlerMap = new Map<string, TopicHandler<any>>();

    //Walks through each handler.  If the key is in our list of handlers then map the full topic key to a handler
    //If we find a handler that is not in our list, throw an error
    this.handlers.forEach((value, key) => {
      const topicKey = `${this.topicRoot}.${key}`
      if (this.topicList.includes(key)) {
        handlerMap.set(topicKey, value);
      } else {
        throw new Error(`The following key ${key} does not exist in the parsed list of topics.`)
      }
    });

    //Walk through the topic list and if I cant make a match in the list of handlers assign the default handler
    this.topicList.forEach((topic) => {
      if (!this.handlers.has(topic)) {
        console.log(`Unable to locate parsed topic name ${topic}, assigning the default topic handler.`);

        const topicKey = `${this.topicRoot}.${topic}`
        handlerMap.set(topicKey, this.defaultHandler);
      }
    });

    return handlerMap;
  }

  /**
   * Simple check to make sure this is a legitimate compound topic.  For now, it only looks for the precense of ? in the string.
   */
  private isCompoundTopicString(): void {
    const IS_NOT_COMPOUND_STRING = (this.id != null && !(this.id.includes("?")));
    if (IS_NOT_COMPOUND_STRING) { throw new Error("Topic string is not a compound topic. string. Does not contain a ?") }
  }

  /** 
   *  Parses the root topic name out of the string passed in 
   */
  private parseTopicRoot(): string {
    const lastPositionOfTopic = this.id.indexOf("?");
    return this.id.substring(0, lastPositionOfTopic)
  }

  /**
   * Parses the list of topics being passed
   */
  private parseTopics(): string[] {
    const firstPosOfTopics = this.id.indexOf("?") + 1;
    const topicsString = this.id.substring(firstPosOfTopics, this.id.length);

    const topics = topicsString.split("&");

    if (topics.length == 0) { throw new Error(`Unable to find topics in ${topicsString}`) }

    return topics;
  }

}