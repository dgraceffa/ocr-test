const { createWorker, PSM, OEM } = require('tesseract.js');
const { readFileSync, readdirSync } = require('fs');
const chalk = require('chalk');
const natural = require('natural');

let debug = false;
let fileArg = null;

if (process.argv[2] && process.argv[2] == '-d') { 
  debug = true;
  fileArg = process.argv[3];
} else if (process.argv[2]) {
  fileArg = process.argv[2];
}

const worker = createWorker({
});

(async () => {
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  await worker.setParameters({
    tessedit_char_whiltelist: '0123456789QWERTYUIOPASDFGHJKLZXCVBNM',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK
  });

  const files = readdirSync('.');
  const targhe = [];
  for (const file of files) {
    if (fileArg && file !== fileArg) {
      continue;
    }
    if (file.endsWith('.png')) {
      if (debug) {
        console.log(chalk.green('***', file, '***'))
      }
      const img = readFileSync(file);
      const targa = await recognize(img);
      if (targa) {
        targhe.push({
          file: file,
          targa: targa || 'Not recognized'
        });
      }
    }
  }
  
  console.log("FINAL", targhe)

  await worker.terminate();
})();

async function recognize(data) {
  let { data: { text } } = await worker.recognize(data);
  text = text.replace(/[&\/\\#,+()$~%.'":*?°‘’`<>{}]/g, '');
  text = text.replace(/ /g, '');
  text = text.replace('-', '');
  text = text.replace('[', '');
  text = text.replace(']', '');
  text = text.replace('@', '');
  text = text.replace('\n', '');
  text = text.trim();
  text = await invalidTextAtStart(text);
  // while (text.length > 7) {

  // }
  let partA = await isLetters(text.slice(0, 2));
  let partB = await isNumbers(text.slice(2, 5));
  let partC = await isLetters(text.slice(5, 7));

  !partA ? partA = '' : null;
  !partB ? partB = '' : null;
  !partC ? partC = '' : null;
  text = partA.concat(partB, partC);
  // console.log(text)
  // const regex = new RegExp(/[a-zA-Z]{2}[0-9]{3}[a-zA-Z]{2}/);
  // if (regex.test(text)) {

  if (debug) {
    console.log("FOUND", text)
  }
  return text;
}

async function isLetters(string) {
  for (let i = 0; i < string.length; i++) {
    switch (string.charAt(i)) {
      case '1':
        string = string.replace("1", "T")
        break
      case '7':
        string = string.replace("7", "Z")
        break
      case '4':
        string = string.replace("4", "A")
        break
      case '8':
        string = string.replace("8", "B")
        break
      case '6':
        string = string.replace("6", "G")
        break
      case '5':
        string = string.replace("5", "S")
        break
      case '0':
        string = string.replace("0", "D")
        break
      case '€':
        string = string.replace("€", "C")
        break
    }
    if (i == string.length - 1) {
      return string;
    }
  }
}

async function isNumbers(string) {
  for (let i = 0; i < string.length; i++) {
    switch (string.charAt(i)) {
      case 'O':
        string = string.replace('O', '0')
        break
      case 'Q':
        string = string.replace('Q', '0')
        break
      case 'S':
        string = string.replace('S', '5')
        break
      case 'I':
        string = string.replace('I', '1')
        break
      case 'T':
        string = string.replace('T', '1')
        break
      case 'Z':
        string = string.replace('Z', '4')
        break
      case '£':
        string = string.replace('£', '4')
        break
      case 'L':
        string = string.replace('L', '4')
        break
    }
    if (i === string.length - 1) {
      return string;
    }
  }
}

async function invalidTextAtStart(string) {
  string = string.toUpperCase();
  if (string.startsWith('I')) {
    return string.substr(1);
  } else {
    return string;
  }
}