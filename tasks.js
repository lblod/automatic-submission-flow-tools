/**
 * @module tasks
 * @description Create and update tasks in the triplestore.
 */

import * as mu from 'mu';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
const { namedNode, literal } = N3.DataFactory;

/**
 * Create a Task and store it in the triplestore.
 *
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
export async function create(
  operation,
  creator,
  status,
  index,
  job,
  inputs,
  cogsOperation,
  graph
) {
  const files = inputs?.files || [];
  const remoteDataObjects = inputs?.remoteDataObjects || [];
  const taskUuid = mu.uuid();
  const taskUri = cts.BASE_TABLE.task.concat(taskUuid);
  const nowSparql = mu.sparqlEscapeDateTime(new Date());
  //cogsOperation = cogsOperation || namedNode(cts.COGS_OPERATION.transformation);
  const writer = new N3.Writer();

  if (files.length || remoteDataObjects.length) {
    const inputContainerUuid = mu.uuid();
    const inputContainer = namedNode(
      cts.BASE_TABLE.resultsContainer.concat(inputContainerUuid)
    );
    writer.addQuad(
      inputContainer,
      namedNode(`${cts.PREFIX_TABLE.rdf}type`),
      namedNode(`${cts.PREFIX_TABLE.nfo}DataContainer`)
    );
    writer.addQuad(
      inputContainer,
      namedNode(`${cts.PREFIX_TABLE.mu}uuid`),
      literal(inputContainerUuid)
    );
    files.forEach((file) =>
      writer.addQuad(
        inputContainer,
        namedNode(`${cts.PREFIX_TABLE.task}hasFile`),
        file
      )
    );

    if (remoteDataObjects.length) {
      const harvestingCollectionUuid = mu.uuid();
      const harvestingCollection = namedNode(
        cts.BASE_TABLE.harvestingCollection.concat(harvestingCollectionUuid)
      );
      writer.addQuad(
        inputContainer,
        namedNode(`${cts.PREFIX_TABLE.task}hasHarvestingCollection`),
        harvestingCollection
      );
      writer.addQuad(
        harvestingCollection,
        namedNode(`${cts.PREFIX_TABLE.rdf}type`),
        namedNode(`${cts.PREFIX_TABLE.hrvst}HarvestingCollection`)
      );
      writer.addQuad(
        harvestingCollection,
        namedNode(`${cts.PREFIX_TABLE.mu}uuid`),
        literal(harvestingCollectionUuid)
      );
      writer.addQuad(
        harvestingCollection,
        namedNode(`${cts.PREFIX_TABLE.dct}creator`),
        creator
      );
      remoteDataObjects.forEach((rdo) =>
        writer.addQuad(
          harvestingCollection,
          namedNode(`${cts.PREFIX_TABLE.dct}hasPart`),
          rdo
        )
      );
    }
  }

  const inputTriples = await new Promise((resolve, reject) =>
    writer.end((error, result) => {
      if (error) reject(error);
      else resolve(result);
    })
  );

  const taskQuery = `
    ${cts.SPARQL_PREFIXES}
    INSERT DATA {
      GRAPH ${mu.sparqlEscapeUri(graph.value)} {
        ${mu.sparqlEscapeUri(taskUri)}
          a task:Task ;
          mu:uuid ${mu.sparqlEscapeString(taskUuid)} ;
          adms:status ${mu.sparqlEscapeUri(status.value)} ;
          dct:created ${nowSparql} ;
          dct:modified ${nowSparql} ;
          task:cogsOperation ${mu.sparqlEscapeUri(cogsOperation.value)} ;
          task:operation ${mu.sparqlEscapeUri(operation.value)} ;
          dct:creator ${mu.sparqlEscapeUri(creator.value)} ;
          task:index ${mu.sparqlEscapeString(index)} ;
          dct:isPartOf ${mu.sparqlEscapeUri(job.value)} .
        ${inputTriples}
      }
    }
  `;
  await mas.updateSudo(taskQuery);
  return namedNode(taskUri);
}

/**
 * Update the status of an existing Task in the triplestore with the possibility to also store its results on success or an error on failure.
 *
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
export async function updateStatus(task, status, creator, results, error) {
  const files = results?.files || [];
  const remoteDataObjects = results?.remoteDataObjects || [];
  const taskUriSparql = mu.sparqlEscapeUri(task.value);
  const nowSparql = mu.sparqlEscapeDateTime(new Date());
  const writer = new N3.Writer();

  if (status.value === cts.JOB_STATUSES.failed && error)
    writer.addQuad(task, namedNode(`${cts.PREFIX_TABLE.task}error`), error);

  if (
    status.value === cts.JOB_STATUSES.success &&
    (files.length || remoteDataObjects.length)
  ) {
    const resultsContainerUuid = mu.uuid();
    const resultsContainer = namedNode(
      cts.BASE_TABLE.resultsContainer.concat(resultsContainerUuid)
    );
    writer.addQuad(
      task,
      namedNode(`${cts.PREFIX_TABLE.task}resultsContainer`),
      resultsContainer
    );
    writer.addQuad(
      resultsContainer,
      namedNode(`${cts.PREFIX_TABLE.rdf}type`),
      namedNode(`${cts.PREFIX_TABLE.nfo}DataContainer`)
    );
    writer.addQuad(
      resultsContainer,
      namedNode(`${cts.PREFIX_TABLE.mu}uuid`),
      literal(resultsContainerUuid)
    );
    files.forEach((file) =>
      writer.addQuad(
        resultsContainer,
        namedNode(`${cts.PREFIX_TABLE.task}hasFile`),
        file
      )
    );

    if (remoteDataObjects.length) {
      const harvestingCollectionUuid = mu.uuid();
      const harvestingCollection = namedNode(
        cts.BASE_TABLE.harvestingCollection.concat(harvestingCollectionUuid)
      );
      writer.addQuad(
        resultsContainer,
        namedNode(`${cts.PREFIX_TABLE.task}hasHarvestingCollection`),
        harvestingCollection
      );
      writer.addQuad(
        harvestingCollection,
        namedNode(`${cts.PREFIX_TABLE.rdf}type`),
        namedNode(`${cts.PREFIX_TABLE.hrvst}HarvestingCollection`)
      );
      writer.addQuad(
        harvestingCollection,
        namedNode(`${cts.PREFIX_TABLE.mu}uuid`),
        literal(harvestingCollectionUuid)
      );
      writer.addQuad(
        harvestingCollection,
        namedNode(`${cts.PREFIX_TABLE.dct}creator`),
        creator
      );
      remoteDataObjects.forEach((rdo) =>
        writer.addQuad(
          harvestingCollection,
          namedNode(`${cts.PREFIX_TABLE.dct}hasPart`),
          rdo
        )
      );
    }
  }

  const errorsAndResultsTriples = await new Promise((resolve, reject) =>
    writer.end((error, result) => {
      if (error) reject(error);
      else resolve(result);
    })
  );

  const statusQuery = `
    ${cts.SPARQL_PREFIXES}
    DELETE {
      GRAPH ?g {
        ${taskUriSparql}
          adms:status ?oldStatus ;
          dct:modified ?oldModified .
      }
    }
    INSERT {
      GRAPH ?g {
        ${taskUriSparql}
          adms:status ${mu.sparqlEscapeUri(status.value)} ;
          dct:modified ${nowSparql} .
        ${errorsAndResultsTriples}
      }
    }
    WHERE {
      GRAPH ?g {
        ${taskUriSparql}
          adms:status ?oldStatus ;
          dct:modified ?oldModified .
      }
    }
  `;
  await mas.updateSudo(statusQuery);
}

//export async function getStatusFromActivity(jobActivity, operation) {
//}
