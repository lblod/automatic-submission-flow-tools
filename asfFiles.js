/**
 * @module asfFiles
 * @description Manage file data in the triplestore, more specifically tailored for the automatic-submission-flow. Some functions also deal with reading and writing contents to physical storage.
 */

import * as mas from '@lblod/mu-auth-sudo';
import * as fs from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import * as fil from './files.js';
import * as sjp from 'sparqljson-parse';
import * as cts from './constants.js';
import * as rst from 'rdf-string-ttl';

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
 * @param {namedNode} creator - The identifier for the service that creates this File.
 * @param {namedNode} graph - The graph in which the file data is to be stored.
 * @returns {object} Same object as received from `files.create`.
 */
export async function createFromContent(content, creator, graph) {
  const pathPrefix = '/share/submissions/';
  const buffer = Buffer.from(content);
  const fileSize = Buffer.byteLength(buffer);
  const extension = 'ttl';

  const filesData = await fil.create(
    pathPrefix,
    extension,
    fileSize,
    creator,
    graph
  );
  await fs.writeFile(filesData.physicalFilePath, buffer, 'utf-8');
  return filesData;
}

/**
 * Load the contents of a file given by its path in the form of a physical file IRI.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} physicalFile - Represents the IRI of the physical file. Usually this translates almost directly to the location on physical storage.
 * @returns {string} Contents of the file as a string.
 */
export async function loadFromPhysicalFile(physicalFile) {
  const path = physicalFile.value.replace('share://', '/share/');
  return fs.readFile(path, 'utf-8');
}

/**
 * Supply the contents of a file, given by its path as a physical file IRI, as a stream.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} physicalFile - Represents the IRI of the physical file. Usually this translates almost directly to the location on physical storage.
 * @returns {stream} A stream to access the contents of the file.
 */
export async function loadStreamFromPhysicalFile(physicalFile) {
  const path = physicalFile.value.replace('share://', '/share/');
  const fileHandle = await fs.open(path);
  return fileHandle.createReadStream({ encoding: 'utf-8' });
}

/**
 * Load the contents of a file given by its logical file IRI. The physical file is retreived from the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} logicalFile - Represents the IRI of the logical file. The physical couterpart is retreived from the triplestore and the content is loaded from the path the physical file represents.
 * @returns {string} Contents of the file as a string.
 */
export async function loadFromLogicalFile(logicalFile) {
  const response = await mas.querySudo(`
    ${cts.SPARQL_PREFIXES}
    SELECT ?physicalFile WHERE {
      ?physicalFile nie:dataSource ${rst.termToString(logicalFile)} .
    } LIMIT 1
  `);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  const physicalFile = parsedResults[0]?.physicalFile;
  return loadFromPhysicalFile(physicalFile);
}

/**
 * Update the contents of a file given by its physical file IRI. This overwrites the contents on storage and updates the modification times and file size in the triplestore.
 *
 * @public
 * @async
 * @funcion
 * @param {namedNode} physicalFile - Represents the IRI of the physical file you want to update. This usually translates almost directly to the location on physical storage.
 * @param {string|buffer|...} content - The contents that will be written to the file. This is converted to a buffer first, so anything the Node's `Buffer.from()` will take is fine.
 * @returns {undefined} Nothing
 */
export async function updateContentForPhysicalFile(physicalFile, content) {
  const path = physicalFile.value.replace('share://', '/share/');
  const buffer = Buffer.from(content);
  const fileSize = Buffer.byteLength(buffer);
  const response = await mas.querySudo(`
    ${cts.SPARQL_PREFIXES}
    SELECT ?logicalFile WHERE {
      ${rst.termToString(physicalFile)} nie:dataSource ?logicalFile .
    } LIMIT 1
  `);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  const logicalFile = parsedResults[0]?.logicalFile;
  await fs.writeFile(path, buffer, 'utf-8');
  return fil.update(logicalFile, fileSize);
}

/**
 * Update the contents of a file given by its logical file IRI. This overwrites the contents on storage and updates the modification times and file size in the triplestore.
 *
 * @public
 * @async
 * @funcion
 * @param {namedNode} logicalFile - Represents the IRI of the logical file you want to update. The physical couterpart will be retreived from the triplestore.
 * @param {string|buffer|...} content - The contents that will be written to the file. This is converted to a buffer first, so anything the Node's `Buffer.from()` will take is fine.
 * @returns {undefined} Nothing
 */
export async function updateContentForLogicalFile(logicalFile, content) {
  const response = await mas.querySudo(`
    ${cts.SPARQL_PREFIXES}
    SELECT ?physicalFile WHERE {
      ?physicalFile nie:dataSource ${rst.termToString(logicalFile)} .
    } LIMIT 1
  `);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  const physicalFile = parsedResults[0]?.physicalFile;
  const path = physicalFile.value.replace('share://', '/share/');
  const buffer = Buffer.from(content);
  const fileSize = Buffer.byteLength(buffer);
  await fs.writeFile(path, buffer, 'utf-8');
  return fil.update(logicalFile, fileSize);
}

/**
 * Remove a file on physical storage as well as from the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} physicalFile - The IRI that represents the physical file that needs to be removed. The IRI almost directly translates to a path on physical storage.
 * @returns {undefined} Nothing
 */
export async function removeFromPhysicalFile(physicalFile) {
  const response = await mas.querySudo(`
    ${cts.SPARQL_PREFIXES}
    SELECT ?logicalFile WHERE {
      ${rst.termToString(physicalFile)} nie:dataSource ?logicalFile .
    } LIMIT 1
  `);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  const logicalFile = parsedResults[0]?.logicalFile;
  const path = physicalFile.value.replace('share://', '/share/');
  await fs.unlink(path);
  return fil.remove(logicalFile);
}

/**
 * Remove a file on physical storage as well as from the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} logicalFile - The IRI that represents the logical file that needs to be removed. The physical couterpart is retrieved to remove from physical storage.
 * @returns {undefined} Nothing
 */
export async function removeFromLogicalFile(logicalFile) {
  const response = await mas.querySudo(`
    ${cts.SPARQL_PREFIXES}
    SELECT ?physicalFile WHERE {
      ?physicalFile nie:dataSource ${rst.termToString(logicalFile)} .
    } LIMIT 1
  `);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  const physicalFile = parsedResults[0]?.physicalFile;
  const path = physicalFile.value.replace('share://', '/share/');
  await fs.unlink(path);
  return fil.remove(logicalFile);
}
