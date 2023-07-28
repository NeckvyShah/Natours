require('dotenv').config();

const date = new Date().toString();
console.log(date);

// forceColor
const forceColor = process.env.FORCE_COLOR;

if (forceColor === '1') {
  console.log('\x1b[31mThis text will be displayed in red.\x1b[0m');
  //   \x1b is an ANSI sequence for setting the color to red
} else {
  console.log('FORCE_COLOR environment variable is not set to 1.');
}
