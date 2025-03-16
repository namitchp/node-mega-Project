import multer from 'multer';
import sharp from 'sharp';
import * as fs from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
class imageOptimizer {
  uploadImageServer(file) {
    return file;
  }
  imageUpload() {
    // const filePath='./uploads/image/original';
    const fileSize = 20;
    return multer({
      storage: multer.diskStorage({
        destination: function (req, file, cb) {
          const filePath = `./uploads/image/original`;
          cb(null, filePath);
        },
        filename: function (req, file, cb) {
          const { folderName } = req.query;
          var ext = path.extname(file.originalname);
          var filename = path.basename(file.originalname, ext);
          cb(null, `${folderName || 'folder'}-${filename}-${Date.now()}${ext}`);
        },
      }),
      // file size
      limits: { fileSize: 1024 * 1024 * fileSize },
      fileFilter: function (req, file, cb) {
        console.log(file.originalname);
        console.log(file.mimetype);
        // Set the filetypes, it is optional
        var filetypes = /jpeg|jpg|png|pdf/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(
          path.extname(file.originalname).toLowerCase()
        );
        if (mimetype && extname) {
          return cb(null, true);
        }
        cb(
          'Error: File upload only supports the ' +
            'following filetypes - ' +
            filetypes
        );
      },
    });
  }
  imageGet(query, res) {
    const imagePath = this.fileAccess(query, res);
    if (imagePath.valid) {
      return this.transformedImageFun(imagePath.message, res);
    } else {
      return this.originalImage(query, imagePath, res);
    }
  }
  async originalImage(query, imagePath, res) {
    const { name, width, height, quality, format } = query;
    let contentType;
    let isLossy = false;
    switch (format) {
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
    let transformedImage = sharp(imagePath.message, {
      failOn: 'none',
      animated: true,
    });
    const imageMetadata = await transformedImage.metadata();
    const resizingOptions = {
      // width: +width,
      // height: +height,
      // fit: sharp.fit.contain,
      // position: sharp.strategy.attention,
      // background: 'red',
    };
    if (width !== 'auto') {
      resizingOptions.width = +width;
    }
    if (height !== 'auto') {
      resizingOptions.height = +height;
    }
    if (Object.keys(resizingOptions).length > 0)
      transformedImage = transformedImage.resize(resizingOptions);

    if (imageMetadata.orientation) transformedImage = transformedImage.rotate();
    if (quality !== 'auto' && isLossy) {
      transformedImage = transformedImage.toFormat(contentType, {
        quality: parseInt(quality.toString()),
      });
    } else {
      transformedImage = transformedImage.toFormat(contentType);
    }
    // transformedImage = transformedImage.toFormat(contentType as keyof sharp.FormatEnum, {
    //     quality: parseInt(query.quality.toString()),
    // });
    const directoryPathTransformed = `${this.fetchDirectory('transformed')}/${
      imagePath.fileName
    }`;
    const transformedImageBuffer = await transformedImage.toBuffer();
    sharp(transformedImageBuffer).toFile(directoryPathTransformed, (err) => {
      if (err) {
        res.status(500).send({ message: 'Image not found' });
      }
      this.transformedImageFun(directoryPathTransformed, res);
    });
  }
  transformedImageFun(imagePath, res) {
    return res.status(200).sendFile(imagePath, (err) => {
      if (err) {
        res.status(404).send('Image not found');
      }
    });
  }
  fetchDirectory(type) {
    const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    const __dirname = path.dirname(__filename); // get the name of the directory
    const imagePath = join(__dirname, `./uploads/image/${type}`);
    return imagePath;
  }
  fileAccess(reqObj, res) {
    const { name, width, height, quality, format } = reqObj;
    const fileName = `name=${name}&width=${width}&height=${height}&quality=${quality}.${
      format == 'auto' ? 'jpeg' : format
    }`;
    let accessFolder = `${this.fetchDirectory('transformed')}/${fileName}`;
    if (fs.existsSync(accessFolder)) {
      return { message: accessFolder, valid: true, fileName };
    }
    accessFolder = `${this.fetchDirectory('original')}/${name}`;
    console.log(accessFolder);
    if (fs.existsSync(accessFolder)) {
      return { message: accessFolder, valid: false, fileName };
    }
    res.status(404).send({ message: 'Image not found' });
  }
}
export const imageOptimizationFun = (app) => {
  const classOptimization = new imageOptimizer();
  app.post(
    '/v0/image/upload',
    classOptimization.imageUpload().single('file'),
    (req, res) => {
      const fullUrl = `${req.protocol}://${req.get('host')}/v0/image/get?name=${
        req.file.filename
      }&format=auto&width=auto&height=auto&quality=auto`;
      res.status(200).json({
        message: 'Success',
        data: req.file.filename,
        url: fullUrl,
      });
    }
  );
  app.get('/v0/image/get', (req, res) => {
    classOptimization.imageGet(req.query, res);
  });
};
