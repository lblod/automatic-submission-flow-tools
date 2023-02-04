/**
 * @module asfSubmissions
 * @description Retreive and set information about Submissions in the triplestore.
 */

import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as sjp from 'sparqljson-parse';
import * as N3 from 'n3';
import * as rst from 'rdf-string-ttl';
const { literal } = N3.DataFactory;

////////////////////////////////////////////////////////////////////////////////
// Submissions
////////////////////////////////////////////////////////////////////////////////

/**
 * Get some information about the Submission, its document and its downloaded file.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} submission - Represents the IRI of the Submission you want more information about.
 * @returns {object} A JavaScript object with the following information about the Submission: `{namedNode} submission`, `{literal} documentUrl`, `{namedNode} submittedDocument`, `{namedNode} status`, `{namedNode} remoteDataObject`, `{namedNode} physicalFile` and `{namedNode} graph` that contains information about the Submission.
 */
export async function getSubmissionInfo(submission) {
  const infoQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?submission ?status ?documentUrl ?remoteDataObject ?physicalFile ?submittedDocument ?graph WHERE {
      GRAPH ?graph {
        ?physicalFile
          nie:dataSource ?remoteDataObject .
        ?submission
          nie:hasPart ?remoteDataObject ;
          prov:atLocation ?documentUrl ;
          dct:subject ?submittedDocument ;
          adms:status ?status .
        BIND ( ${rst.termToString(submission)} as ?submission )
      }
    } LIMIT 1`;
  const response = await mas.querySudo(infoQuery);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  return parsedResults[0];
}

/**
 * Get some information about the Submission, its document and its downloaded file.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} remoteDataObject - Represents the IRI of the remote data object that is linked to a submission.
 * @returns {array(object)} An array of objects with the structure: `{ submission: namedNode, documentUrl: literal, file: namedNode, submittedDocument: namedNode, status: namedNode, graph: namedNode }` that contain information about the Submissions.
 */
export async function getSubmissionInfoFromRemoteDataObject(remoteDataObject) {
  const remoteDataObjectSparql = rst.termToString(remoteDataObject);
  const infoQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?submission ?documentUrl ?file ?submittedDocument ?status ?graph
    WHERE {
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

/**
 * Get some information about the Submission, its document and its downloaded file.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} task - The task the submission is related to.
 * @returns {object} A JavaScript object with the following information about the Submission: `{namedNode} submission`, `{literal} documentUrl`, `{namedNode} submittedDocument`, `{namedNode} status` and `{namedNode} graph` that contains information about the Submission.
 */
export async function getSubmissionInfoFromTask(task) {
  const infoQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?submission ?documentUrl ?submittedDocument ?status ?graph
    WHERE {
      GRAPH ?graph {
        ${rst.termToString(task)}
          a task:Task ;
          dct:isPartOf ?job .
        ?job prov:generatedBy ?submission .
        ?submission
          dct:subject ?submittedDocument ;
          prov:atLocation ?documentUrl ;
          adms:status ?status .
      }
    } LIMIT 1
  `;
  const response = await mas.querySudo(infoQuery);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  return parsedResults[0];
}

/**
 * Get some information about the Submission, its document and its downloaded file.
 *
 * @public
 * @async
 * @function
 * @param {literal} id - Representing the id of the Submitted Document that is related to the Submission.
 * @returns {object} A JavaScript object with the following information about the Submission: `{namedNode} submission`, `{literal} documentUrl`, `{namedNode} submittedDocument`, `{namedNode} status` and `{namedNode} graph` that contains information about the Submission.
 */
export async function getSubmissionInfoFromSubmissionDocumentId(id) {
  const infoQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?submission ?documentUrl ?submittedDocument ?status ?graph
    WHERE {
      GRAPH ?graph {
        ?submittedDocument
          mu:uuid ${rst.termToString(id)} .
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

////////////////////////////////////////////////////////////////////////////////
// Submission Documents
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
        ${rst.termToString(task)}
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
          mu:uuid ${rst.termToString(literal(uuid))} .
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
