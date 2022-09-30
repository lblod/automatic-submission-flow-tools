/**
 * @module files
 * @description Create and update logical and physical file data in the triplestore.
 */

import { v4 as uuid } from 'uuid';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
import * as rst from 'rdf-string-ttl';
const { namedNode, literal } = N3.DataFactory;

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
 * @param {namedNode} creator - The identifier for the service that creates this File.
 * @returns {object} An object with structure `{ logicalFile: namedNode, physicalFile: namedNode, physicalFilePath: string }`. **This function does not store any contenst to physical storage, but only returns the full filepath that is used to store the file data. Use this path to store contents.**
 */
export async function create(pathPrefix, extension, size, creator, graph) {
  const physicalUuid = literal(uuid());
  const logicalUuid = literal(uuid());
  const filename = literal(`${physicalUuid}.${extension}`);
  const path = pathPrefix.concat(filename.value);
  const physical = namedNode(path.replace('/share/', 'share://'));
  const logical = namedNode(cts.BASE_TABLE.file.concat(logicalUuid));
  const now = literal(new Date().toISOString(), namedNode(cts.TYPES.dateTime));
  const nowSparql = rst.termToString(now);
  const format = literal(cts.FORMATS[extension]);
  size = literal(size, cts.TYPES.integer);
  extension = literal(extension);

  await mas.updateSudo(`
    ${cts.SPARQL_PREFIXES}
    INSERT DATA {
      GRAPH ${rst.termToString(graph)} {
        ${rst.termToString(physical)}
          a nfo:FileDataObject ;
          nie:dataSource ${rst.termToString(logical)} ;
          mu:uuid ${rst.termToString(physicalUuid)} ;
          nfo:fileName ${rst.termToString(filename)} ;
          dct:creator ${rst.termToString(creator)} ;
          dct:created ${nowSparql} ;
          dct:modified ${nowSparql} ;
          dct:format ${rst.termToString(format)} ;
          nfo:fileSize ${rst.termToString(size)} ;
          dbpedia:fileExtension ${rst.termToString(extension)} .

        ${rst.termToString(logical)}
          a nfo:FileDataObject ;
          mu:uuid ${rst.termToString(logicalUuid)} ;
          nfo:fileName ${rst.termToString(filename)} ;
          dct:creator ${rst.termToString(creator)} ;
          dct:created ${nowSparql} ;
          dct:modified ${nowSparql} ;
          dct:format ${rst.termToString(format)} ;
          nfo:fileSize ${rst.termToString(size)} ;
          dbpedia:fileExtension ${rst.termToString(extension)} .
      }
    }`);
  return {
    logicalFile: logical,
    physicalFile: physical,
    physicalFilePath: path,
  };
}

/**
 * Update file information after contents of the file have been updated. This means updating the file size and the modified date.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} logicalFile - The logical file represented by IRI.
 * @param {integer} size - The new file size in bytes.
 * @returns {undefined} Nothing
 */
export async function update(logicalFile, size) {
  const now = literal(new Date().toISOString(), namedNode(cts.TYPES.dateTime));
  const nowSparql = rst.termToString(now);
  size = literal(size, cts.TYPES.integer);
  await mas.updateSudo(`
    ${cts.SPARQL_PREFIXES}
    DELETE {
      GRAPH ?g {
        ?physicalFile
          dct:modified ?modified ;
          nfo:fileSize ?fileSize .
        ?logicalFile
          dct:modified ?modified ;
          nfo:fileSize ?fileSize .
      }
    }
    INSERT {
      GRAPH ?g {
        ?physicalFile
          dct:modified ${nowSparql} ;
          nfo:fileSize ${rst.termToString(size)} .
        ?logicalFile
          dct:modified ${nowSparql} ;
          nfo:fileSize ${rst.termToString(size)} .
      }
    }
    WHERE {
      GRAPH ?g {
        BIND ( ${rst.termToString(logicalFile)} as ?logicalFile )
        ?physicalFile
          a nfo:FileDataObject ;
          nie:dataSource ?logicalFile .
        ?logicalFile
          a nfo:FileDataObject .
      }
    }
  `);
}

/**
 * Completely remove all information about the file from the triplestore. This includes the logical and physical file data.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} logicalFile - The IRI representing the file you want removed.
 * @returns {undefined} Nothing
 */
export async function remove(logicalFile) {
  await mas.updateSudo(`
    ${cts.SPARQL_PREFIXES}
    DELETE {
      GRAPH ?g {
        ?physicalFile ?pp ?op .
        ?logicalFile ?pl ?ol .
      }
    }
    WHERE {
      GRAPH ?g {
        BIND ( ${rst.termToString(logicalFile)} as ?logicalFile )
        ?physicalFile
          a nfo:FileDataObject ;
          nie:dataSource ?logicalFile ;
          ?pp ?op .
        ?logicalFile
          a nfo:FileDataObject ;
          ?pl ?ol .
      }
    }
  `);
}
