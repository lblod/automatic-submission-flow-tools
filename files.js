/**
 * @module files
 * @description Create and update logical and physical file data in the triplestore.
 */

import * as mu from 'mu';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
const { namedNode } = N3.DataFactory;

/**
 * Create a logical and physical file and store it in the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {string} pathPrefix - Defines where the file will be stored on physical storage. This string is concatenated with a UUID and extension to get the full file path. **This function does not store file contents to physical storage!**
 * @param {string} extension - The file extension. Will also be used to lookup the MIME type of the contents.
 * @param {number} size - The file size in bytes.
 * @param {namedNode} graph - Represents the graph IRI where these logical and physical files will be stored.
 * @returns {object} An object with structure `{ logicalFile: namedNode, physicalFile: namedNode, physicalFilePath: string }`. **This function does not store any contenst to physical storage, but only returns the full filepath that is used to store the file data. Use this path to store contents.**
 */
export async function create(pathPrefix, extension, size, graph) {
  const physicalUuid = mu.uuid();
  const logicalUuid = mu.uuid();
  const filename = `${physicalUuid}.${extension}`;
  const path = pathPrefix.concat(filename);
  const physicalUri = path.replace('/share/', 'share://');
  const logicalUri = cts.BASE_TABLE.asj.concat(logicalUuid);
  const nowSparql = mu.sparqlEscapeDateTime(new Date());
  const format = cts.FORMATS[extension];

  await mas.updateSudo(`
    ${cts.SPARQL_PREFIXES}
    INSERT {
      GRAPH ${mu.sparqlEscapeUri(graph.value)} {
        ${mu.sparqlEscapeUri(physicalUri)}
          a nfo:FileDataObject;
          nie:dataSource ${mu.sparqlEscapeUri(logicalUri)} ;
          mu:uuid ${mu.sparqlEscapeString(physicalUuid)};
          nfo:fileName ${mu.sparqlEscapeString(filename)} ;
          dct:creator ${mu.sparqlEscapeUri(cts.SERVICES.importSubmision)} ;
          dct:created ${nowSparql} ;
          dct:modified ${nowSparql} ;
          dct:format ${mu.sparqlEscapeString(format)} ;
          nfo:fileSize ${mu.sparqlEscapeInt(size)} ;
          dbpedia:fileExtension ${mu.sparqlEscapeString(extension)} .

        ${mu.sparqlEscapeUri(logicalUri)}
          a nfo:FileDataObject;
          mu:uuid ${mu.sparqlEscapeString(logicalUuid)} ;
          nfo:fileName ${mu.sparqlEscapeString(filename)} ;
          dct:creator ${mu.sparqlEscapeUri(cts.SERVICES.importSubmision)} ;
          dct:created ${nowSparql} ;
          dct:modified ${nowSparql} ;
          dct:format ${mu.sparqlEscapeString(format)} ;
          nfo:fileSize ${mu.sparqlEscapeInt(size)} ;
          dbpedia:fileExtension ${mu.sparqlEscapeString(extension)} .
      }
    }`);
  return {
    logicalFile: namedNode(logicalUri),
    physicalFile: namedNode(physicalUri),
    physicalFilePath: path,
  };
}
