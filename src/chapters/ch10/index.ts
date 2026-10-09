import type { ChapterModule } from '../../engine/types';
import { scene101, scene102, scene103 } from './context';
import { scene104, scene105, scene106 } from './sessions';
import { scene107, scene108, scene109 } from './extensions';

const chapter: ChapterModule = {
  id: 'ch10',
  scenes: {
    '10.1': scene101,
    '10.2': scene102,
    '10.3': scene103,
    '10.4': scene104,
    '10.5': scene105,
    '10.6': scene106,
    '10.7': scene107,
    '10.8': scene108,
    '10.9': scene109,
  },
};
export default chapter;
