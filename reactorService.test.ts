import { SpotStore, ReactorService, IMonitoringService, pairs, IDataItem } from "./reactSpotStore";
import { LocalStorageService } from "./localStorageService";


class MonitoringService implements IMonitoringService {
    sendHeartBeat(): void {
        console.log(`
        =================== Heard Beat =================== 
        `);
    }
}

const now = Date.now();
const spotStore = new SpotStore(new LocalStorageService, true);
const reactorService = new ReactorService(spotStore, new MonitoringService);

const timeout = process.env.REACTOR_SERVICE_TIMEOUT;
console.log('timeout => ', timeout);

const test = async () => {
    reactorService.start();
    const data: IDataItem[] = [];
    let pairIndex = 0;
    for (let i = 0; i < 1000; i++) {
        data.push({ ccypair: pairs[pairIndex], spot: i, tickTime: now + i * 1000 });
        pairIndex = pairIndex === 2 ? 0 : pairIndex + 1;
    }
    for (let i in data) {
        const item = data[i];
        reactorService.add(item);

        if (timeout) {
            await new Promise((resolve) => setTimeout(resolve, Number(timeout)));
        }

        if (Number(i) % 20 === 0) {
            reactorService.get({
                ccypair: item.ccypair,
                dateTime: item.tickTime + 50,
                cb: (spot) => {
                    console.log('got spot for pair => ', item.ccypair, 'value => ', spot);
                },
            });
        }
    }
    setTimeout(checkIfAllHandled, 100);
};

const checkIfAllHandled = (): void => {
    const queuesLength = reactorService.getQueuesLength();
    if (queuesLength === 0) {
        reactorService.stop();
    } else {
        setTimeout(checkIfAllHandled, 100);
    }
};

// spotStore.loadFromLocalStorage();
const wrapper = async () => await test();
wrapper();
