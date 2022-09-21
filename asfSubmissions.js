/**
 * @module asfSubmissions
 * @description Retreive and set information about Submissions in the triplestore.
 */

import * as mu from 'mu';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
import * as sjp from 'sparqljson-parse';
const { namedNode } = N3.DataFactory;

/**
 * Get some information about the Submission, its document and its downloaded file.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} remoteDataObject - Represents the IRI of the remote data object that is linked to a submission.
 * @returns {array(object)} An array of objects with the structure: `{ submission: namedNode, documentUrl: literal, file: namedNode, submittedDocument: namedNode }` that contains information about the Submission.
 */
export async function getSubmissionInfoFromRemoteDataObject(remoteDataObject) {
  const remoteDataObjectSparql = mu.sparqlEscapeUri(remoteDataObject.value);
  const infoQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?submission ?documentUrl ?file ?submittedDocument ?graph WHERE {
      GRAPH ?graph {
        ?file
          nie:dataSource ${remoteDataObjectSparql} .
        ?submission
          nie:hasPart ${remoteDataObjectSparql} ;
          prov:atLocation ?documentUrl ;
          dct:subject ?submittedDocument .
      }
    }`;

  const response = await mas.querySudo(infoQuery);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  return sparqlJsonParser.parseJsonResults(response);
}
