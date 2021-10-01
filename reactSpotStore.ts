/**
 * Here is interface you need to implement.
 * Please use only single .ts file for solution. Please make sure it can be compiled on Tyepscript 4 without
 * any additional steps and 3rd-party libs. Please use comments to describe your solution.
 *
 * This is spot provider, it stores information about ticking spots, and provide ability to requests like : what was the spot
 * at any given point in time.
 * CCYPAIR  is combination of two 3-chars currencies like "EURUSD" or "JPYRUB" and so on.  Always in uppercase.
 * SPOT is ticking value of given ccypair  like for "USDRUB" it can be 76.45 then 76.46 then 76.44 ...
 *
 * We can assume that all data fits in memory, so we don't need to store it anywhere.
 * But there is a  "SUPER" task to have some persisting logic. It is not mandatory task. So, up to you.
 *
 *
 * Please don't spend more then one hour on this task.
 * And one more hour on "SUPER" task, if you are ready to spend this time on it.(not mandatory)
 */

interface ISpotStore {
  /**
   * We are connected to other system that feed us ticks from different markets.
   * When we receive new tick we call add() method to store it. So later we can use this information in get method.
   * Note that time is increasing at each tick for given ccypair.
   *
   * Time complexity:  add() should work faster than O(logN)
   *
   * @param ccypair always 6 chars uppercase, only valid CCY codes. maximum number of different strings is 100X100
   * @param spot just a double value for spot that changed at this tickTime
   * @param tickTime  time when this spot ticks.
   */
  add(ccypair: string, spot: number, tickTime: number): void;

  /**
   * This is the place where we try to understand what was the spot at some point in time.
   * Like  what was the spot at 5pm Moscow for "EURRUB".  Note that there can be no spot at exact given time,
   * so you need to return latest at this time.
   * @param ccypair always 6 chars uppercase, only valid CCY codes. maximum number of different strings is 100X100
   * @param dateTime point in time.
   * @return spot value at this given time
   */
  get(ccypair: string, dateTime: number): number;
}

export interface IDataItem {
  ccypair: string;
  spot: number;
  tickTime: number;
}

export interface IStorage {
  save(data: string): void;
  load(): string;
}

interface IStoreTime {
  [pair: string]: number[];
}

interface IPairTimeSpotMap {
  [key: string]: number;
}

export const pairs = ['EURUSD', 'JPYRUB', 'USDRUB'];

export class SpotStore implements ISpotStore {
  timeStorage: IStoreTime;
  pairTimeSpotMap: IPairTimeSpotMap;
  storage: IStorage;
  logMethods: boolean;

  constructor(storage: IStorage, logMethods: boolean) {
    this.timeStorage = {} as IStoreTime;
    this.pairTimeSpotMap = {} as IPairTimeSpotMap;
    this.storage = storage;
    this.logMethods = logMethods;
  }

  isValid(pair: string) {
    if (pair.length !== 6) return false;
    return pair.toLocaleUpperCase() === pair;
  }

  async add(ccypair: string, spot: number, tickTime: number): Promise<void> {
    if (this.logMethods) {
      console.log('<< SpotStore.add() >> ccypair => ', ccypair);
    }
    if (!this.isValid(ccypair)) {
      throw new Error('ccypair is not valid');
    }
    if (!this.timeStorage[ccypair]) {
      this.timeStorage[ccypair] = [];
    }
    this.timeStorage[ccypair].push(tickTime);
    this.pairTimeSpotMap[`${ccypair}_${tickTime}`] = spot;
  }

  get(ccypair: string, dateTime: number): number {
    if (this.logMethods) {
      console.log('<< SpotStore.get() >> ccypair => ', ccypair);
    }
      const foundPair = this.timeStorage[ccypair];
    if (!foundPair) {
      throw new Error(`Currencies pair '${ccypair}' is not found`);
    }
    for (let i = foundPair.length - 1; i >= 0; i--) {
      const storedTime = foundPair[i];
      if (dateTime >= storedTime) {
        return this.pairTimeSpotMap[`${ccypair}_${storedTime}`];
      }
    }
    throw new Error(`Spot for '${ccypair}' with dateTime: ${(new Date(dateTime)).toLocaleString()}, is not found`);
  }

  saveToLocalStorage(): void {
    const data: IDataItem[] = [];
    Object.entries(this.timeStorage).map(([ccypair, times]) => {
      times.map(tickTime => {
        const spot = this.pairTimeSpotMap[`${ccypair}_${tickTime}`];
        data.push({ ccypair, tickTime, spot });
      });
    });
    this.storage.save(JSON.stringify(data));
  }

