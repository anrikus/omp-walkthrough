import type { ChapterModule } from '../../engine/types';
import { editScene, searchScene, syntaxScene, evalScene } from './early';
import { intelligenceScene } from './intelligence';
import { rewindScene, nativeScene, boundaryScene } from './late';

const chapter: ChapterModule = {
  id: 'ch09',
  scenes: {
    '9.1': editScene,
    '9.2': searchScene,
    '9.3': intelligenceScene,
    '9.4': syntaxScene,
    '9.5': evalScene,
    '9.6': rewindScene,
    '9.7': nativeScene,
    '9.8': boundaryScene,
  },
};
export default chapter;
