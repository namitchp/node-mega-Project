import multer from 'multer';
// import { v4 as uuidv4 } from 'uuid';
// import fs from 'fs';
import sharp from 'sharp';
import * as fs from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
// import { constants } from 'buffer';
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
          // const {folderName}=req.query;
          // console.log(req)
          // Uploads is the Upload_folder_name path
          const filePath = `./uploads/image/original`;
          //  if (!fs.existsSync(filePath)) {
          //       fs.mkdirSync(filePath, { recursive: true });
          //     }
          cb(null, filePath);
        },
        // dest: filePath,
        // destination:'./uploads'
        filename: function (req, file, cb) {
          const { folderName } = req.query;
          var ext = path.extname(file.originalname);
          var filename = path.basename(file.originalname, ext);
          cb(null, folderName + '-' + filename + '-' + Date.now() + ext);
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
    console.log(imagePath);
    return res.status(200).sendFile(imagePath, (err) => {
      if (err) {
        res.status(404).send('Image not found');
      }
    });
  }
  fetchDirectory(type) {
    const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    const __dirname = path.dirname(__filename); // get the name of the directory
    // console.log(__dirname)
    const imagePath = join(__dirname, `./uploads/image/${type}`);
    return imagePath;
  }
  fileAccess(reqObj, res) {
    const { name, width, height, quality, format } = reqObj;
    const fileName = `name=${name}&width=${width}&height=${height}&quality=${quality}.${format}`;
    let accessFolder = `${this.fetchDirectory('transformed')}/${fileName}`;
    if (fs.existsSync(accessFolder)) {
      return { message: accessFolder, valid: true, fileName };
    }
    accessFolder = `${this.fetchDirectory('original')}/${name}`;
    if (fs.existsSync(accessFolder)) {
      return { message: accessFolder, valid: false, fileName };
    }
    res.status(404).send({ message: 'Image not found' });
  }
}
export const imageOptimizationFun = (app) => {
  const classOptimization = new imageOptimizer();
  app.post(
    '/upload',
    classOptimization.imageUpload().single('file'),
    (req, res) => {
      res.status(200).json({
        message: 'Success',
        data: req.file,
      });
      // console.log('hello');
      // classOptimization.imageGet(req.query, res);
    }
  );
  app.get('/image', (req, res) => {
    classOptimization.imageGet(req.query, res);
  });
};
