import { IConfigEntry } from './IConfigEntry';

export interface IDeferedConfigEntry extends IConfigEntry {
  defer: any;
}
