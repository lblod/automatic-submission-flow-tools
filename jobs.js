/**
 * @module jobs
 * @description Create and update Jobs in the triplestore.
 */

import * as mu from 'mu';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
import * as sjp from 'sparqljson-parse';
const { namedNode, quad } = N3.DataFactory;

/**
 * Create a Job and store it in the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} activity - A resource (submission, notification, ...) that triggered the creation of this Job.
 * @param {namedNode} creator - The identifier for the service that creates this Job.
 * @param {namedNode} graph - The graph in which this Job is to be store in the triplestore.
 * @returns {namedNode} The IRI representing the newly created Job.
 */
export async function create(activity, creator, graph) {
  const jobUuid = mu.uuid();
  const jobUri = cts.BASE_TABLE.job.concat(jobUuid);
  const nowSparql = mu.sparqlEscapeDateTime(new Date());
  const jobQuery = `
    ${cts.SPARQL_PREFIXES}
    INSERT DATA {
      GRAPH ${mu.sparqlEscapeUri(graph.value)} {
        ${mu.sparqlEscapeUri(jobUri)}
          a cogs:Job ;
          mu:uuid ${mu.sparqlEscapeString(jobUuid)} ;
          dct:creator ${mu.sparqlEscapeUri(creator.value)} ;
          adms:status ${mu.sparqlEscapeUri(cts.JOB_STATUSES.busy)} ;
          dct:created ${nowSparql} ;
          dct:modified ${nowSparql} ;
          task:cogsOperation cogs:TransformationProcess ;
          task:operation jobo:automaticSubmissionFlow ;
          prov:generatedBy ${mu.sparqlEscapeUri(activity.value)} .
      }
    }
  `;
  await mas.updateSudo(jobQuery);
  return namedNode(jobUri);
}

/**
 * Update the status of an existing Job in the triplestore with the possibility to also store an error on failure.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} job - Represents the Job of which the status is to be updated.
 * @param {namedNode} status - The new status for this Job.
 * @param {namedNode} [error] - Only when the new status is to indicate failure: link the Job to this error entity.
 * @returns {undefined} Nothing
 */
export async function updateStatus(job, status, error) {
  const jobUriSparql = mu.sparqlEscapeUri(job.value);
  const nowSparql = mu.sparqlEscapeDateTime(new Date());
  const errorTriple =
    status.value === cts.JOB_STATUSES.fail && error
      ? `${jobUriSparql} task:error ${mu.sparqlEscapeUri(error).value} .`
      : '';
  const statusQuery = `
    ${cts.SPARQL_PREFIXES}
    DELETE {
      GRAPH ?g {
        ${jobUriSparql}
          adms:status ?oldStatus ;
          dct:modified ?oldModified .
      }
    }
    INSERT {
      GRAPH ?g {
        ${jobUriSparql}
          adms:status ${mu.sparqlEscapeUri(status.value)} ;
          dct:modified ${nowSparql} .
        ${errorTriple}
      }
    }
    WHERE {
      GRAPH ?g {
        ${jobUriSparql}
          adms:status ?oldStatus ;
          dct:modified ?oldModified .
      }
    }`;
  await mas.updateSudo(statusQuery);
}

/**
 * Get information about the Job such as the type, status, the activity (submission, notification, ...) that led to the creation of this Job, and a potential error message and its type
 *
 * @public
 * @async
 * @function
 * @param {namedNode} activity - The resource (submission, notification, ...) that once triggered the creation of a Job.
 * @returns {store} A store containing information about the Job status, type, activity and optional error with its message.
 */
export async function getStatusFromActivity(activity) {
  const activitySparql = mu.sparqlEscapeUri(activity.value);
  const response = await mas.querySudo(`
    ${cts.SPARQL_PREFIXES}
    CONSTRUCT {
      ?job
        rdf:type cogs:Job ;
        adms:status ?jobStatus ;
        prov:generatedBy ?activity ;
        task:error ?error.
      ?error
        rdf:type oslc:Error ;
        oslc:message ?message .
      ?activity
        rdf:type ?activityType .
    }
    WHERE {
      ?job
        rdf:type cogs:Job ;
        adms:status ?jobStatus ;
        prov:generatedBy ?activity .
      OPTIONAL {
        ?job
          task:error ?error .
        ?error
          rdf:type oslc:Error ;
          oslc:message ?message .
        ${activitySparql}
          rdf:type ?activityType .
      }
    }
  `);
  const sparqlJsonParser = new sjp.SparqlJsonParser();
  const parsedResults = sparqlJsonParser.parseJsonResults(response);
  const store = new N3.Store();
  parsedResults.forEach((binding) =>
    store.addQuad(quad(binding.s, binding.p, binding.o))
  );
  return store;
}
