const ImageKit = require('@imagekit/nodejs');
const { v4: uuidv4 } = require('uuid');


const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'test_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'test_private_key',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/test',
});

async function uploadImage({ buffer, folder = '/products' }) {
    const res = await imagekit.upload({
        file: buffer,
        fileName: uuidv4(),
        folder,
    });
    return {
        url: res.url,
        thumbnail: res.thumbnailUrl || res.url,
        id: res.fileId,
    };
}

module.exports = { imagekit, uploadImage };