import { Module } from '@nestjs/common';
import { ImageLibraryController } from './image-library.controller';
import { ImageLibraryService } from './image-library.service';

@Module({
  controllers: [ImageLibraryController],
  providers: [ImageLibraryService],
  exports: [ImageLibraryService],
})
export class ImageLibraryModule {}
