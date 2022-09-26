/**
 * @module asfTasks
 * @description Create and update tasks in the triplestore, more specifically tailored for the automatic-submission-flow.
 */

import * as mu from 'mu';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as tsk from './tasks.js';
import * as sjp from 'sparqljson-parse';

/**
 * @see {@link module:tasks.create}
 */
export async function create() {
  return tsk.create(...arguments);
}

/**
 * @see {@link module:task.updateStatus}
 */
export async function updateStatus() {
  return tsk.updateStatus(...arguments);
}

/**
 * Get some information about a task starting from a given remote data object that should be related to a single task.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} remoteDataObject - Represents the IRI of the remote data object where a single task should be related to.
 * @returns {object} A JavaScript object with the following information about the Task: `{namedNode} task`, `{namedNode} job`, `{namedNode} status`, `{namedNode} submissionGraph`, `{namedNode} [file]` and `{namedNode} [errorMsg]`, or `undefined` when no Task was found.
 */
export async function getTaskInfoFromRemoteDataObject(remoteDataObject) {
  const remoteDataObjectUriSparql = mu.sparqlEscapeUri(remoteDataObject.value);
  //NOTE this query is rather fragile, relying on the links between melding, job and task via non-documented properties, made by the download-url-service
  const taskQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?task ?job ?status ?submissionGraph ?file ?errorMsg WHERE {
      ?melding nie:hasPart ${remoteDataObjectUriSparql} .
      GRAPH ?submissionGraph {
        ?job prov:generatedBy ?melding .
        ?task
          dct:isPartOf ?job ;
          task:operation tasko:download ;
          adms:status ?status .
      }
      OPTIONAL { ?file nie:dataSource ${remoteDataObjectUriSparql} . }
      OPTIONAL { ${remoteDataObjectUriSparql} ext:cacheError ?errorMsg . }
    }
    LIMIT 1`;
  const response = await mas.querySudo(taskQuery);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  return parsedResults[0];
}

/**
 * Search for the files that may be linked to a certain Task through its input container. These could be logical files or remote data objects.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} task - The task that might have an input container with attached files.
 * @returns {array(namedNode)} An array with nodes that refer to the attached (logical) files.
 */
export async function getInputFilesFromTask(task) {
  const fileQuery = `
    ${cts.SPARQL_PREFIXES}
    SELECT ?file WHERE {
      ${mu.sparqlEscapeUri(task.value)}
        task:inputContainer ?inputContainer .
      ?inputContainer
        task:hasFile ?file .
    }`;
  const response = await mas.querySudo(fileQuery);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  return parsedResults.map((f) => f.file);
}
