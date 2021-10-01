import { SpotStore, IDataItem, pairs } from "./reactSpotStore";
import { LocalStorageService } from "./localStorageService";

const now = Date.now();

const spotStore = new SpotStore(new LocalStorageService, false);
const generate = () => {
    const data: IDataItem[] = [];
    let pairIndex = 0;
    for (let i = 0; i < 1000; i++) {
        data.push({ ccypair: pairs[pairIndex], spot: i, tickTime: now + i * 1000 });
        pairIndex = pairIndex === 2 ? 0 : pairIndex + 1;
    }
    data.map(item => spotStore.add(item.ccypair, item.spot, item.tickTime));
};

spotStore.loadFromLocalStorage();
generate();

const arrayForTest = [
    { pair: 'EURUSD', dateTime: now + 1500 },
    { pair: 'EURUSD', dateTime: now + 3000 },
    { pair: 'EURUSD', dateTime: now + 15050 },
    { pair: 'EURUSD', dateTime: now + 6333 },
    { pair: 'EURUSD', dateTime: now + 8080 },
    { pair: 'EURUSD', dateTime: now + 9999 },
    { pair: 'JPYRUB', dateTime: now + 14000 },
    { pair: 'JPYRUB', dateTime: now + 33333 },
    { pair: 'JPYRUB', dateTime: now + 32222 },
    { pair: 'JPYRUB', dateTime: now + 11111 },
    { pair: 'USDRUB', dateTime: now + 77777 },
    { pair: 'USDRUB', dateTime: now + 888888 },
    { pair: 'USDRUB', dateTime: now + 999999 },
]

const testGet = () => {
    arrayForTest.forEach(item => {
        const spot = spotStore.get(item.pair, item.dateTime);
        const date = new Date(item.dateTime);
        console.log('pair: ', item.pair, 'dateTime: ', date.toLocaleString(), 'spot: ', spot);
    });
}

testGet();

spotStore.saveToLocalStorage();
