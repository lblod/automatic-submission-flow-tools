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
 * Create a Task and store it in the triplestore.
 *
 * @see tasks.create
 * @public
 * @async
 * @function
 * @param {namedNode} operation - Define the Tasks' operation so that a job-controller can place this task with the correct step in its configured pipeline.
 * @param {namedNode} creator - The identifier for the service that creates this Task.
 * @param {namedNode} status - The inital status for this Task (usually scheduled, busy or equivalent).
 * @param {integer} index - Index number for this task, used by a job-controller to manage ordering of tasks.
 * @param {namedNode} job - The IRI of the Job that is the parent for this Task.
 * @param { { files: array(namedNode), remoteDataObjects: array(namedNode) } } [inputs] - Link either files or remote data objects to this Task as part of its inputs container.
 * @param {namedNode} cogsOperation - Define the Tasks' operation from the Cogs ontology.
 * @param {namedNode} graph - The graph in which this Task is to be store in the triplestore.
 * @returns {namedNode} The IRI representing the newly created Task.
 */
export async function create() {
  return tsk.create(...arguments);
}

/**
 * Update the status of an existing Task in the triplestore with the possibility to also store its results on success or an error on failure.
 *
 * @see task.updateStatus
 * @public
 * @async
 * @function
 * @param {namedNode} task - Represents the Task of which the status is to be updated.
 * @param {namedNode} status - The new status for this Task.
 * @param {namedNode} creator - The identifier for the service that updates this Task.
 * @param { { files: array(namedNode), remoteDataObjects: array(namedNode) } } [results] - Only when the new status is to indicate success: link either files or remote data objects to this Task as part of its results container.
 * @param {namedNode} [error] - Only when the new status is to indicate failure: link the Task to this error entity.
 * @returns {undefined} Nothing
 */
export async function updateStatus() {
  return tsk.updateStatus(...arguments);
}

//export async function getStatusFromActivity(jobActivity, operation) {
//}

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
 * @returns {array(object)} An array with objects of the structure `{ file: namedNode }` that refer to the attached (logical) files.
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
  return sparqlJsonParser.parseJsonResults(response);
}
