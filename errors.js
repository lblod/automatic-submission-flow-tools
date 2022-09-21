/**
 * @module errors
 * @description Manage storing errors to the triplestore.
 */

import * as mu from 'mu';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
const { namedNode } = N3.DataFactory;

/**
 * Create an Error and store it in the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {string} message - The message stores as the title for this error.
 * @param {string} [detail] - A much longer message explaining the error in more (technical) details.
 * @param {namedNode} [reference] - The IRI of an object the is being reference by this Error. This could be a service, a stored object, ...
 * @returns {namedNode} The IRI of the created Error.
 */
export async function create(message, detail, reference) {
  const errorId = mu.uuid();
  const errorUri = cts.BASE_TABLE.error.concat(errorId);
  const referenceTriple = reference
    ? `${mu.sparqlEscapeUri(errorUri)}
         dct:references ${mu.sparqlEscapeUri(reference)} .`
    : '';
  const detailTriple = detail
    ? `${mu.sparqlEscapeUri(errorUri)}
         oslc:largePreview ${mu.sparqlEscapeString(detail)} .`
    : '';
  const errorQuery = `
    ${cts.SPARQL_PREFIXES}
    INSERT DATA {
      GRAPH ${mu.sparqlEscapeUri(cts.GRAPHS.error)} {
        ${mu.sparqlEscapeUri(errorUri)}
          a oslc:Error ;
          mu:uuid ${mu.sparqlEscapeString(errorId)} ;
          dct:subject ${mu.sparqlEscapeString('Automatic Submission Service')} ;
          oslc:message ${mu.sparqlEscapeString(message)} ;
          dct:created ${mu.sparqlEscapeDateTime(new Date().toISOString())} ;
          dct:creator ${mu.sparqlEscapeUri(cts.SERVICES.automaticSubmission)} .
        ${referenceTriple}
        ${detailTriple}
      }
    }`;
  await mas.updateSudo(errorQuery);
  return namedNode(errorUri);
}
