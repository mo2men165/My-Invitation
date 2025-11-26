// server/src/types/express.d.ts
import { File } from 'multer';

declare global {
  namespace Express {
    namespace Multer {
      interface File extends File {}
    }
  }
}

export {};