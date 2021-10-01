import fs from 'fs';
import { IStorage } from "./reactSpotStore";

export class LocalStorageService implements IStorage {
    save(data: string): void {
        fs.writeFile('localStorage.json', data, (err) => {
            if (err) {
                throw new Error(`saving to the local storage went wrong, error: ${err}`);
            }
            console.log('JSON data is saved.');
        });

    }
    load(): string {
        try {
            if (fs.existsSync('localStorage.json')) {
                return fs.readFileSync('localStorage.json', 'utf-8');
            } else {
                return '[]';
            }
        } catch (e) {
            throw new Error(`loading from the local storage went wrong, error: ${e}`);
        }
    }
}
