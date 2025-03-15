import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
// import fs from 'fs';
import sharp from 'sharp';
import * as fs from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
class imageOptimizer {
  uploadImageServer(file) {
    return file;
  }
  imageGet(query, res) {
    const imagePath = this.fileAccess(query, 'transformed');
    if (imagePath.valid) {
      return this.transformedImageFun(imagePath.message, res);
    } else {
      const imagePath = this.fileAccess(query, 'original');
      if (imagePath.valid) {
        return this.originalImage(query, imagePath,res);
      } else {
        res.status(404).send({ message: 'Image not found' });
      }
    }
  }

  async originalImage(query, imagePath,res) {
    let contentType;
    let isLossy = false;
    switch (query.format) {
      case 'jpeg':
        contentType = 'jpeg';
        isLossy = true;
        break;
      case 'gif':
        contentType = 'gif';
        break;
      case 'webp':
        contentType = 'webp';
        isLossy = true;
        break;
      case 'png':
        contentType = 'png';
        break;
      case 'avif':
        contentType = 'avif';
        isLossy = true;
        break;
      default:
        contentType = 'jpeg';
        isLossy = true;
    }
    //   which folder you want to save the image
    const directoryPathOriginal = this.fetchDirectory('original');
    console.log(`${directoryPathOriginal}/${query.name}`);
    let transformedImage = sharp(`${directoryPathOriginal}/${query.name}`, {
      failOn: 'none',
      animated: true,
    });
    const imageMetadata = await transformedImage.metadata();
    const resizingOptions = {
      width: +query.width,
      height: +query.height,
      // fit: sharp.fit.contain,
      // position: sharp.strategy.attention,
      // background: 'red',
    };
    transformedImage = transformedImage.resize(resizingOptions);
    if (imageMetadata.orientation) transformedImage = transformedImage.rotate();
    if (query.quality !== 'auto' && isLossy) {
      transformedImage = transformedImage.toFormat(contentType, {
        quality: parseInt(query.quality.toString()),
      });
    } else {
      transformedImage = transformedImage.toFormat(contentType);
    }
    // transformedImage = transformedImage.toFormat(contentType as keyof sharp.FormatEnum, {
    //     quality: parseInt(query.quality.toString()),
    // });
    const directoryPathTransformed = this.fetchDirectory('transformed');
    const transformedImageBuffer = await transformedImage.toBuffer();
    sharp(transformedImageBuffer).toFile(
      `${directoryPathTransformed}/${imagePath.fileName}`,
      (err) => {
        if (err) {
          res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .send({ message: 'Image not found' });
        }
        this.transformedImageFun(
          `${directoryPathTransformed}/${imagePath.fileName}`,
          res
        );
      }
    );
  }








  transformedImageFun(imagePath, res) {
    console.log(imagePath)
    return res.status(200).sendFile(imagePath, (err) => {
      if (err) {
        res.status(404).send('Image not found');
      }
    });
  }
  fetchDirectory(type) {
    console.log(type);
    const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
// console.log(__dirname)
    const imagePath = join(__dirname,`./uploads/image/${type}`);
    return imagePath;
  }
  fileAccess(reqObj, type) {
    const fileName = `name=${reqObj.name}&width=${reqObj.width}&height=${reqObj.height}&quality=${reqObj.quality}.${reqObj.format}`;
    const accessFolder = `${this.fetchDirectory(type)}/${
      type === 'original' ? reqObj.name : fileName
    }`;
    if (fs.existsSync(accessFolder)) {
      return { message: accessFolder, valid: true, fileName };
    } else {
      return { message: accessFolder, valid: false, fileName };
    }
  }
}

export const imageOptimizationFun = (app) => {
  const classOptimization = new imageOptimizer();
  app.get('/upload', (req, res) => {
    
    console.log('hello');
    classOptimization.imageGet(req.query, res);
  });
  app.get('/image', (req, res) => {
    console.log('hello');
    classOptimization.imageGet(req.query, res);
  });
};
