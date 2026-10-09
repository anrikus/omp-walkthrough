import type { ChapterModule } from '../../engine/types';
import { scene121, scene122, scene123, scene124 } from './early';
import { scene125, scene126, scene127, scene128 } from './later';
import './style.css';
import './later.css';

const chapter: ChapterModule = {
  id: 'ch12',
  scenes: {
    '12.1': scene121,
    '12.2': scene122,
    '12.3': scene123,
    '12.4': scene124,
    '12.5': scene125,
    '12.6': scene126,
    '12.7': scene127,
    '12.8': scene128,
  },
};

export default chapter;
