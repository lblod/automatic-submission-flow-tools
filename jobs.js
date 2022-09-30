/**
 * @module jobs
 * @description Create and update Jobs in the triplestore.
 */

import { v4 as uuid } from 'uuid';
import * as mas from '@lblod/mu-auth-sudo';
import * as cts from './constants.js';
import * as N3 from 'n3';
import * as sjp from 'sparqljson-parse';
import * as rst from 'rdf-string-ttl';
const { namedNode, quad, literal } = N3.DataFactory;

/**
 * Create a Job and store it in the triplestore.
 *
 * @public
 * @async
 * @function
 * @param {namedNode} operation - Define the Job's operation from the Task Operations ontology to distinguish between Jobs.
 * @param {namedNode} activity - A resource (submission, notification, ...) that triggered the creation of this Job.
 * @param {namedNode} creator - The identifier for the service that creates this Job.
 * @param {namedNode} cogsOperation - Define the Job's operation from the Cogs ontology.
 * @param {namedNode} graph - The graph in which this Job is to be store in the triplestore.
 * @returns {namedNode} The IRI representing the newly created Job.
 */
export async function create(
  operation,
  activity,
  creator,
  cogsOperation,
  graph
) {
  const jobUuid = literal(uuid());
  const job = namedNode(cts.BASE_TABLE.job.concat(jobUuid.value));
  const now = literal(new Date().toISOString(), namedNode(cts.TYPES.dateTime));
  const nowSparql = rst.termToString(now);
  const jobQuery = `
    ${cts.SPARQL_PREFIXES}
    INSERT DATA {
      GRAPH ${rst.termToString(graph)} {
        ${rst.termToString(job)}
          a cogs:Job ;
          mu:uuid ${rst.termToString(jobUuid)} ;
          dct:creator ${rst.termToString(creator)} ;
          adms:status ${rst.termToString(namedNode(cts.JOB_STATUSES.busy))} ;
          dct:created ${nowSparql} ;
          dct:modified ${nowSparql} ;
          task:operation ${rst.termToString(operation)} ;
          task:cogsOperation ${rst.termToString(cogsOperation)} ;
          prov:generatedBy ${rst.termToString(activity)} .
      }
    }`;
  await mas.updateSudo(jobQuery);
  return job;
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
  const jobSparql = rst.termToString(job);
  const now = literal(new Date().toISOString(), namedNode(cts.TYPES.dateTime));
  const nowSparql = rst.termToString(now);
  const errorTriple =
    status.value === cts.JOB_STATUSES.fail && error
      ? `${jobSparql} task:error ${rst.termToString(error)} .`
      : '';
  const statusQuery = `
    ${cts.SPARQL_PREFIXES}
    DELETE {
      GRAPH ?g {
        ${jobSparql}
          adms:status ?oldStatus ;
          dct:modified ?oldModified .
      }
    }
    INSERT {
      GRAPH ?g {
        ${jobSparql}
          adms:status ${rst.termToString(status)} ;
          dct:modified ${nowSparql} .
        ${errorTriple}
      }
    }
    WHERE {
      GRAPH ?g {
        ${jobSparql}
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
  const activitySparql = rst.termToString(activity);
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
