// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import multiparty from 'multiparty';
import { readFile } from 'fs/promises';
import { xml2json } from 'xml-js';

let globalLastRead = ['0', '0', '0'];
let globalLastWrite = ['0', '0', '0'];
let globalStateMap: {
  [key: string]: string;
} = {};

type JFFFile = {
  fields: {};
  files: {
    file: {
      0: {
        path: string;
        fieldName: string;
        originalFilename: string;
        size: number;
        headers: {
          'content-disposition': string;
          'content-type': string;
        };
      };
    };
  };
};

const uploadFile = async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new multiparty.Form();
  const data = (await new Promise((resolve, reject) => {
    form.parse(req, function (err, fields, files) {
      if (err) reject({ err });
      resolve({ fields, files });
    });
  })) as JFFFile;

  const { fields, files } = data;
  const file = files.file[0];

  const { path, originalFilename, size, headers } = file;

  const content = await readFile(path, 'utf-8');

  // Check if file is a JFF file
  if (
    headers['content-type'] !== 'application/octet-stream' ||
    originalFilename.split('.').pop() !== 'jff'
  ) {
    res.status(400).json({ message: 'Invalid file type' });
    return;
  }

  const contentJson = JSON.parse(
    xml2json(content, { compact: true, spaces: 2, trim: true })
  );

  const {
    _declaration: declaration,
    _comment: comment,
    structure,
  } = contentJson;

  if (comment != 'Created with JFLAP 7.1.') {
    res.status(400).json({ message: 'Invalid file type' });
    return;
  }

  if (structure.type._text != 'turing') {
    res.status(400).json({
      message: 'You provided something that is not a Turing Machine!',
    });
    return;
  }

  console.log(contentJson);
  let result = await calculateBinaryConversion(contentJson);
  res.status(200).json(result);
};

function getBinValue(val: any, type: string) {
  let selected = type === 'read' ? globalLastRead : globalLastWrite;
  return val === '0'
    ? '0'
    : val === '1'
    ? '00'
    : val === undefined
    ? '000'
    : selected.push('0') && selected.join('');
}

const getPartialBinary = async (transition: any): Promise<string> => {
  const from = transition.from._text;
  const to = transition.to._text;
  const read = transition.read._text;
  const write = transition.write._text;
  const move = transition.move._text;

  /* in order of the partial result */

  /* fromBinary = from * '0' + '0' */
  const fromBinary = globalStateMap[from];

  /* readBinary = 0 if read==0, 00 if read==1, 000 if read==undefined, create new variables for unkown values */
  let lastZero = ['0', '0', '0']; // this is undefined for the read value
  const readBinary = getBinValue(read, 'read');

  /*  toBinary = from * '0' + '0' (Exactly like fromBinary) */
  const toBinary = globalStateMap[to];

  /* same as read */
  const writeBinary = getBinValue(write, 'write');

  /* moveBinary = 0 if move==R, 00 if move==L, 000 if move==S */
  const moveBinary = move === 'L' ? '0' : move === 'R' ? '00' : '000';

  /* assemble the string, put '1' intercalating it*/
  const res =
    fromBinary +
    '1' +
    readBinary +
    '1' +
    toBinary +
    '1' +
    writeBinary +
    '1' +
    moveBinary;

  console.log(
    'de:' +
      from +
      ' para:' +
      to +
      ' le:' +
      read +
      ' escreve:' +
      write +
      ' move:' +
      move
  );

  console.log(
    'de:' +
      fromBinary +
      ' para:' +
      toBinary +
      ' le:' +
      readBinary +
      ' escreve:' +
      writeBinary +
      ' move:' +
      moveBinary
  );
  return res;
};

const calculateBinaryConversion = async (contentJson: any): Promise<string> => {
  // I think i'm not gonna make the type for this.
  // Believe my types (sorry, i'm in a rush for this small project)

  const states = contentJson.structure.automaton.state;
  // check if q0 exists
  const hasQ0 = states.find((state: any) => state._attributes.name === 'q0');

  for (let i = 0; i < states.length; i++) {
    let nameState = states[i]._attributes.name;
    let idState = states[i]._attributes.id;
    // get number from the name of state
    let number = nameState.split('q').pop();
    let partial = '0'.repeat(Number(number));
    partial += hasQ0 ? '0' : '';
    globalStateMap[idState] = partial;
  }

  console.log(globalStateMap);

  let res: string = '';

  const transitions = contentJson.structure.automaton.transition;

  for (let i = 0; i < transitions.length; i++) {
    const transition = transitions[i];
    // dont add "11" in the last transition
    res +=
      (await getPartialBinary(transition)) +
      (i === transitions.length - 1 ? '' : ' 11 ');
  }

  return res;
};

export default uploadFile;
export const config = {
  api: {
    bodyParser: false,
  },
};
