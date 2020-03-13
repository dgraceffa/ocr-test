const { createWorker, PSM, OEM } = require('tesseract.js');
const { readFileSync, readdirSync } = require('fs');
const chalk = require('chalk');
const natural = require('natural');

const worker = createWorker({
  // logger: m => console.log(m)
});

let debug = false;
let fileArg = null;
if (process.argv[2] && process.argv[2] == '-d') { 
  debug = true;
  fileArg = process.argv[3];
} else if (process.argv[2]) {
  fileArg = process.argv[2];
}

(async () => {

  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng', OEM.LSTM_ONLY);

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
      const {data} = await worker.recognize(img);
      if (debug) {
        console.log('Recognized:', data.text);
      }
      const targa = findTarghe(data);
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

function findTarghe(data) {
  let text = data.text;

  const targhe = data.lines.map((line, i) => {
    // console.log(`Line ${i}: `, line.text);
    let lineText = "" +  line.text.replace(/[&\/\\#,+()\-\[\]$~%.'":*?°‘’`<>\{\}\s]/g, '').toUpperCase();
    if (debug) {
      console.log(`Line ${i}: ` , lineText)
    }
    const match = lineText.match(/[QWERTYUIOPASDFGHJKLZXCVBNM][QWERTYUIOPASDFGHJKLZXCVBNM]\w\w\w[QWERTYUIOPASDFGHJKLZXCVBNM][QWERTYUIOPASDFGHJKLZXCVBNM]/);
    if (match && match.length > 0) {
      if (debug) {
        console.log('Match:', match[0]);
      }
      const first = match[0].substr(0, 2);
      const middle = match[0].substr(2,3).replace('S', '5').replace('O', '0').replace('I', '1').match(/\d\d\d/);
      const last = match[0].substring(5);

      if (first && middle && last) {
        return first + middle[0] + last;
      }
    }
    return null;
  }).filter(t => t !== null);

  if (debug) {
    console.log("FOUND", targhe[0], '\n')
  }
  return targhe[0];
}
