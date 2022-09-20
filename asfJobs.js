/**
 * @module asfJobs
 * @description Create and update Jobs in the triplestore, more specifically tailored for the automatic-submission-flow.
 */

import * as cts from './constants.js';
import * as N3 from 'n3';
import * as jbt from './jobs.js';
const { namedNode } = N3.DataFactory;

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
  const operation = namedNode(cts.OPERATIONS.automaticSubmissionFlow);
  const cogsOperation = namedNode(cts.COGS_OPERATION.transformation);
  return jbt.create(operation, activity, creator, cogsOperation, graph);
}

/**
 * Update the status of an existing Job in the triplestore with the possibility to also store an error on failure.
 *
 * @see jobs.updateStatus
 * @public
 * @async
 * @function
 * @param {namedNode} job - Represents the Job of which the status is to be updated.
 * @param {namedNode} status - The new status for this Job.
 * @param {namedNode} [error] - Only when the new status is to indicate failure: link the Job to this error entity.
 * @returns {undefined} Nothing
 */
export async function updateStatus() {
  return jbt.updateStatus(...arguments);
}

/**
 * Get information about the Job such as the type, status, the activity (submission, notification, ...) that led to the creation of this Job, and a potential error message and its type
 *
 * @see jobs.getStatusFromActivity
 * @public
 * @async
 * @function
 * @param {namedNode} activity - The resource (submission, notification, ...) that once triggered the creation of a Job.
 * @returns {store} A store containing information about the Job status, type, activity and optional error with its message.
 */
export async function getStatusFromActivity() {
  return jbt.getStatusFromActivity(...arguments);
}
