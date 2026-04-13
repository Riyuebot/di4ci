import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';
import { Schema } from '../../schema';
import { init变量结构运行时 } from './runtime';

$(() => {
  registerMvuSchema(Schema);
  errorCatched(init变量结构运行时)();
});
