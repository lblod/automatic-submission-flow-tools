/**
 * @module asfSubmissions
 * @description Retreive and set information about Submissions in the triplestore.
 */

import * as mu from 'mu';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as sjp from 'sparqljson-parse';
import * as N3 from 'n3';
const { namedNode } = N3.DataFactory;

////////////////////////////////////////////////////////////////////////////////
// Submissions
////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////
// Submissions Documents
////////////////////////////////////////////////////////////////////////////////

/**
 * Get the Submission Document that is being processed by the Job related to the given Task.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} task - The IRI of the Task that is linked to a Job that processes the wanted Submission Document.
 * @returns {namedNode} An IRI representing the Submission Document.
 */
export async function getSubmissionDocumentFromTask(task) {
  const infoQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?submissionDocument
    WHERE {
      GRAPH ?g {
        ${mu.sparqlEscapeUri(task.value)}
          a task:Task ;
          dct:isPartOf ?job .
        ?job prov:generatedBy ?submission .
        ?submission dct:subject ?submissionDocument .
      }
    } LIMIT 1
  `;

  const response = await mas.querySudo(infoQuery);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  return parsedResults[0]?.submissionDocument;
}

/**
 * Get some information about the Submission Document with the given id and about the related Submission.
 *
 * @public
 * @async
 * @function
 * @param {string} uuid - The ID of the Submission Document you want information about.
 * @returns {array(object)} An array of objects with the structure: `{ submissionDocument: namedNode, status: namedNode }` that contains information about the Submission Document and Submission.
 */
export async function getSubmissionDocumentInfoById(uuid) {
  const infoQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?submissionDocument ?status
    WHERE {
      GRAPH ?g {
        ?submissionDocument
          mu:uuid ${mu.sparqlEscapeString(uuid)} .
        ?submission
          dct:subject ?submissionDocument ;
          adms:status ?status .
      }
    } LIMIT 1
  `;

  const response = await mas.querySudo(infoQuery);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  return parsedResults[0];
}
