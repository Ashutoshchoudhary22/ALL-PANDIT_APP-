require('dotenv').config();
const { isCloudinaryConfigured } = require('../config/cloudinary');

async function testCloudinary() {
  console.log('Cloudinary configuration check...\n');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log('CLOUDINARY_CLOUD_NAME:', cloudName ? `${cloudName.slice(0, 4)}***` : '(missing)');
  console.log('CLOUDINARY_API_KEY:', apiKey ? `${apiKey.slice(0, 4)}***` : '(missing)');
  console.log('CLOUDINARY_API_SECRET:', apiSecret ? '***set***' : '(missing)');

  if (!isCloudinaryConfigured()) {
    console.error('\nCloudinary is NOT configured.');
    console.error('Add these to Backend/.env from https://cloudinary.com/console');
    process.exit(1);
  }

  console.log('\nCloudinary is configured.');
  console.log('Demo image URL:');
  console.log(`https://res.cloudinary.com/${cloudName}/image/upload/w_200,h_200,c_fill/sample.jpg`);
}

testCloudinary().catch((err) => {
  console.error(err);
  process.exit(1);
});