  loadFromLocalStorage(): void {
    const data = this.storage.load();
    const json = JSON.parse(data.toString());
    json.forEach((item: IDataItem) => this.add(item.ccypair, item.spot, item.tickTime));

    console.log('Spots have been loaded: ', Object.keys(this.pairTimeSpotMap).length);
  }
}

/**
 * "SUPER" task.  It is not mandatory task. So, up to you.
 *
 * Let assume that our service is implemented in Reactor pattern (@see https://en.wikipedia.org/wiki/Reactor_pattern)
 * and we need to implement a processor of the requests that will be in front of our SpotStore.
 * In reactor pattern processor is just a loop that handles the queue of the requests. But we don't want to loose
 * any "add price message" and also want to handle them as soon as possible.
 *
 * To sort it out we will use 2 queues of messages:
 * 1) for add requests 2) for get requests. Also we have a monitoring system that allows us to make some alerts if the processor
 * too slow. The alerting is triggered if the processor doesn't send a heart beet for 30 ms. So you need to implement queue
 * processor so that it will handle all requests "add" queue as soon as possible, requests from "get" queue with any reasonable
 * speed and send a heart beat at least once per 40 ms.
 * Note: Processing of "add" requests is more important than monitoring. Also please add an example of unit test or any other demo
 * of service
 */
interface IAddRequest {
  ccypair: string;
  spot: number;
  tickTime: number;
}

interface IGetRequest {
  ccypair: string;
  dateTime: number;
  /** When you handle this request don't forget to call @param cb passing the result */
  cb: (value: number) => void;
}

export interface IMonitoringService {
    sendHeartBeat(): void;
}

/** Reactor will add "Add" request to the end of this queue */
// const addRequestQueue: AddRequest[] = [];

/** Reactor will add "Get" request to the end of this queue */
// const getRequestQueue: GetRequest[] = [];

export class ReactorService {
  addRequestQueue: IAddRequest[];
  getRequestQueue: IGetRequest[];
  mainService: ISpotStore;
  monitoringService: IMonitoringService;
  lastHeartBeat: number;
  monitoringTimerId: NodeJS.Timer;
  processorTimerId: NodeJS.Timer | undefined;

  constructor(mainService: ISpotStore, monitoringService: IMonitoringService) {
    this.addRequestQueue = [];
    this.getRequestQueue = [];
    this.mainService = mainService;
    this.monitoringService = monitoringService;
    this.lastHeartBeat = Date.now();
    this.monitoringTimerId = setInterval(() => {
      this.lastHeartBeat = Date.now();
      this.monitoringService.sendHeartBeat();
    }, 30);
  }

  add({ ccypair, spot, tickTime }: IAddRequest): void {
    this.addRequestQueue.push({ ccypair, spot, tickTime });
  }

  get({ ccypair, dateTime, cb }: IGetRequest): void {
    this.getRequestQueue.push({ ccypair, dateTime, cb });
  }

  checkHeardBeat() {
    const now = Date.now();
    const timePassed = now - this.lastHeartBeat;
    if (timePassed > 30) {
      this.lastHeartBeat = now;
      this.monitoringService.sendHeartBeat();
    }
  }

  handleTick(): void {
    while (this.addRequestQueue.length) {
      const addItem = this.addRequestQueue.shift();
      if (addItem) {
        // add to a high priority system queue
        Promise.resolve().then(() => {
          const { ccypair, spot, tickTime } = addItem;
          this.mainService.add(ccypair, spot, tickTime);
          this.checkHeardBeat();
        });
      }
    }
    while (this.getRequestQueue.length) {
      const getItem = this.getRequestQueue.shift();
      if (getItem) {
        // add to a low priority system queue
        setTimeout(() => {
          const { ccypair, dateTime, cb } = getItem;
          const spot = this.mainService.get(ccypair, dateTime);
          cb(spot);
        }, 0);
      }
    }
  }

  start(): void {
    this.processorTimerId = setInterval(() => this.handleTick(), 0);
  }

  getQueuesLength(): number {
    return this.addRequestQueue.length + this.getRequestQueue.length
  }

  stop(): void {
    clearInterval(this.monitoringTimerId);
    this.processorTimerId && clearInterval(this.processorTimerId);
  }
}
