/**
 * @module errors
 * @description Manage storing errors to the triplestore.
 */

import { v4 as uuid } from 'uuid';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
import * as rst from 'rdf-string-ttl';
const { namedNode, literal } = N3.DataFactory;

/**
 * Create an Error and store it in the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} creator - The identifier for the service that creates this Error.
 * @param {string} message - The message stores as the title for this error.
 * @param {string} [detail] - A much longer message explaining the error in more (technical) details.
 * @param {namedNode} [reference] - The IRI of an object the is being reference by this Error. This could be a service, a stored object, ...
 * @returns {namedNode} The IRI of the created Error.
 */
export async function create(creator, message, detail, reference) {
  const errorId = literal(uuid());
  const error = cts.BASE_TABLE.error.concat(errorId.value);
  message = literal(message);
  detail = literal(detail);
  const subject = literal('Automatic Submission Service');
  const now = literal(new Date().toISOString(), namedNode(cts.TYPES.dateTime));
  const errorGraph = namedNode(cts.GRAPHS.error);
  const referenceTriple = reference
    ? `${rst.termToString(error)}
         dct:references ${rst.termToString(reference)} .`
    : '';
  const detailTriple = detail
    ? `${rst.termToString(error)}
         oslc:largePreview ${rst.termToString(detail)} .`
    : '';
  const errorQuery = `
    ${cts.SPARQL_PREFIXES}
    INSERT DATA {
      GRAPH ${rst.termToString(errorGraph)} {
        ${rst.termToString(error)}
          a oslc:Error ;
          mu:uuid ${rst.termToString(errorId)} ;
          dct:subject ${rst.termToString(subject)} ;
          oslc:message ${rst.termToString(message)} ;
          dct:created ${rst.termToString(now)} ;
          dct:creator ${rst.termToString(creator)} .
        ${referenceTriple}
        ${detailTriple}
      }
    }`;
  await mas.updateSudo(errorQuery);
  return error;
}
