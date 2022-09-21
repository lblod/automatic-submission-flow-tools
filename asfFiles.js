/**
 * @module asfFiles
 * @description Manage file data in the triplestore, more specifically tailored for the automatic-submission-flow. Some functions also deal with reading and writing contents to physical storage.
 */

import * as fs from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import * as fil from './files.js';

/**
 * @see {@link module:files.create}
 */
export async function create() {
  return fil.create(...arguments);
}

/**
 * Creates logical and physical file data in the triplestore and writes the given contents to the generated path on physical storage.
 *
 * @public
 * @async
 * @function
 * @param {string|buffer|...} content - The contents that will be written to a file. This is converted to a buffer first, so anything the Node's `Buffer.from()` will take is fine.
 * @param {namedNode} graph - The graph in which the file data is to be stored.
 * @returns {object} Same object as received from `files.create`.
 */
export async function createFromContent(content, graph) {
  const pathPrefix = '/share/submissions/';
  const buffer = Buffer.from(content);
  const fileSize = Buffer.byteLength(buffer);
  const extension = 'ttl';

  const filesData = await fil.create(pathPrefix, extension, fileSize, graph);
  await fs.writeFile(filesData.physicalFilePath, buffer, 'utf-8');
  return filesData;
}
